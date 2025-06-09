const express = require('express');
const router = express.Router();
const controller = require('../controllers/controller')
const validation = require('../utils/validation')
const validate = require('../middleware/validate');

router
    .route('/document')
    .post(
        validate(validation.insertDocument),
        controller.insertDocument
    );

router
    .route('/documents/bulk')
    .post(
        validate(validation.bulkInsertDocuments),
        controller.bulkInsertDocuments
    );

router
    .route('/search')
    .post(
        validate(validation.search),
        controller.semanticSearch
    );

module.exports = router;