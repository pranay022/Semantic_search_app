const services = require('../services/addDocument')
const {status} = require('http-status');

const insertDocument = async (req, res) => {
    const response = await services.insertDocument(req);
    res.status(status.OK).send({
        data: response
    })
}

const bulkInsertDocuments = async (req, res) => {
    const response = await services.bulkInsertDocuments(req);
    res.status(status.OK).send({
        data: response
    })
}

const semanticSearch = async (req, res) => {
    const response = await services.semanticSearch(req);
    res.status(status.OK).send({
        data: response
    })
}

module.exports = {
    semanticSearch,
    insertDocument,
    bulkInsertDocuments
}
