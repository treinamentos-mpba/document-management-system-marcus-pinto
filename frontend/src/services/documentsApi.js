const API_PREFIX = '/api';

async function readError(response, fallback) {
  try {
    const body = await response.json();
    return body?.error?.message || fallback;
  } catch {
    return fallback;
  }
}

async function requestJson(path, options) {
  const response = await fetch(`${API_PREFIX}${path}`, options);
  if (!response.ok) {
    throw new Error(await readError(response, 'Não foi possível concluir a solicitação.'));
  }

  return response.json();
}

export function listDocuments() {
  return requestJson('/documents');
}

export function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson('/upload', {
    method: 'POST',
    body: formData
  });
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    throw new Error(await readError(response, 'Não foi possível baixar o documento.'));
  }

  const disposition = response.headers.get('content-disposition') || '';
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = plainFilename || 'documento';

  if (encodedFilename) {
    try {
      filename = decodeURIComponent(encodedFilename);
    } catch {
      filename = plainFilename || 'documento';
    }
  }

  return { blob: await response.blob(), filename };
}