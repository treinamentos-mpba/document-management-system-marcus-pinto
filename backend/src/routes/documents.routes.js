const express = require('express');
const documentsController = require('../controllers/documents.controller');
const uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

router.post('/upload', uploadMiddleware, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;