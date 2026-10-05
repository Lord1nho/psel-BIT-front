# Portal de Solicitações Internas (front-end)

SPA em React do portal de solicitações internas (processo seletivo BIT). Consome a API do repositório [**psel-BIT-back**](https://github.com/Lord1nho/psel-BIT-back) (NestJS + Prisma + PostgreSQL), que **precisa estar rodando** para o front funcionar.

## O que o sistema faz

- Login com perfis **Solicitante** e **Atendente** (JWT).
- Solicitante: abre, edita e exclui as próprias solicitações (enquanto abertas) e conversa com o atendente.
- Atendente: vê todas as solicitações, filtra (status, setor, atendimento, período, busca), assume, atende e conclui chamados.
- Comentários dentro do chamado, com atualização automática.
- Dashboard com indicadores e gráficos por status, setor e período.
- Layout responsivo, validação dos campos de texto e telas de erro padronizadas.

## Tecnologias

React 19 · Vite 8 · React Router 7 · TanStack Query · Recharts · Motion · lucide-react · Oxlint

## Como executar

### Opção 1 — Tudo com Docker (recomendada)

O `docker-compose.yml` fica no repositório do **back-end** e sobe banco, API e este front. Pré-requisito: Docker com Compose (sem Node, sem Postgres, sem `.env`).

```bash
git clone https://github.com/Lord1nho/psel-BIT-back.git
cd psel-BIT-back
docker compose up --build
```

Quando os serviços estiverem `healthy`:

| O quê | Endereço |
|---|---|
| Front | http://localhost:5173 |
| API | http://localhost:3000 |

Para parar: `docker compose down` (mantém os dados) ou `docker compose down -v` (apaga o banco). Variáveis opcionais (portas, dados de demonstração etc.) estão no [README do back-end](https://github.com/Lord1nho/psel-BIT-back#como-executar-docker).

### Opção 2 — Front local (desenvolvimento)

1. **Suba o back-end** seguindo o [README do psel-BIT-back](https://github.com/Lord1nho/psel-BIT-back) (a API deve responder em `http://localhost:3000`).
2. Instale e rode o front (Node.js 20.19 ou superior; a imagem Docker usa o 24):

```bash
git clone https://github.com/Lord1nho/psel-BIT-front.git
cd psel-BIT-front
npm install
cp .env.example .env     # opcional: os padrões já funcionam com a API local
npm run dev
```

Acesse http://localhost:5173.

> Se o front do Docker (Opção 1) estiver rodando, ele já ocupa a porta 5173: pare-o (`docker compose stop front`) ou rode o Vite em outra porta (`npm run dev -- --port 5174`).

## Configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | URL da API **vista pelo navegador**. É gravada no bundle em tempo de build/dev: ao mudar, reinicie o `npm run dev` ou refaça o build. |

## Usuários de teste

Senha de todos: `123456` (criados pelo seed do back-end).

| Usuário | Perfil |
|---|---|
| `solicitante.um` · `solicitante.dois` | Solicitante |
| `atendente.um` · `atendente.dois` | Atendente |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Análise estática (Oxlint) |

## Docker (somente o front)

O `Dockerfile` faz o build com Node e serve o resultado com nginx (com fallback de rotas da SPA, gzip e cache dos arquivos com hash). A URL da API é definida no build:

```bash
docker build --build-arg VITE_API_URL=http://localhost:3000 -t psel-bit-front .
docker run -p 5173:80 psel-bit-front
```

## Estrutura

```
src/
  pages/        telas (Login, Dashboard, Requests, NewRequest, RequestDetail)
  components/   Layout, Modal, ErrorPage, Comments, RequestFields, Shared
  services/     http.js (fetch, token, erros) e api.js (contrato da API)
  hooks/        useCategories, useComments, useAction
  utils/        validação dos campos de texto
  motion/       animações (Motion)
docs/api.md     contrato da API usado na integração
```

## Documentação

- [Contrato da API](docs/api.md) (cópia usada na integração; a versão de referência está no back-end)
- Memorial Técnico, casos de uso e dicionário de dados: no [repositório do back-end](https://github.com/Lord1nho/psel-BIT-back)
