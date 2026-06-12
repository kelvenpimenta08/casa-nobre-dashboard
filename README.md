# Casa Nobre Dashboard · Keepads

Dashboard de análise de criativos Meta Ads para a Casa Nobre Home Center.  
Dados puxados automaticamente do Google Sheets (sem backend).

## Stack

- React 18 + Vite
- CSS Modules (identidade visual Keepads)
- Google Sheets API pública (CSV export)

---

## Configuração da Planilha

1. Abra sua planilha no Google Drive
2. Clique em **Compartilhar** → **Qualquer pessoa com o link** → **Leitor**
3. Copie o ID da URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_É_O_ID/edit
   ```

---

## Rodar localmente

```bash
npm install
cp .env.example .env.local
# Cole seu SHEET_ID no .env.local
npm run dev
```

---

## Deploy no Vercel

### 1. Subir no GitHub

```bash
git init
git add .
git commit -m "feat: dashboard Casa Nobre"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/casa-nobre-dashboard.git
git push -u origin main
```

### 2. Importar no Vercel

1. Acesse [vercel.com](https://vercel.com) → **Add New Project**
2. Selecione o repositório `casa-nobre-dashboard`
3. Framework: **Vite** (detectado automaticamente)
4. Em **Environment Variables**, adicione:
   ```
   VITE_SHEET_ID = seu_id_aqui
   ```
5. Clique em **Deploy**

### 3. Atualização automática

A cada `git push origin main`, o Vercel redeploya automaticamente.  
Os dados da planilha são buscados em tempo real ao abrir o dashboard — basta atualizar a planilha no Drive.

---

## Estrutura da planilha esperada

| Coluna | Descrição |
|---|---|
| Day | Data (YYYY-MM-DD) |
| Campaign name | Nome da campanha com tags de objetivo |
| Ad Name | Nome do criativo |
| Creative Facebook URL | Link direto para o post |
| Reach | Alcance |
| Impressions | Impressões |
| Link clicks | Cliques |
| Messaging conversations started | Mensagens iniciadas |
| Cost per messaging conversation started | Custo por mensagem |
| 3-second video plays | Plays 3s |
| Video plays at 75% | Plays 75% |

---

## Adicionar novo mês

Apenas adicione as linhas do novo mês na mesma aba da planilha.  
O dashboard detecta os meses automaticamente e exibe as tabs correspondentes.

---

Desenvolvido por **Keepads** · performance & estratégia
