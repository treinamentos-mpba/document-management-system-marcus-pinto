import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(filename) {
  const extension = filename.split('.').pop();
  return filename.includes('.') && extension ? extension.slice(0, 4).toUpperCase() : 'FILE';
}

export default function DocumentList({ documents, loading, error, onRefresh }) {
  return (
    <section className="documents-panel" aria-labelledby="documents-title">
      <div className="documents-heading">
        <div>
          <div className="section-kicker">
            <span className="section-index">02</span>
            <span>COLEÇÃO</span>
          </div>
          <h2 id="documents-title">Documentos</h2>
        </div>
        <button className="refresh-button" type="button" onClick={onRefresh} disabled={loading}>
          <span aria-hidden="true">↻</span> Atualizar
        </button>
      </div>

      <div className="list-columns" aria-hidden="true">
        <span>ARQUIVO</span>
        <span>DATA DE ENVIO</span>
        <span />
      </div>

      {loading ? (
        <p className="list-state" role="status">Carregando documentos...</p>
      ) : error ? (
        <div className="list-state error-state" role="alert">
          <p>{error}</p>
          <button type="button" className="text-button" onClick={onRefresh}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <div className="list-state empty-state">
          <span className="empty-mark" aria-hidden="true">0</span>
          <p>Nenhum documento no acervo.</p>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <div className="document-file">
                <span className="file-type" aria-hidden="true">{getFileExtension(document.originalName)}</span>
                <div className="file-description">
                  <span className="file-title" title={document.originalName}>{document.originalName}</span>
                  <span className="file-size">{formatFileSize(document.size)} · {document.owner}</span>
                </div>
              </div>
              <time className="document-date" dateTime={document.uploadedAt}>
                {dateFormatter.format(new Date(document.uploadedAt))}
              </time>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}

      <div className="list-summary">
        <span>{documents.length === 1 ? '1 ITEM' : `${documents.length} ITENS`}</span>
        <span>SESSÃO ATUAL</span>
      </div>
    </section>
  );
}