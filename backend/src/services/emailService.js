const nodemailer = require('nodemailer')

// Email service for sending notifications and transactional emails
class EmailService {
  constructor() {
    this.transporter = null
    this.isInitialized = false
  }

  // Initialize email transporter
  initialize() {
    if (this.isInitialized) return

    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }

    // In test environment, use a mock transporter
    if (process.env.NODE_ENV === 'test') {
      this.transporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
    } else {
      this.transporter = nodemailer.createTransporter(config)
    }

    this.isInitialized = true
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    this.initialize()

    const mailOptions = {
      from: `"CollabTask Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Welcome to CollabTask! 🎉',
      html: this.generateWelcomeEmailHTML(user),
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Welcome email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      throw new Error('Failed to send welcome email')
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    this.initialize()

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`

    const mailOptions = {
      from: `"CollabTask Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: this.generatePasswordResetEmailHTML(user, resetUrl),
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Password reset email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw new Error('Failed to send password reset email')
    }
  }

  // Send notification email
  async sendNotificationEmail(user, notification) {
    this.initialize()

    const mailOptions = {
      from: `"CollabTask Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `CollabTask: ${notification.title}`,
      html: this.generateNotificationEmailHTML(user, notification),
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Notification email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending notification email:', error)
      throw new Error('Failed to send notification email')
    }
  }

  // Send task assignment notification
  async sendTaskAssignmentEmail(user, task, assignedBy) {
    this.initialize()

    const mailOptions = {
      from: `"CollabTask Team" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `New Task Assigned: ${task.title}`,
      html: this.generateTaskAssignmentEmailHTML(user, task, assignedBy),
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Task assignment email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending task assignment email:', error)
      throw new Error('Failed to send task assignment email')
    }
  }

  // Send workspace invitation email
  async sendWorkspaceInvitationEmail(email, workspace, inviter) {
    this.initialize()

    const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?workspace=${workspace._id}&email=${email}`

    const mailOptions = {
      from: `"CollabTask Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `You're invited to join ${workspace.name}`,
      html: this.generateWorkspaceInvitationEmailHTML(email, workspace, inviter, acceptUrl),
    }

    try {
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Workspace invitation email sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('Error sending workspace invitation email:', error)
      throw new Error('Failed to send workspace invitation email')
    }
  }

  // HTML email templates
  generateWelcomeEmailHTML(user) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to CollabTask</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to CollabTask!</h1>
              <p>Your journey to better team collaboration starts now</p>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName}!</h2>
              <p>Thank you for joining CollabTask. We're excited to help you and your team work more efficiently together.</p>

              <h3>What's next?</h3>
              <ul>
                <li><strong>Create your first workspace</strong> - Set up a space for your team</li>
                <li><strong>Invite team members</strong> - Get your colleagues on board</li>
                <li><strong>Create your first task</strong> - Start organizing your work</li>
                <li><strong>Explore real-time features</strong> - Experience live collaboration</li>
              </ul>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Get Started</a>

              <p>If you have any questions, feel free to reply to this email or visit our <a href="${process.env.FRONTEND_URL}/help">help center</a>.</p>
            </div>
            <div class="footer">
              <p>© 2024 CollabTask. All rights reserved.</p>
              <p>You received this email because you signed up for CollabTask.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  generatePasswordResetEmailHTML(user, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>You requested a password reset for your CollabTask account. Click the button below to reset your password:</p>

              <a href="${resetUrl}" class="button">Reset Password</a>

              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
              </div>

              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>

              <p>For security reasons, this link can only be used once.</p>
            </div>
            <div class="footer">
              <p>© 2024 CollabTask. All rights reserved.</p>
              <p>If you didn't request this password reset, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  generateNotificationEmailHTML(user, notification) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>${notification.message}</p>

              ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="button">${notification.actionText || 'View Details'}</a>` : ''}

              <p>You can also <a href="${process.env.FRONTEND_URL}/dashboard">access your dashboard</a> to see all your notifications.</p>
            </div>
            <div class="footer">
              <p>© 2024 CollabTask. All rights reserved.</p>
              <p>You can <a href="${process.env.FRONTEND_URL}/settings/notifications">manage your notification preferences</a> anytime.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  generateTaskAssignmentEmailHTML(user, task, assignedBy) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Task Assigned</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4caf50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .task-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4caf50; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Task Assigned</h1>
            </div>
            <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p><strong>${assignedBy.firstName} ${assignedBy.lastName}</strong> has assigned you a new task:</p>

              <div class="task-details">
                <h3>${task.title}</h3>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <p><strong>Priority:</strong> ${task.priority || 'Medium'}</p>
                ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
              </div>

              <a href="${process.env.FRONTEND_URL}/tasks/${task._id}" class="button">View Task</a>

              <p>You can also access your <a href="${process.env.FRONTEND_URL}/dashboard">dashboard</a> to see all your tasks.</p>
            </div>
            <div class="footer">
              <p>© 2024 CollabTask. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  generateWorkspaceInvitationEmailHTML(email, workspace, inviter, acceptUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Workspace Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .workspace-info { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Workspace Invitation</h1>
            </div>
            <div class="content">
              <h2>You're invited to join a workspace!</h2>
              <p><strong>${inviter.firstName} ${inviter.lastName}</strong> has invited you to join their team on CollabTask.</p>

              <div class="workspace-info">
                <h3>${workspace.name}</h3>
                ${workspace.description ? `<p>${workspace.description}</p>` : ''}
                <p><strong>Invited by:</strong> ${inviter.firstName} ${inviter.lastName} (${inviter.email})</p>
              </div>

              <a href="${acceptUrl}" class="button">Accept Invitation</a>

              <p>Join your team to start collaborating on projects, managing tasks, and working together in real-time.</p>

              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p><a href="${acceptUrl}">${acceptUrl}</a></p>
            </div>
            <div class="footer">
              <p>© 2024 CollabTask. All rights reserved.</p>
              <p>This invitation will expire in 7 days.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
}

module.exports = new EmailService()