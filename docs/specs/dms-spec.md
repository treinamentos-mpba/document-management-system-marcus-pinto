# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web simples para enviar, listar e baixar documentos, com arquivos armazenados no filesystem local e metadados mantidos em memória.

## 2. Escopo

### Dentro do escopo

- Receber um arquivo enviado pelo usuário.
- Gravar o arquivo localmente em `backend/storage`, usando `multer` com `diskStorage`.
- Manter os metadados dos documentos em memória durante a execução do backend.
- Listar os documentos disponíveis e baixar um documento pelo identificador.
- Atribuir os documentos a um dono de demonstração, sem autenticação nesta fase.
- Disponibilizar a API para o frontend pelo prefixo `/api` configurado no proxy do Vite.

### Fora do escopo

- Armazenamento em nuvem, serviços externos ou banco de dados.
- Autenticação, autorização e isolamento real de documentos entre usuários.
- Exclusão de documentos, versionamento, busca avançada ou compartilhamento.
- Persistência ou recuperação automática dos metadados após reiniciar o backend.
- Antivírus, análise de conteúdo e restrições por tipo MIME.

## 3. Requisitos funcionais

| ID    | Requisito |
| ----- | --------- |
| RF-01 | O cliente pode enviar um documento por `multipart/form-data`, no campo `file`. |
| RF-02 | O backend valida a presença do arquivo e aplica o limite de tamanho configurado. |
| RF-03 | O backend gera um identificador único e um nome de armazenamento interno, grava o arquivo em `backend/storage` e registra seus metadados em memória. |
| RF-04 | O backend atribui a cada documento o dono de demonstração configurado para a aplicação; o cliente não pode escolher esse valor no upload. |
| RF-05 | O cliente pode listar os metadados dos documentos registrados durante a execução atual do backend. |
| RF-06 | O cliente pode baixar um documento pelo seu identificador; o nome original é sugerido no download. |
| RF-07 | A API retorna respostas de erro consistentes para requisições inválidas, arquivos grandes demais e documentos inexistentes. |

## 4. Requisitos não funcionais

| ID     | Requisito |
| ------ | --------- |
| RNF-01 | O armazenamento dos arquivos é exclusivamente local, em `backend/storage`, por meio de `multer` configurado com `diskStorage`. |
| RNF-02 | Os metadados ficam em memória; reiniciar o processo remove o índice de documentos, embora os arquivos no filesystem possam permanecer. |
| RNF-03 | Configurações operacionais, incluindo porta, dono de demonstração e tamanho máximo de upload, são obtidas por variáveis de ambiente com valores padrão documentados. |
| RNF-04 | O limite padrão de upload é 10 MiB (`10485760` bytes), configurável por `MAX_FILE_SIZE_BYTES`; tipos de arquivo não são restringidos nesta fase. |
| RNF-05 | O nome de arquivo fornecido pelo cliente não é usado para construir o caminho de armazenamento. O identificador gerado pelo servidor mapeia o registro ao arquivo local. |
| RNF-06 | A implementação preserva a separação de responsabilidades `routes -> controllers -> services -> repositories`; as camadas internas não dependem de Express ou de detalhes HTTP. |
| RNF-07 | O frontend usa `fetch` e o prefixo `/api`; em desenvolvimento, o proxy do Vite encaminha as requisições ao backend. |
| RNF-08 | Erros esperados são tratados nos limites da aplicação e não expõem caminhos absolutos nem detalhes internos do filesystem ao cliente. |

## 5. Modelo de dados (metadados do documento)

### Documento exposto pela API

| Campo        | Tipo   | Descrição |
| ------------ | ------ | --------- |
| id           | string | Identificador único e opaco, gerado pelo backend (UUID). É a chave usada para localizar o documento. |
| originalName | string | Nome original fornecido pelo cliente; usado apenas como metadado e sugestão para o nome do download. |
| size         | number | Tamanho do arquivo em bytes, informado pelo armazenamento após o upload. |
| uploadedAt   | string | Data e hora do upload em ISO 8601 UTC. |
| owner        | string | Identificador do dono de demonstração atribuído pelo backend. Não representa uma identidade autenticada. |

### Registro interno de armazenamento

O repositório mantém, além dos campos públicos, o nome interno do arquivo gravado, por exemplo `storedFilename`, e o tipo MIME recebido, quando disponível. Esses dados são internos e não são incluídos nas respostas de listagem ou upload. O caminho absoluto pode ser resolvido a partir do diretório de storage e do nome interno; nunca deve ser derivado de `id` sem validação ou de `originalName`.

O dono é definido pela configuração `DEMO_OWNER_ID`, cujo padrão é `demo-user`. Como não há autenticação, todos os documentos desta fase recebem o mesmo dono e a API não oferece uma fronteira de segurança entre usuários.

## 6. Contratos de API

Os caminhos abaixo são relativos à origem do backend. No frontend em desenvolvimento, usar `/api` como prefixo, por exemplo `/api/documents`.

### Formato de erro

Respostas de erro usam `application/json` no formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

`code` é estável para tratamento pelo cliente; `message` é uma descrição segura para apresentação. O backend não retorna stack trace ou caminho local.

### POST /upload

