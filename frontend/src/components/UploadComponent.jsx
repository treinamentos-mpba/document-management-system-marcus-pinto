import { useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  function chooseFile(candidate) {
    if (!candidate) return;

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setError('O arquivo excede o limite de 10 MB.');
      return;
    }

    setError('');
    setFile(candidate);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="section-kicker">
        <span className="section-index">01</span>
        <span>NOVO DOCUMENTO</span>
      </div>
      <h2 id="upload-title">Adicionar ao acervo</h2>

      <form onSubmit={handleSubmit}>
        <label
          className={`drop-zone${dragging ? ' is-dragging' : ''}${file ? ' has-file' : ''}`}
          htmlFor="document-file"
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            id="document-file"
            type="file"
            className="visually-hidden"
            onChange={(event) => chooseFile(event.target.files[0])}
          />
          <span className="upload-symbol" aria-hidden="true">+</span>
          {file ? (
            <>
              <span className="drop-title file-name">{file.name}</span>
              <span className="drop-hint">{formatFileSize(file.size)}</span>
            </>
          ) : (
            <>
              <span className="drop-title">Escolher arquivo</span>
              <span className="drop-hint">ou arraste até aqui · até 10 MB</span>
            </>
          )}
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="primary-button upload-button" type="submit" disabled={uploading}>
          {uploading ? 'Enviando...' : 'Enviar documento'}
          {!uploading && <span aria-hidden="true">↗</span>}
        </button>
      </form>

      <p className="upload-footnote">ARQUIVOS LOCAIS · METADADOS VOLÁTEIS</p>
    </section>
  );
}