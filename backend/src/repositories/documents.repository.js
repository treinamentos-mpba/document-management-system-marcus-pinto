const fsPromises = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = require('../config/storage');
const documents = new Map();

function toPublicDocument(document) {
  const { storedFilename, mimeType, ...publicDocument } = document;
  return publicDocument;
}

function save(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function list() {
  return Array.from(documents.values())
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt))
    .map(toPublicDocument);
}

function findById(id) {
  return documents.get(id) || null;
}

function getFilePath(storedFilename) {
  if (path.basename(storedFilename) !== storedFilename) {
    throw new Error('Nome de armazenamento inválido.');
  }

  return path.join(storageDirectory, storedFilename);
}

function removeStoredFile(storedFilename) {
  return fsPromises.rm(getFilePath(storedFilename), { force: true });
}

module.exports = {
  storageDirectory,
  save,
  list,
  findById,
  getFilePath,
  removeStoredFile,
  toPublicDocument
};