const documentsRepository = require('../repositories/documents.repository');

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
    await documentsRepository.removeStoredFile(file.filename).catch(() => {});
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
  registerUpload,
  listDocuments,
  getDownload
};