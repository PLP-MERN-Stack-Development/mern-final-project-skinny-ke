// Success response utility
export const successResponse = (res, message, data = null, statusCode = 200, meta = {}) => {
  const response = {
    success: true,
    message,
    ...(data && { data }),
    ...meta,
  };

  return res.status(statusCode).json(response);
};

// Error response utility
export const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    error: {
      message,
      ...(errors && { details: errors }),
    },
  };

  return res.status(statusCode).json(response);
};

// Pagination response utility
export const paginationResponse = (res, message, data, pagination, statusCode = 200) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1,
    },
  };

  return res.status(statusCode).json(response);
};

// Created response utility
export const createdResponse = (res, message, data = null) => {
  return successResponse(res, message, data, 201);
};

// No content response utility
export const noContentResponse = (res) => {
  return res.status(204).send();
};

// Validation error response utility
export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, 'Validation failed', 422, errors);
};

// Unauthorized response utility
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

// Forbidden response utility
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

// Not found response utility
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, 404);
};

// Conflict response utility
export const conflictResponse = (res, message = 'Resource conflict') => {
  return errorResponse(res, message, 409);
};

// Too many requests response utility
export const tooManyRequestsResponse = (res, message = 'Too many requests') => {
  return errorResponse(res, message, 429);
};