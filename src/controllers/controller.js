const services = require('../services/addDocument')
const {status} = require('http-status');

const insertDocument = async (req, res) => {
    const response = await services.insertDocument(req);
    if(response.error){
        return res.status(400).json({ error: response.error})
    }
    return res.status(200).json({ data: response})
}

const bulkInsertDocuments = async (req, res) => {
    const response = await services.bulkInsertDocuments(req);
    if(response.error){
        return res.status(400).json({ error: response.error})
    }
    return res.status(200).json({ data: response})
}

const semanticSearch = async (req, res) => {
    const response = await services.semanticSearch(req);
    if(response.error){
        return res.status(400).json({ error: response.error})
    }
    return res.status(200).json({ data: response})
}

const getAllDocuments = async (req, res) => {
    const response = await services.getAllDocuments();
    if(response.error){
        return res.status(400).json({ error: response.error})
    }
    return res.status(200).json({ data: response})
}

const deleteDocument = async (req, res) => {
    const response = await services.deleteDocument(req);
    if(response.error){
        return res.status(400).json({ error: response.error})
    }
    return res.status(200).json({ data: response})
}

module.exports = {
    semanticSearch,
    insertDocument,
    bulkInsertDocuments,
    getAllDocuments,
    deleteDocument,
}
