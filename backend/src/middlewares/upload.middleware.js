const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const multer = require('multer');
const storageDirectory = require('../config/storage');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const configuredMaxFileSize = process.env.MAX_FILE_SIZE_BYTES;
const maxFileSize = configuredMaxFileSize === undefined
  ? DEFAULT_MAX_FILE_SIZE_BYTES
  : Number(configuredMaxFileSize);

if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

module.exports = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdir(storageDirectory, { recursive: true }, (error) => {
        callback(error, storageDirectory);
      });
    },
    filename(req, file, callback) {
      callback(null, randomUUID());
    }
  }),
  limits: { fileSize: maxFileSize }
}).single('file');