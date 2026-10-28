const documentsService = require('../services/documents.service');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

async function upload(req, res, next) {
  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = await documentsService.registerUpload(req.file);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res) {
  try {
    const documents = await documentsService.listDocuments();
    return res.status(200).json(documents);
  } catch (error) {
    return sendError(res, 500, 'DOCUMENT_LIST_FAILED', 'Não foi possível listar os documentos.');
  }
}

function download(req, res, next) {
  let result;
  try {
    result = documentsService.getDownload(req.params.id);
  } catch (error) {
    return next(error);
  }

  if (!result) {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  res.type(result.mimeType || 'application/octet-stream');
  return res.download(result.filePath, result.document.originalName, (error) => {
    if (!error) {
      return;
    }

    if (error.code === 'ENOENT' && !res.headersSent) {
      return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    if (res.headersSent) {
      return next(error);
    }

    return sendError(res, 500, 'DOWNLOAD_FAILED', 'Não foi possível baixar o documento.');
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 413, 'FILE_TOO_LARGE', 'O arquivo excede o tamanho máximo permitido.');
    }

    return sendError(res, 400, 'INVALID_UPLOAD', 'A requisição de upload é inválida.');
  }

  return sendError(res, 500, 'UPLOAD_FAILED', 'Não foi possível processar a requisição.');
}

module.exports = {
  upload,
  list,
  download,
  handleError
};