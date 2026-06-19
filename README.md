1# iaedu

Interface de estudo com IA usando os modelos disponibilizados pela universidade (Opus 4.7, GPT-5.5, GPT-4o).

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com as chaves da universidade

# 3. Correr em desenvolvimento
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy no Vercel

1. Push para GitHub
2. Importar o repositório no [Vercel](https://vercel.com)
3. Adicionar as variáveis de ambiente no painel do Vercel:
   - `AGENT_OPUS47_KEY`
   - `AGENT_GPT55_KEY`
   - `AGENT_GPT4O_KEY`
4. Deploy automático

## Estrutura

```
app/
  api/chat/route.ts      # Proxy streaming para a API da universidade
  api/extract/route.ts   # Extração de texto de PDFs e URLs
components/chat/         # Todos os componentes da interface
lib/
  agents.ts              # Configuração dos 3 modelos
  streaming.ts           # Parser do stream SSE
```

## Funcionalidades

- Chat com streaming em tempo real
- Seletor de modelo (Opus 4.7 / GPT-5.5 / GPT-4o)
- Upload de PDFs (texto extraído e injetado como contexto)
- Adicionar URLs (conteúdo da página usado como contexto)
- Nova conversa com botão dedicado
- Markdown + syntax highlighting nas respostas
