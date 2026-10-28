const { once } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('upload, listagem e download de documentos', async () => {
  const server = app.listen(0);
  let uploadedId;

  try {
    await once(server, 'listening');
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const content = 'conteúdo de teste do documento';
    const form = new FormData();
    form.append('file', new Blob([content], { type: 'text/plain' }), 'documento-teste.txt');

    const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
    assert.equal(uploadResponse.status, 201);
    const document = await uploadResponse.json();
    uploadedId = document.id;

    assert.match(document.id, /^[0-9a-f-]{36}$/i);
    assert.equal(document.originalName, 'documento-teste.txt');
    assert.equal(document.size, Buffer.byteLength(content));
    assert.equal(document.owner, process.env.DEMO_OWNER_ID || 'demo-user');
    assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
    assert.equal(Object.hasOwn(document, 'storedFilename'), false);

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.equal(listResponse.status, 200);
    assert.deepEqual(await listResponse.json(), [document]);

    const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /documento-teste\.txt/);
    assert.equal(await downloadResponse.text(), content);

    const missingFileForm = new FormData();
    const missingFileResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: missingFileForm
    });
    assert.equal(missingFileResponse.status, 400);
    assert.equal((await missingFileResponse.json()).error.code, 'FILE_REQUIRED');

    const missingDocumentResponse = await fetch(
      `${baseUrl}/documents/00000000-0000-4000-8000-000000000000/download`
    );
    assert.equal(missingDocumentResponse.status, 404);
    assert.equal((await missingDocumentResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
  } finally {
    if (uploadedId) {
      await fs.rm(path.resolve(__dirname, '../storage', uploadedId), { force: true });
    }

    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});