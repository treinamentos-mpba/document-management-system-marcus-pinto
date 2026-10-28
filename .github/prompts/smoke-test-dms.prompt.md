---
name: smoke-test-dms
description: "Valida backend e frontend do DMS com verificações locais e sem deixar documentos de teste persistidos."
argument-hint: alvo (backend, frontend ou integração)
agent: agent
---

# Smoke test do DMS

Valide o alvo `${input:alvo:backend, frontend ou integração}` neste repositório. Se o alvo não for informado, valide backend e frontend.

## Fluxo

1. Leia as instruções do projeto e confira os scripts e endpoints existentes antes de executar comandos. Preserve alterações locais e não instale dependências sem necessidade.
2. Para `backend`, execute `npm test` em `backend/`. Informe os totais e falhas do runner nativo `node:test`.
3. Para `frontend`, execute `npm run build` em `frontend/`.
4. Para `integração`, execute as verificações de backend e frontend. Se os servidores já estiverem disponíveis, confira `GET /health` e `GET /api/documents` pelo proxy do Vite.
5. Não envie arquivos de demonstração para uma instância em execução: o DMS não tem endpoint de exclusão e o upload altera o filesystem local. Use os testes automatizados para validar upload e download, pois eles devem limpar os próprios artefatos temporários.
6. Se uma verificação falhar, reporte o erro concreto e proponha a menor ação corretiva. Só altere código se o usuário também solicitar a correção.

## Limites

- Não modificar arquivos, instalar dependências, iniciar servidores persistentes, fazer commits ou publicar branches.
- Não acessar provedores externos; o armazenamento de documentos é local.
- Não afirmar que uma verificação passou se ela não foi executada. Diferencie resultado observado de recomendação.

## Relatório

Resuma o alvo verificado, os comandos executados, resultados observados e qualquer limitação que tenha impedido uma verificação.