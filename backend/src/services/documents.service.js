const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const documentsRepository = require('../repositories/documents.repository');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = process.env.MAX_FILE_SIZE_BYTES;
const maxFileSize = configuredMaxFileSize === undefined
  ? DEFAULT_MAX_FILE_SIZE_BYTES
  : Number(configuredMaxFileSize);

if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(documentsRepository.storageDirectory, { recursive: true }, (error) => {
        callback(error, documentsRepository.storageDirectory);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    }
  }),
  limits: { fileSize: maxFileSize }
}).single('file');

async function registerUpload(file) {
  const document = {
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: process.env.DEMO_OWNER_ID || 'demo-user',
    storedFilename: file.filename,
    mimeType: file.mimetype
  };

  try {
    return await documentsRepository.save(document);
  } catch (error) {
    await fsPromises.rm(file.path, { force: true }).catch(() => {});
    throw error;
  }
}

function listDocuments() {
  return documentsRepository.list();
}

function getDownload(id) {
  const document = documentsRepository.findById(id);
  if (!document) {
    return null;
  }

  return {
    document: documentsRepository.toPublicDocument(document),
    filePath: documentsRepository.getFilePath(document.storedFilename),
    mimeType: document.mimeType
  };
}

module.exports = {
  uploadMiddleware,
  registerUpload,
  listDocuments,
  getDownload
};