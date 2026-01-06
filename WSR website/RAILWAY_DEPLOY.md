# 🚂 Deploy no Railway - WSR Website

## ✅ Arquivos Criados

- ✅ `server.py` - Servidor HTTP que usa variável PORT do Railway
- ✅ `railway.json` - Configuração do Railway
- ✅ `Procfile` - Alternativa de configuração
- ✅ `runtime.txt` - Versão do Python

## 🚀 Deploy Rápido (3 passos)

### 1️⃣ Criar conta no Railway

1. Vai a: https://railway.app/
2. Clica em **"Start a New Project"** ou **"Login with GitHub"**
3. Autoriza o Railway a aceder ao GitHub

### 2️⃣ Conectar Repositório

**Opção A: Deploy via GitHub (Recomendado)**

1. Faz commit e push do projeto para GitHub:
   ```powershell
   cd "c:\Users\edumps\Documents\GitHub\WSR\WSR website"
   git add .
   git commit -m "Preparar deploy para Railway"
   git push origin main
   ```

2. No Railway:
   - Clica em **"New Project"**
   - Escolhe **"Deploy from GitHub repo"**
   - Seleciona o repositório: `WSR/WSR website`
   - Railway detecta automaticamente e faz deploy

**Opção B: Deploy via CLI**

1. Instalar Railway CLI:
   ```powershell
   npm install -g @railway/cli
   ```

2. Login:
   ```powershell
   railway login
   ```

3. Inicializar e fazer deploy:
   ```powershell
   cd "c:\Users\edumps\Documents\GitHub\WSR\WSR website"
   railway init
   railway up
   ```

### 3️⃣ Obter URL

Depois do deploy (1-2 minutos):
1. No dashboard do Railway, clica no teu projeto
2. Vai a **"Settings"** → **"Domains"**
3. Clica em **"Generate Domain"**
4. Copia o URL gerado (tipo: `wsr-website.up.railway.app`)

## 🌐 URL Final

Após deploy, o website estará disponível em:
```
https://[seu-projeto].up.railway.app
```

Exemplo: `https://wsr-website-production.up.railway.app`

## 📋 Checklist de Deploy

- [x] `server.py` criado (usa PORT do Railway)
- [x] `railway.json` configurado
- [x] `Procfile` alternativo disponível
- [x] `runtime.txt` com versão Python
- [ ] Fazer commit no Git
- [ ] Push para GitHub
- [ ] Conectar Railway ao repo
- [ ] Aguardar build
- [ ] Gerar domínio custom
- [ ] Testar URL público

## ⚙️ Configurações Importantes

### Variáveis de Ambiente (não necessárias agora)

Se precisares configurar variáveis:
```
PORT=8000  (Railway define automaticamente)
```

### Domínio Custom (Opcional)

Para usar domínio próprio (ex: `wsr.com`):
1. Railway Settings → Domains
2. Add Custom Domain
3. Adicionar registos DNS no teu provedor

## 🔍 Verificar Logs

Para ver se está tudo a correr bem:
```powershell
railway logs
```

Ou no dashboard: **Deployments** → Clica no deploy → **View Logs**

## 💡 Vantagens do Railway

✅ **Gratuito** - 500 horas/mês grátis
✅ **HTTPS automático** - SSL incluído
✅ **Deploy automático** - Cada push = novo deploy
✅ **99.9% uptime** - Servidor sempre online
✅ **Global CDN** - Rápido em todo o mundo
✅ **Zero configuração** - Deteta Python automaticamente

## 🔄 Atualizar Website

Depois do deploy inicial, para atualizar:

```powershell
# Fazer alterações nos ficheiros
git add .
git commit -m "Atualização do website"
git push origin main
```

Railway faz deploy automático em 1-2 minutos! 🚀

## 🆘 Troubleshooting

### Deploy falhou:

1. **Verificar logs:**
   ```powershell
   railway logs
   ```

2. **Build erro:**
   - Confirma que `server.py` existe
   - Verifica sintaxe dos ficheiros

3. **Porta errada:**
   - Railway usa variável `$PORT` automaticamente
   - `server.py` já está configurado

### Website não abre:

1. Verifica domínio foi gerado (Settings → Domains)
2. Aguarda 2-3 minutos após primeiro deploy
3. Limpa cache do browser (Ctrl+Shift+R)

### Build muito lento:

- Primeiro build pode demorar 5 minutos
- Builds seguintes são mais rápidos (cache)

## 🎯 Alternativas ao Railway

Se preferires outro serviço:

### **Vercel** (Recomendado para sites estáticos)
- Mais rápido para sites HTML/CSS/JS
- Deploy gratuito ilimitado
- Domínio `.vercel.app`

### **Netlify**
- Similar ao Vercel
- Formulários integrados
- Domínio `.netlify.app`

### **Render**
- Parecido com Railway
- 750 horas grátis/mês
- Domínio `.onrender.com`

### **GitHub Pages**
- Totalmente gratuito
- Só para sites estáticos
- Domínio `.github.io`

## 📊 Comandos Úteis Railway CLI

```powershell
# Ver status
railway status

# Ver logs em tempo real
railway logs -f

# Abrir dashboard
railway open

# Conectar a outro projeto
railway link

# Executar comando no servidor
railway run [comando]

# Ver variáveis
railway variables

# Adicionar variável
railway variables set KEY=VALUE
```

## 🌟 Após Deploy Bem-Sucedido

Partilha o URL com todos:
```
https://wsr-website.up.railway.app
```

✅ Acessível de qualquer lugar
✅ HTTPS seguro
✅ Sem configurar router
✅ Sem port forwarding
✅ Sempre online

---

**Status:** ⚠️ Aguardando deploy
**Próximo passo:** Fazer push para GitHub e conectar Railway
**Tempo estimado:** 5-10 minutos até estar online

---

## 🚀 Comando Rápido (tudo de uma vez)

```powershell
# Se já tens Git configurado:
cd "c:\Users\edumps\Documents\GitHub\WSR\WSR website"
git add .
git commit -m "Deploy Railway - WSR Website"
git push origin main

# Depois vai a railway.app e conecta o repo
```

**Pronto!** Em minutos o website está online globalmente! 🎉
