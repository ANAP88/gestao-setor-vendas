# Gestão Setor de Vendas

Sistema interno de gestão da equipe da Secretaria de Vendas — produção, pipeline de processos, escala de plantão, repasse bancário, insights e indicadores.

## Stack
- Front-end: HTML + JavaScript puro (sem build step), Supabase JS SDK via CDN
- Back-end: [Supabase](https://supabase.com) (Postgres + Auth + Edge Functions)
- Hospedagem: [Netlify](https://netlify.com)

## Desenvolvimento local
Abra `index.html` com um servidor estático (ex.: `./server.ps1` no Windows, ou `npx serve`) e acesse `http://localhost:8123`.

## Deploy
Publicado via Netlify, conectado a este repositório. Todo push na branch principal atualiza o site automaticamente.
