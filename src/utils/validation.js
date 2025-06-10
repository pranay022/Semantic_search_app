const Joi = require('joi');

const commonMessages = {
  'string.base': 'must be a string',
  'string.empty': 'cannot be empty',
  'any.required': 'is required',
  'object.base': 'must be an object',
  'array.base': 'must be an array'
};

const insertDocument = Joi.object({
  document: Joi.string().min(3).max(10000).required().messages({
    ...commonMessages,
    'string.min': 'document should be at least 3 characters long',
    'string.max': 'document cannot exceed 10000 characters'
  })
});

const bulkInsertDocuments = Joi.object({
  documents: Joi.array().items(
    Joi.object({
      content: Joi.string().min(3).max(10000).required().messages({
        ...commonMessages,
        'string.min': 'document content should be at least 3 characters long',
        'string.max': 'document content cannot exceed 10000 characters'
      })
    })
  )
});

const search = Joi.object({
  search: Joi.string().min(2).max(500).required().messages({
    ...commonMessages,
    'string.min': 'search should be at least 2 characters long',
    'string.max': 'search cannot exceed 500 characters'
  }),
  limit: Joi.number().integer().positive().max(50).default(10).messages({
    'number.base': 'limit must be a number',
    'number.max': 'limit cannot exceed 50',
    'number.positive': 'limit must be positive'
  }),
});


module.exports = {
  insertDocument,
  bulkInsertDocuments,
  search,
};
