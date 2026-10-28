// Testes dedicados por endpoint: POST /upload, GET /documents e
// GET /documents/:id/download. Cada arquivo de teste roda em processo
// próprio, então os metadados em memória não vazam para outros arquivos.
const { once } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const { after, before, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

const storageDirectory = path.resolve(__dirname, '../storage');
const uploadedIds = [];
let server;
let baseUrl;

async function uploadDocument(filename, content) {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), filename);

  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  const document = response.status === 201 ? await response.json() : null;

  if (document) {
    uploadedIds.push(document.id);
  }

  return { response, document };
}

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await Promise.all(
    uploadedIds.map((id) => fs.rm(path.join(storageDirectory, id), { force: true }))
  );

  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

describe('POST /upload', () => {
  test('retorna 201 com os metadados públicos do documento', async () => {
    const content = 'conteúdo do upload';
    const { response, document } = await uploadDocument('upload-teste.txt', content);

    assert.equal(response.status, 201);
    assert.match(document.id, /^[0-9a-f-]{36}$/i);
    assert.equal(document.originalName, 'upload-teste.txt');
    assert.equal(document.size, Buffer.byteLength(content));
    assert.equal(document.owner, process.env.DEMO_OWNER_ID || 'demo-user');
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    assert.equal(Object.hasOwn(document, 'storedFilename'), false);
    assert.equal(Object.hasOwn(document, 'mimeType'), false);
  });

  test('grava o arquivo enviado em backend/storage', async () => {
    const content = 'arquivo persistido localmente';
    const { document } = await uploadDocument('persistencia-teste.txt', content);

    const storedContent = await fs.readFile(path.join(storageDirectory, document.id), 'utf8');
    assert.equal(storedContent, content);
  });

  test('retorna 400 com FILE_REQUIRED quando o arquivo não é enviado', async () => {
    const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });

    assert.equal(response.status, 400);
    assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
  });
});

describe('GET /documents', () => {
  test('retorna 200 com os documentos enviados, do mais recente para o mais antigo', async () => {
    const { document: first } = await uploadDocument('listagem-1.txt', 'primeiro');
    const { document: second } = await uploadDocument('listagem-2.txt', 'segundo');

    const response = await fetch(`${baseUrl}/documents`);
    assert.equal(response.status, 200);

    const documents = await response.json();
    const ids = documents.map((item) => item.id);
    assert.ok(ids.includes(first.id));
    assert.ok(ids.includes(second.id));
    assert.ok(ids.indexOf(second.id) <= ids.indexOf(first.id));

    for (const item of documents) {
      assert.equal(Object.hasOwn(item, 'storedFilename'), false);
      assert.equal(Object.hasOwn(item, 'mimeType'), false);
    }
  });
});

describe('GET /documents/:id/download', () => {
  test('retorna 200 com o conteúdo e o nome original do arquivo', async () => {
    const content = 'conteúdo para download';
    const { document } = await uploadDocument('download-teste.txt', content);

    const response = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-disposition'), /download-teste\.txt/);
    assert.equal(await response.text(), content);
  });

  test('retorna 404 com DOCUMENT_NOT_FOUND para id inexistente', async () => {
    const response = await fetch(
      `${baseUrl}/documents/00000000-0000-4000-8000-000000000000/download`
    );

    assert.equal(response.status, 404);
    assert.equal((await response.json()).error.code, 'DOCUMENT_NOT_FOUND');
  });
});
