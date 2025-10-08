// Standardize API responses
const formatResponse = (req, res, next) => {
  // Success response helper
  res.success = (data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  // Error response helper
  res.error = (message = 'Internal Server Error', statusCode = 500, errors = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  // Paginated response helper
  res.paginated = (data, pagination, message = 'Success') => {
    res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString(),
      path: req.path
    });
  };

  next();
};

module.exports = { formatResponse };
