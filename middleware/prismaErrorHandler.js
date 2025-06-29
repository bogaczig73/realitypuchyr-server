/**
 * Middleware to handle Prisma errors and convert them to user-friendly messages
 */
const handlePrismaError = (error) => {
  // Handle unique constraint violations
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return {
      status: 400,
      error: 'Validation error',
      message: `A record with this ${field} already exists`,
      field
    };
  }
  
  // Handle foreign key constraint violations
  if (error.code === 'P2003') {
    const field = error.meta?.field_name || 'reference';
    return {
      status: 400,
      error: 'Validation error',
      message: `Invalid reference: The specified ${field} does not exist`,
      field
    };
  }
  
  // Handle record not found
  if (error.code === 'P2025') {
    return {
      status: 404,
      error: 'Not found',
      message: 'The requested record was not found'
    };
  }
  
  // Handle Prisma type validation errors
  if (error.message && error.message.includes('Invalid value provided')) {
    const fieldMatch = error.message.match(/Argument `(\w+)`: Invalid value provided\. Expected (\w+), provided (\w+)\./);
    if (fieldMatch) {
      const [, fieldName, expectedType, providedType] = fieldMatch;
      return {
        status: 400,
        error: 'Validation error',
        message: `Invalid data type for field '${fieldName}'. Expected ${expectedType}, but received ${providedType}.`,
        field: fieldName,
        expectedType,
        providedType
      };
    }
  }
  
  // Handle other Prisma errors
  if (error.message && error.message.includes('prisma.')) {
    return {
      status: 400,
      error: 'Database validation error',
      message: 'The provided data is invalid. Please check all required fields and data types.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
  
  // Default error response
  return {
    status: 500,
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  };
};

/**
 * Express middleware to handle Prisma errors
 */
const prismaErrorHandler = (error, req, res, next) => {
  // Check if it's a Prisma error
  if (error.code?.startsWith('P') || error.message?.includes('prisma.')) {
    const errorResponse = handlePrismaError(error);
    return res.status(errorResponse.status).json(errorResponse);
  }
  
  // Pass to next error handler if not a Prisma error
  next(error);
};

module.exports = {
  handlePrismaError,
  prismaErrorHandler
}; 