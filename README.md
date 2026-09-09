# Comprec — Ranking de Vendedores

Painel de TV, somente leitura. Lê o ranking apurado pela API do Comprec — venda lançada mais
ajuste, direto do banco da plataforma —, desenha pódio e tabela e alterna entre o quadro **mensal**
e o **anual** a cada 22s. Não tem login nem tela de cadastro: quem lança venda é a plataforma
Comprec.
**Next.js 14 · TypeScript · Tailwind CSS**

---

## Fonte de dados

`RANKING_API_URL` — lida **no servidor, em runtime**. Sem ela, vale o default de `lib/config.ts`,
que aponta para `https://api.comprec.origindata.com.br/api/public/ranking`.

> Não renomeie para `NEXT_PUBLIC_*`. O Next inlina no bundle qualquer `NEXT_PUBLIC_*` presente no
> ambiente durante o build, e a partir daí a variável da stack passa a ser ignorada em silêncio.

O envelope esperado:

```json
{
  "mensal": [
    { "nome": "Natan Peixoto", "total_repasse": 12250.00, "qtd_vendas": 1,
      "ultima_venda": "2026-09-02", "foto": "https://.../vendedor-1.jpg" }
  ],
  "anual": [ /* mesmo formato */ ]
}
```

O casamento de colunas em `lib/sheets.ts` é tolerante (minúsculas, sem underscore) e aceita
`repasse`/`valor`/`total` e `qnt_venda`/`vendas`. O que ele **não** aceita mais é sumiço da coluna
de valor: linha com venda e sem nenhuma das chaves de repasse **derruba a leitura com erro**, em vez
de virar R$ 0. Foi exatamente assim, com uma coluna chamada `Coluna 2`, que a planilha antiga
manteve o quadro mensal zerado — e, como todo mundo empatava em zero, o pódio na ordem errada.

Detalhes que importam:

- O período vai **explícito** na query: `?ano=&mes=`, calculado em `America/Sao_Paulo` e devolvido
  em `periodo` na resposta, que é o que o cabeçalho da TV usa. Sem isso, o contêiner (UTC) viraria
  o mês três horas antes do rótulo. Um `ano`/`mes` já presente em `RANKING_API_URL` é respeitado.
- `ultima_venda` deve vir como `aaaa-MM-dd`. Um instante ISO completo passa pela conversão de fuso
  e sai **um dia adiantado**.
- `foto` precisa ser URL absoluta (caminho relativo é resolvido contra `RANKING_API_URL` como rede
  de segurança). Vazia cai no fallback de iniciais.
- Linhas com `total_repasse <= 0` **e** `qtd_vendas <= 0` são descartadas.
- Empates preservam a ordem recebida, então a origem deve enviar ordem determinística.
- Qualquer corpo fora do envelope `{ mensal, anual }` é recusado. Não há mais tolerância a formato
  de array solto: era o da planilha, e aceitá-lo faria payload estranho virar "anual vazio" calado.
- A busca é **server-side, sempre**. A API bloqueia CORS de origem externa (403 `Invalid CORS
  request`), então o navegador da TV não consegue — e não deve — falar direto com ela.

### Rotas

| Rota | Descrição |
|------|-----------|
| `/` | O painel. Poll a cada 15s, com carrossel mensal ⇄ anual |
| `/api/rankings` | Proxy servidor→origem, cache de 10s |
| `/api/debug-csv` | Diagnóstico. Mostra `origem` (de onde os dados vieram de fato) e as somas por quadro — é o que se compara lado a lado na virada de fonte |

---

## Basic auth (opcional)

O painel pode exigir usuário e senha em **todas** as rotas, `/api/rankings` e `/api/debug-csv`
inclusas. Liga-se pela env da stack, sem rebuild:

| Variável | Efeito |
|---|---|
| `BASIC_AUTH_USER` | usuário aceito |
| `BASIC_AUTH_PASSWORD` | senha aceita |

