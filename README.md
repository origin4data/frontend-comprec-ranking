# Comprec — Ranking de Vendedores

Painel de ranking de vendas com painel admin protegido por login.
**Next.js 14 · Supabase · TypeScript · Tailwind CSS**

---

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Ranking público para TV (fundo escuro, auto-refresh + realtime) |
| `/login` | Login do administrador |
| `/admin` | Painel admin: ranking, registrar vendas, gerenciar funcionários |

---

## Setup — Passo a Passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e cole todo o conteúdo de `supabase/migration.sql`
3. Execute — isso cria as tabelas, a view do ranking, as policies e insere os 18 funcionários

### 2. Criar usuário admin

1. No Supabase, vá em **Authentication > Users**
2. Clique **Add User > Create New User**
3. Preencha e-mail e senha (ex: `admin@comprec.com.br` / `senha-forte-123`)
4. Esse será o login para acessar `/admin`

### 3. Habilitar Realtime

1. No Supabase, vá em **Database > Replication**
2. Ative replication para as tabelas `vendas` e `funcionarios`
3. Isso faz a TV atualizar instantaneamente quando uma venda é registrada

### 4. Configurar o projeto

```bash
# Instalar dependências
npm install

# Copiar e preencher variáveis de ambiente
cp .env.local.example .env.local
```

Abra `.env.local` e preencha:
- `NEXT_PUBLIC_SUPABASE_URL` → copie de **Settings > API > Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → copie de **Settings > API > anon public key**

### 5. Rodar

```bash
npm run dev
# http://localhost:3000       → TV (ranking público)
# http://localhost:3000/login → Login admin
# http://localhost:3000/admin → Painel administrativo
```

### 6. Produção (TV do escritório)

```bash
npm run build && npm start
# Abra no Chrome da TV → F11 (tela cheia)
```

---

## Estrutura da planilha original → Banco de dados

A planilha tinha: `Vendedor | Repasse | Data`

No banco ficou:

**Tabela `funcionarios`**: id, nome, ativo
**Tabela `vendas`**: id, funcionario_id, repasse, data_venda
**View `ranking_mensal`**: agrupa vendas do mês atual por funcionário

---

## Admin — O que dá pra fazer

### Aba Ranking
- Ver ranking do mês em tempo real

### Aba Registrar Venda
- Selecionar funcionário, valor do repasse e data
- Ver e excluir últimas vendas

### Aba Funcionários
- Adicionar novo funcionário
- Ativar/desativar (inativo não aparece no ranking)
- Remover (exclui junto com vendas)

---

## Funcionários já cadastrados (via migration.sql)

Pablo Trindade, Jonatas Gomes, Gabriel Pereira, Eduardo Santos,
Luis Gustavo, Lorhan Marinho, Rafaela Gomes, Luiz Miguel,
Ingrid Yasmin, Carlos André, Mateus Claudino, Guilherme Martins,
Gustavo Nascimento, Margareth Marins, Phelipe Octaviano,
Paulo Aires, Miguel Cortegiano, Gabriel Costa
# frontend-comprec-ranking
