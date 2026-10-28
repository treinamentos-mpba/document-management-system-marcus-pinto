import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setListError('');

    listDocuments()
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((error) => {
        if (active) setListError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function handleUpload(file) {
    const document = await uploadDocument(file);
    setDocuments((current) => [document, ...current.filter((item) => item.id !== document.id)]);
    setNotice(`${document.originalName} foi enviado.`);
  }

  function refreshDocuments() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Acervo, início">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>ARQUIVO<span className="brand-divider">/</span>DMS</span>
        </a>
        <div className="storage-status">
          <span className="status-dot" aria-hidden="true" />
          <span>ARMAZENAMENTO LOCAL</span>
        </div>
      </header>

      <main id="inicio" className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ESPAÇO DE TRABALHO</p>
            <h1>Acervo</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{documents.length.toString().padStart(2, '0')}</span>
            <span className="count-label">{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>

        {notice && (
          <p className="success-notice" role="status">
            <span aria-hidden="true">✓</span> {notice}
            <button type="button" onClick={() => setNotice('')} aria-label="Dispensar aviso">
              Fechar
            </button>
          </p>
        )}

        <div className="workspace-grid">
          <UploadComponent onUpload={handleUpload} />
          <DocumentList
            documents={documents}
            loading={loading}
            error={listError}
            onRefresh={refreshDocuments}
          />
        </div>
      </main>

      <footer className="app-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>METADADOS EM MEMÓRIA</span>
      </footer>
    </div>
  );
}
