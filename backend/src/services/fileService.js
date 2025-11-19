const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

// File service for handling file uploads and storage
class FileService {
  constructor() {
    this.s3 = null
    this.isInitialized = false
    this.storageType = process.env.FILE_STORAGE_TYPE || 'local' // 'local' or 's3'
  }

  // Initialize storage service
  initialize() {
    if (this.isInitialized) return

    if (this.storageType === 's3') {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      })

      this.s3 = new AWS.S3()
    }

    this.isInitialized = true
  }

  // Upload file to storage
  async uploadFile(fileBuffer, fileName, mimeType, options = {}) {
    this.initialize()

    const fileId = uuidv4()
    const extension = path.extname(fileName)
    const baseName = path.basename(fileName, extension)
    const uniqueFileName = `${fileId}-${baseName}${extension}`

    if (this.storageType === 's3') {
      return this.uploadToS3(fileBuffer, uniqueFileName, mimeType, options)
    } else {
      return this.uploadToLocal(fileBuffer, uniqueFileName, options)
    }
  }

  // Upload to AWS S3
  async uploadToS3(fileBuffer, fileName, mimeType, options) {
    const bucketName = process.env.AWS_S3_BUCKET_NAME
    const key = options.path ? `${options.path}/${fileName}` : fileName

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'private', // Files are private by default
    }

    // Add metadata if provided
    if (options.metadata) {
      uploadParams.Metadata = options.metadata
    }

    try {
      const result = await this.s3.upload(uploadParams).promise()

      return {
        success: true,
        fileId: uuidv4(),
        fileName: fileName,
        originalName: options.originalName || fileName,
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        size: fileBuffer.length,
        mimeType: mimeType,
        storage: 's3',
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload file to S3')
    }
  }

  // Upload to local storage
  async uploadToLocal(fileBuffer, fileName, options) {
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
    const filePath = path.join(uploadDir, fileName)

    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    try {
      await fs.promises.writeFile(filePath, fileBuffer)

      const baseUrl = process.env.BASE_URL || 'http://localhost:5000'
      const url = `${baseUrl}/uploads/${fileName}`

      return {
        success: true,
        fileId: uuidv4(),
        fileName: fileName,
        originalName: options.originalName || fileName,
        url: url,
        path: filePath,
        size: fileBuffer.length,
        mimeType: options.mimeType || 'application/octet-stream',
        storage: 'local',
      }
    } catch (error) {
      console.error('Local upload error:', error)
      throw new Error('Failed to upload file locally')
    }
  }

  // Delete file from storage
  async deleteFile(fileInfo) {
    this.initialize()

    if (fileInfo.storage === 's3') {
      return this.deleteFromS3(fileInfo)
    } else {
      return this.deleteFromLocal(fileInfo)
    }
  }

  // Delete from AWS S3
  async deleteFromS3(fileInfo) {
    const deleteParams = {
      Bucket: fileInfo.bucket || process.env.AWS_S3_BUCKET_NAME,
      Key: fileInfo.key,
    }

    try {
      await this.s3.deleteObject(deleteParams).promise()
      return { success: true }
    } catch (error) {
      console.error('S3 delete error:', error)
      throw new Error('Failed to delete file from S3')
    }
  }

  // Delete from local storage
  async deleteFromLocal(fileInfo) {
    try {
      if (fs.existsSync(fileInfo.path)) {
        await fs.promises.unlink(fileInfo.path)
      }
      return { success: true }
    } catch (error) {
      console.error('Local delete error:', error)
      throw new Error('Failed to delete local file')
    }
  }

  // Get file URL (for generating signed URLs for private files)
  async getFileUrl(fileInfo, expiresIn = 3600) {
    this.initialize()

    if (fileInfo.storage === 's3') {
      return this.getSignedS3Url(fileInfo, expiresIn)
    } else {
      return { url: fileInfo.url, expiresAt: null }
    }
  }

  // Generate signed URL for S3 private files
  async getSignedS3Url(fileInfo, expiresIn) {
    const signedUrlParams = {
      Bucket: fileInfo.bucket || process.env.AWS_S3_BUCKET_NAME,
      Key: fileInfo.key,
      Expires: expiresIn,
    }

    try {
      const signedUrl = await this.s3.getSignedUrlPromise('getObject', signedUrlParams)
      const expiresAt = new Date(Date.now() + (expiresIn * 1000))

      return {
        url: signedUrl,
        expiresAt: expiresAt,
      }
    } catch (error) {
      console.error('S3 signed URL error:', error)
      throw new Error('Failed to generate signed URL')
    }
  }

  // Validate file type and size
  validateFile(file, options = {}) {
    const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
    const allowedTypes = options.allowedTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    // Check file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`)
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`)
    }

    return true
  }

  // Process file upload from multer
  async processUpload(file, options = {}) {
    try {
      // Validate file
      this.validateFile(file, options)

      // Upload file
      const result = await this.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          originalName: file.originalname,
          path: options.path,
          metadata: options.metadata,
        }
      )

      return result
    } catch (error) {
      console.error('File processing error:', error)
      throw error
    }
  }

  // Batch upload multiple files
  async batchUpload(files, options = {}) {
    const results = []
    const errors = []

    for (const file of files) {
      try {
        const result = await this.processUpload(file, options)
        results.push(result)
      } catch (error) {
        errors.push({
          file: file.originalname,
          error: error.message,
        })
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalFiles: files.length,
      successfulUploads: results.length,
      failedUploads: errors.length,
    }
  }

  // Get file metadata
  async getFileMetadata(fileInfo) {
    if (fileInfo.storage === 's3') {
      return this.getS3Metadata(fileInfo)
    } else {
      return this.getLocalMetadata(fileInfo)
    }
  }

  // Get S3 file metadata
  async getS3Metadata(fileInfo) {
    const headParams = {
      Bucket: fileInfo.bucket || process.env.AWS_S3_BUCKET_NAME,
      Key: fileInfo.key,
    }

    try {
      const metadata = await this.s3.headObject(headParams).promise()
      return {
        size: metadata.ContentLength,
        lastModified: metadata.LastModified,
        etag: metadata.ETag,
        contentType: metadata.ContentType,
        metadata: metadata.Metadata,
      }
    } catch (error) {
      console.error('S3 metadata error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  // Get local file metadata
  async getLocalMetadata(fileInfo) {
    try {
      const stats = await fs.promises.stat(fileInfo.path)
      return {
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime,
      }
    } catch (error) {
      console.error('Local metadata error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  // Clean up old files (for maintenance)
  async cleanupOldFiles(olderThanDays = 30) {
    // This would be implemented based on your cleanup requirements
    // For now, return a placeholder
    console.log(`Cleanup old files (older than ${olderThanDays} days) - Not implemented yet`)
    return { success: true, message: 'Cleanup not implemented' }
  }

  // Get storage usage statistics
  async getStorageStats() {
    // This would aggregate storage usage across all files
    // For now, return placeholder stats
    return {
      totalFiles: 0,
      totalSize: 0,
      storageType: this.storageType,
      lastUpdated: new Date(),
    }
  }
}

module.exports = new FileService()