- **Content-Type:** `multipart/form-data`.
- **Campo obrigatório:** `file`, com exatamente um arquivo.
- **Dono:** atribuído pelo servidor usando `DEMO_OWNER_ID`; não é aceito como campo controlado pelo cliente.
- **Validação:** rejeitar arquivo ausente ou requisição multipart inválida. Rejeitar tamanho acima de `MAX_FILE_SIZE_BYTES`.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.
- **Resposta de sucesso:** objeto de metadados do documento, sem o nome interno armazenado.

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-10-28T14:30:00.000Z",
  "owner": "demo-user"
}
```

| Status | Código de erro | Quando |
| ------ | -------------- | ------ |
| 400    | `FILE_REQUIRED` | Campo `file` ausente ou multipart inválido. |
| 413    | `FILE_TOO_LARGE` | Arquivo excede `MAX_FILE_SIZE_BYTES`. |
| 500    | `UPLOAD_FAILED` | Falha inesperada ao gravar arquivo ou registrar metadados. |

Se o arquivo for gravado, mas o registro dos metadados falhar, a implementação deve tentar remover o arquivo recém-criado para evitar um órfão. A resposta de erro não deve revelar detalhes internos.

### GET /documents

- **Entrada:** sem corpo e sem parâmetros obrigatórios.
- **Comportamento:** retorna os documentos registrados em memória no processo atual, ordenados do mais recente para o mais antigo. Sem paginação nesta fase.
- **Sucesso:** `200 OK`, `Content-Type: application/json`.
- **Resposta de sucesso:** array de objetos de metadados; array vazio quando não houver documentos.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-10-28T14:30:00.000Z",
    "owner": "demo-user"
  }
]
```

| Status | Código de erro | Quando |
| ------ | -------------- | ------ |
| 500    | `DOCUMENT_LIST_FAILED` | Falha inesperada ao consultar o repositório. |

### GET /documents/:id/download

- **Entrada:** `id` opaco do documento no segmento da rota.
- **Comportamento:** resolve o registro em memória e transmite o arquivo correspondente, sem aceitar caminhos fornecidos pelo cliente.
- **Sucesso:** `200 OK`, corpo binário; `Content-Disposition: attachment` com o nome original tratado com segurança. Usar o tipo MIME registrado quando disponível, ou `application/octet-stream` como fallback.
- **Metadados:** não são serializados junto ao corpo do arquivo.

| Status | Código de erro | Quando |
| ------ | -------------- | ------ |
| 404    | `DOCUMENT_NOT_FOUND` | O identificador não está registrado na execução atual. |
| 500    | `DOWNLOAD_FAILED` | Falha inesperada ao ler ou transmitir o arquivo. |

## 7. Decisões arquiteturais

- **Backend:** Node.js e Express em CommonJS. As rotas definem endpoints e delegam aos controllers; controllers tratam HTTP e validação básica; services concentram regras de negócio; repositories gerenciam metadados e acesso aos arquivos.
- **Upload:** `multer` com `diskStorage` grava exclusivamente em `backend/storage`. O nome original permanece como metadado; o nome interno é gerado pelo servidor.
- **Persistência:** os arquivos permanecem no filesystem local, enquanto os metadados são voláteis e mantidos em memória. Não há banco de dados nem recuperação de índice após reinício.
- **Identidade:** `DEMO_OWNER_ID` atribui um dono fixo a todos os documentos. Isso permite exercitar o campo `owner`, mas não equivale a login, autorização ou isolamento por usuário.
- **Frontend:** aplicação React organizada em componentes, páginas e serviços; chamadas HTTP feitas com `fetch` usando `/api` e proxy do Vite no desenvolvimento.
- **Configuração:** usar variáveis de ambiente, incluindo `PORT`, `DEMO_OWNER_ID` e `MAX_FILE_SIZE_BYTES`. O tamanho máximo padrão é 10 MiB.
- **Erros:** controllers ou middleware de borda convertem erros conhecidos em respostas HTTP consistentes; services e repositories não dependem do formato de resposta Express.
- **Limpeza:** se falhar o registro em memória após a gravação, tentar remover o arquivo criado nessa requisição. A reconciliação de arquivos órfãos após reinicializações fica fora desta fase.

## 8. Plano de execução

As etapas abaixo descrevem trabalho futuro orientado por esta especificação. Nesta entrega, somente este documento é produzido; não executar nem alterar arquivos de backend ou frontend.

1. **Especificação:** revisar e aprovar requisitos, modelo de dados, contratos e decisões deste documento.
2. **Backend - armazenamento e domínio:** implementar o repositório local, metadados em memória, geração de identificador e gravação com `multer`/`diskStorage`; cobrir limite de tamanho e limpeza em caso de falha.
3. **Backend - API:** implementar services, controllers e rotas para upload, listagem e download; padronizar status e respostas de erro.
4. **Backend - testes:** cobrir contratos HTTP, validações, arquivo ausente/grande, listagem vazia e preenchida, download válido/inexistente e falhas de persistência local.
5. **Frontend - integração:** criar serviço de API e interface para enviar documento, exibir listagem e iniciar download, mantendo chamadas pelo prefixo `/api`.
6. **Integração e validação:** executar backend e frontend localmente, verificar o fluxo completo e confirmar o tratamento de erros e o uso exclusivo do storage local.