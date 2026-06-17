# DKW → Meta Conversions API

Servidor que recebe webhooks do DKW quando uma venda é marcada como "Ganha" e envia o evento para a API de Conversões do Meta.

## Deploy no Railway

1. Suba esse repositório no GitHub
2. Acesse railway.app e crie um novo projeto a partir do repositório
3. Adicione a variável de ambiente:
   - `ACCESS_TOKEN` = seu token da API de Conversões do Meta
4. O Railway vai fazer o deploy automaticamente

## Endpoint

- `POST /webhook` — recebe o evento do DKW
- `GET /` — health check

## Configuração no DKW

1. Vá em Configurações → Webhooks → Webhooks de Saída
2. Crie um novo webhook apontando para:
   `https://SEU-PROJETO.railway.app/webhook`
3. Configure para disparar quando o status mudar para "Ganho"
