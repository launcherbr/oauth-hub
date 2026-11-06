# HubApp — Meta Hub

Hub **standalone**, **multi-app** e **whitelabel** para conectar canais da **Meta** — WhatsApp Business (Cloud API / Embedded Signup), **Messenger** (Páginas) e **Instagram** (Instagram Login) — **receber + visualizar** as interações (webhooks) e **rotear (encaminhar)** esses webhooks, por app, para outros sistemas.

Não valida licença e não depende de nenhum backend externo. Guarda os apps, canais e interações localmente (arquivos JSON) e mostra tudo num painel. Ideal para demonstrar o fluxo OAuth + recebimento de webhooks (por exemplo, no vídeo de revisão do app na Meta) e para servir de hub de integração simples.

> Projeto de código aberto da **[Launcher Tech](https://launcher.com.br/)**.

---

## Recursos

- **Multi-app** — cadastre vários apps Meta, cada um com credenciais, **URL de webhook própria** (`/webhook/app/<id>`), config IDs e destinos de encaminhamento próprios.
- **Conexão de canais via OAuth** (por app)
  - WhatsApp — Embedded Signup (FB SDK + `config_id`), troca de código no servidor, `subscribed_apps`.
  - Messenger — Facebook Login for Business (`config_id`) ou diálogo clássico; lista e assina Páginas.
  - Instagram — Instagram Login, token de longa duração e assinatura da conta.
- **Webhooks por app** — verificação por Verify Token do app e recebimento; tudo aparece no feed "Interações".
- **Roteamento / encaminhamento** — cada app pode repassar seus webhooks para uma ou mais URLs ("outros pontos"), com filtro por produto. POST com o corpo original + cabeçalho `X-Hub-App` (e `X-Hub-Signature-256`, quando houver).
- **Modo histórico × transacional** — por app, escolha **salvar histórico** no painel ou apenas **encaminhar** (ponta a ponta) sem guardar nada.
- **Botões de embed** — gere um botão de conexão para colar **fora do painel** (em qualquer site), por app/canal.
- **Login com Facebook (para sites externos)** — cada app pode virar um **proxy de OAuth** para autenticação: um site externo (WHMCS, outro CMS, etc.) redireciona o visitante para o hub, que conduz o diálogo do Facebook e devolve um **código de uso único**; o backend do site troca esse código pelo perfil (`id`, `name`, `email`, `picture`) chamando a API do hub com um segredo próprio do app. Nenhuma credencial da Meta precisa existir no site externo.
- **Segurança** — App Secret só no servidor; tokens de canal nunca vão ao navegador; webhooks verificados por `X-Hub-Signature-256`; painel protegido por senha (opcional).
- **Painel "Mission Control"** — **visão geral** (KPIs + gráfico de atividade da última hora + mix de canais), **console ao vivo** das interações (filtros, busca, payload com realce de sintaxe, som opcional), **canais como health cards** (status do webhook + sparkline), **command palette** (`Ctrl`/`⌘`+`K`), **tema claro/escuro**, layout **responsivo (mobile)** e **i18n** (pt / en / es).
- **Canal do YouTube configurável** — defina o canal, playlist ou vídeo do YouTube exibido na aba Guia direto pelo painel, sem alterar código.

---

## Requisitos & instalação

- Node.js 18+ (usa `fetch` e `crypto` nativos).

```bash
git clone https://github.com/launchertecnologia/oauth-hub.git && cd oauth-hub

npm install
cp .env.example .env   # opcional — dá para configurar tudo pelo painel
npm run build
npm start              # dev: npm run dev
```

Abra `http://localhost:3300`.

### Subir com Docker

Há `Dockerfile`, `.dockerignore` e `docker-compose.yml` prontos. A imagem é multi-stage (compila o TypeScript e mantém só as dependências de produção), roda como usuário não-root e expõe `GET /health` como healthcheck. Os dados (`data/`) persistem num volume e os segredos vêm do `.env` — **nenhuma credencial é embutida na imagem**.

```bash
cp .env.example .env          # preencha PUBLIC_URL, SESSION_SECRET, ADMIN_PASSWORD…
docker compose up -d --build
```

- A porta **interna** do container é fixa em `3300`; escolha a do host com `HOST_PORT` (padrão `3300`): `HOST_PORT=8080 docker compose up -d`.
- Logs: `docker compose logs -f` · parar: `docker compose down` (os dados ficam no volume `oauth-hub-data`).
- **Atualizar a imagem após alterações no código** (container já em execução): `docker compose up -d --build` — reconstrói a imagem e recria o container sem derrubar o serviço.

Sem Compose (build/run direto):

```bash
docker build -t oauth-hub .
docker run -d --name oauth-hub \
  --env-file .env -e PORT=3300 \
  -p 3300:3300 \
  -v oauth-hub-data:/app/data \
  oauth-hub
```

---

## Configuração

Gerencie os **apps** pela aba **Apps** do painel (cada app tem suas credenciais e webhook). As variáveis `.env` são opcionais:

| Variável | Função |
|----------|--------|
| `PORT` | Porta HTTP (padrão 3300) |
| `PUBLIC_URL` | URL pública do hub, sem barra final (usada em redirect_uri e nas URLs de webhook) |
| `ADMIN_PASSWORD` | Senha do painel. Vazio = painel **sem** autenticação (apenas dev) |
| `SESSION_SECRET` | Segredo HMAC (state OAuth + sessão + assinatura). Defina em produção |
| `BRAND_NAME` | Nome de marca do painel |
| `META_API_VERSION` | Versão padrão da Graph API ao criar apps |
| `FORWARD_TIMEOUT_MS` | Timeout do encaminhamento (padrão 10000) |
| `SOURCE_URL` | URL do repositório público exibida no rodapé (AGPL §13) |
| `META_APP_*`, `INSTAGRAM_APP_*`, `WEBHOOK_VERIFY_TOKEN` | **Seed opcional** de um app no primeiro boot (só se `META_APP_ID` estiver setado e não houver apps) |

---

## No App Dashboard da Meta (por app)

No card de cada app o painel mostra as URLs prontas para copiar:

- **Webhook (callback URL):** `https://SEU_DOMINIO/webhook/app/<idDoApp>` (com o **Verify Token** do app). Há aliases por produto `.../waba`, `.../messenger`, `.../instagram`.
- **Instagram → Redirect URI:** `https://SEU_DOMINIO/connect/instagram/callback`.
- Configure os produtos do app: WhatsApp (Embedded Signup `config_id`), Facebook Login for Business (`config_id`) e Instagram (Instagram Login), e adicione o domínio do hub aos domínios permitidos.

Coloque o serviço atrás de **HTTPS** — a Meta exige HTTPS para OAuth e webhooks.

---

## Login com Facebook (WHMCS, sites externos)

Além de conectar canais, um app pode ser usado como **provedor de "Login com Facebook"** para qualquer site — sem que esse site precise ter seu próprio App da Meta. Isso é diferente da conexão de canais: aqui quem inicia o fluxo é um **visitante do site**, e o resultado é a identidade dele (não um canal de mensageria).

**1. Habilite no app** (aba Apps → editar → "Permitir Login com Facebook"), cadastre os **callbacks permitidos** (URLs do site externo que podem receber o retorno — exige HTTPS) e gere um **segredo de API do login** (compartilhado só com o backend do site).

**2. No App Dashboard da Meta**, adicione `https://SEU_DOMINIO/login/facebook/callback` como Redirect URI válida do produto Facebook Login, e a permissão `email` (requer App Review para ir a produção; em modo de desenvolvimento funciona para os usuários de teste/admins do app).

**3. Fluxo (authorization code, dois saltos):**
1. O site redireciona o navegador para `GET /login/facebook?app=<idDoApp>&redirect_uri=<callbackDoSite>&state=<state>` (URL exibida no card do app).
2. O hub conduz o diálogo OAuth do Facebook e, ao final, redireciona o navegador de volta para `<callbackDoSite>?code=<códigoDeUsoÚnico>&state=<state>` (ou `?error=...` se algo falhar).
3. O **backend** do site troca esse código pelo perfil chamando `POST /api/login/facebook/token` com corpo `{ "appId": "<idDoApp>", "code": "<código>" }` e o cabeçalho `X-Login-Secret: <segredo do app>`. Resposta: `{ "ok": true, "user": { "id", "name", "email", "picture" } }`.

O código de uso único expira em ~2 minutos e só pode ser trocado uma vez — o perfil nunca trafega pela URL do navegador nem fica em logs de acesso.

---

## Endpoints (visão geral)

**Painel / admin** (exigem sessão quando há `ADMIN_PASSWORD`)
- `GET /api/bootstrap` · `POST /api/login`
- `GET /api/config` · `POST /api/settings` (marca, canal do YouTube)
- `GET/POST /api/apps` · `PUT/DELETE /api/apps/:id`
- `GET /api/channels` · `DELETE /api/channels/:id`
- `GET /api/events?since=ISO` · `POST /api/events/clear`
- `POST /api/connect/:channel/init` (body `{ appId }`)

**Conexão**
- `GET /connect/waba|messenger|instagram` · `GET /connect/instagram/callback`
- `POST /api/connect/waba|messenger/exchange` (protegidos pelo `state` assinado)

**Embed (público, sem auth — gated por `embedEnabled` do app)**
- `GET /embed/connect?app=<id>&channel=<waba|messenger|instagram>` → abre a conexão daquele app.

**Login com Facebook (público — gated por `loginEnabled` do app)**
- `GET /login/facebook?app=<id>&redirect_uri=<callbackDoSite>&state=<state>` · `GET /login/facebook/callback`
- `POST /api/login/facebook/token` (body `{ appId, code }`, header `X-Login-Secret`) — troca o código pelo perfil.

**Webhooks (a Meta chama)**
- `GET|POST /webhook/app/:appKey` (+ `/:product`) — por app (recomendado)
- `GET|POST /webhook` (+ `/:product`) — genérico (resolve por canal quando possível)

**Saúde:** `GET /health`.

---

## Dados persistentes (`data/`, ignorado pelo git)

- `settings.json` — marca, canal do YouTube e preferências globais.
- `apps.json` — apps cadastrados (inclui App Secret — **proteja o disco**).
- `channels.json` — canais conectados (inclui tokens).
- `events.json` — últimas interações (ring de `WEBHOOK_EVENTS_MAX`).

---

## Licença

Licenciado sob a **[GNU Affero General Public License v3.0](./LICENSE)**.

Por ser um serviço de rede, a AGPL (§13) exige que os usuários que interagem com o
hub remotamente possam obter o **código-fonte correspondente** da versão em execução.
O painel exibe um link **"Código-fonte"** no rodapé apontando para o repositório
(`SOURCE_URL`, padrão <https://github.com/launcherbr/oauth-hub>). Se você
modificar e publicar uma instância, mantenha esse link acessível e atualizado para a
sua versão.

---

## Créditos

Este projeto é baseado no **[oauth-hub-zdg](https://github.com/pedroherpeto/oauth-hub-zdg)** de **Pedro Herpeto / Comunidade ZDG**, licenciado sob AGPL-3.0. Agradecimentos ao autor original pela base técnica deste hub.

---

Projeto de código aberto mantido pela **[Launcher Tech](https://launcher.com.br/)**.