Com os dois preenchidos, o servidor responde `401` com `WWW-Authenticate: Basic` e o navegador da
TV pede as credenciais **uma vez**, guardando-as enquanto a aba viver. Com qualquer um dos dois
vazio, o painel fica aberto, como sempre foi. A comparação é em tempo constante, e os valores nunca
vão ao bundle (não são `NEXT_PUBLIC_*`): trocar a senha é trocar a env e redeployar.

Para ligar:

1. Portainer → *Stacks → ranking-comprec → Environment variables*: adicione `BASIC_AUTH_USER` e
   `BASIC_AUTH_PASSWORD` (o `docker-compose.yml` já as repassa ao contêiner).
2. *Update the stack* (redeploy). A imagem já contém o `middleware.ts`; só a env muda.
3. No quiosque, ponha as credenciais na URL para o Chrome não parar no prompt:

   ```bash
   chrome.exe --kiosk --noerrdialogs --disable-infobars "https://usuario:senha@ranking-comprec.origindata.com.br/"
   ```

   Se o navegador da TV ignorar credenciais na URL, digite-as uma vez no prompt; ele as reaproveita
   em todos os pedidos seguintes, inclusive o poll de `/api/rankings`.

Para desligar, esvazie ou remova uma das variáveis e redeploye.

Isto protege o **painel**. `RANKING_API_KEY` é outra coisa: é o que este servidor manda para a API
do Comprec no header `X-Ranking-Key`, e segue independente.

---

## Rodar

```bash
npm install
cp .env.local.example .env.local   # opcional: o default já aponta para a API
npm run dev
```

Conferir de onde os dados estão vindo:

```bash
curl -s localhost:3000/api/debug-csv | jq '{origem, mensal: .mensal.total, anual: .anual.total}'
```

## Deploy

Push em `main` → o workflow constrói e publica `origin4data/ranking-comprec:latest` e
`:sha-<commit>` no Docker Hub. **Ele não atualiza a stack**: o redeploy no Swarm é manual, pelo
Portainer ou por `docker service update --force`.

Se a origem falhar, `/api/rankings` serve o **último payload bom** desta instância com `stale: true`
no corpo, em vez de trocar o ranking por uma mensagem de erro na parede do escritório. O último bom
vive na memória do processo: some no restart.

> `/api/rankings` é pré-renderizada no build (`revalidate = 10`): depois de um restart, o corpo do
> build é servido até a primeira revalidação, cerca de 10s. Uma troca de `RANKING_API_URL` vale a
> partir daí — espere esse intervalo antes de concluir que não pegou. A origem recebe ~6
> requisições por minuto, independentemente de quantas TVs estejam ligadas.

---

## TV de 56" em pé (retrato)

O painel foi desenhado para uma TV **na vertical**, resolução **1080 × 1920**.

### Configurar a TV

1. Gire a TV fisicamente para o modo retrato
2. No Windows do mini-PC/box: **Configurações > Sistema > Vídeo > Orientação da tela → Retrato**
   (no Linux: `xrandr --output HDMI-1 --rotate left`)
3. Confirme que a resolução ficou **1080 × 1920**
4. Abra o Chrome na URL do painel e pressione **F11** (tela cheia)

Para deixar em quiosque (abre já em tela cheia, sem barras):

```bash
chrome.exe --kiosk --noerrdialogs --disable-infobars http://SEU-HOST/
```

### Como a escala funciona

Todos os tamanhos vivem em variáveis CSS no bloco `@media (orientation: portrait)`
de `app/globals.css` e são definidos em `vmin`. Consequências práticas:

- **Escala sozinho** — a mesma tela serve 1080×1920 (Full HD) e 2160×3840 (4K),
  sem tocar em nenhum componente
- **Ajuste fino num lugar só** — quer o nome do 1º lugar maior? mude `--fs-name-1`
- **Fallback em paisagem** — aberto num monitor comum, o layout de 3 colunas
  original continua valendo (bloco `:root` padrão)

### O que muda em pé vs. deitado

| | Paisagem | Retrato (TV em pé) |
|---|---|---|
| Pódio | 3 colunas lado a lado | 1º lugar em destaque de largura total + 2º/3º embaixo |
| Linhas na tabela | 5 por página | 8 por página |
| Tipografia | fixa em px | escalona em `vmin` |

---
