const Joi = require('joi');

// Common validation messages
const commonMessages = {
  'string.base': 'must be a string',
  'string.empty': 'cannot be empty',
  'any.required': 'is required',
  'object.base': 'must be an object',
  'array.base': 'must be an array'
};

// Document validation schema
const insertDocument = Joi.object({
  document: Joi.string().min(3).max(10000).required().messages({
    ...commonMessages,
    'string.min': 'document should be at least 3 characters long',
    'string.max': 'document cannot exceed 10000 characters'
  })
});

// Bulk insert validation schema
const bulkInsertDocuments = Joi.object({
  documents: Joi.array().items(
    Joi.object({
      content: Joi.string().min(3).max(10000).required().messages({
        ...commonMessages,
        'string.min': 'document content should be at least 3 characters long',
        'string.max': 'document content cannot exceed 10000 characters'
      }),
      metadata: Joi.object({
        author: Joi.string().max(100),
        date: Joi.date().iso(),
        category: Joi.string().max(50),
        tags: Joi.array().items(Joi.string().max(30)).max(10),
        custom: Joi.object().unknown()
      }).max(10).messages({
        'object.max': 'metadata cannot have more than 10 properties'
      })
    }).required()
  ).min(1).max(100).required().messages({
    ...commonMessages,
    'array.min': 'At least one document is required',
    'array.max': 'Maximum 100 documents can be uploaded at once'
  })
});

// Search validation schema
const search = Joi.object({
  query: Joi.string().min(2).max(500).required().messages({
    ...commonMessages,
    'string.min': 'query should be at least 2 characters long',
    'string.max': 'query cannot exceed 500 characters'
  }),
  limit: Joi.number().integer().positive().max(50).default(10).messages({
    'number.base': 'limit must be a number',
    'number.max': 'limit cannot exceed 50',
    'number.positive': 'limit must be positive'
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'offset must be a number',
    'number.min': 'offset cannot be negative'
  }),
  filters: Joi.object({
    dateRange: Joi.object({
      start: Joi.date().iso(),
      end: Joi.date().iso().min(Joi.ref('start'))
    }),
    categories: Joi.array().items(Joi.string()),
    authors: Joi.array().items(Joi.string())
  }).messages({
    'object.base': 'filters must be an object'
  })
});

// API Response schemas
const successResponse = Joi.object({
  success: Joi.boolean().valid(true).required(),
  data: Joi.alternatives().try(
    Joi.object(),
    Joi.array(),
    Joi.string(),
    Joi.number()
  ).required(),
  message: Joi.string(),
  timestamp: Joi.date().iso().required()
});

const errorResponse = Joi.object({
  success: Joi.boolean().valid(false).required(),
  error: Joi.object({
    code: Joi.string().required(),
    message: Joi.string().required(),
    details: Joi.array().items(Joi.object())
  }).required(),
  timestamp: Joi.date().iso().required()
});

// Validation helper functions
const validateRequest = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    allowUnknown: true
  });
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    };
  }
  
  return { isValid: true, value };
};

const formatResponse = (data, message = 'Success') => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

const formatError = (code, message, details = []) => {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  insertDocument,
  bulkInsertDocuments,
  search,
  successResponse,
  errorResponse,
  validateRequest,
  formatResponse,
  formatError
};
