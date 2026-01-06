# 🌍 Configurar Acesso Externo (Outras Redes)

## 📡 IP Público Atual
```
188.81.242.235
```

## ⚙️ Configuração Necessária: Port Forwarding

Para aceder de outra rede (internet), é necessário configurar **Port Forwarding** no router.

### 🔧 Passo a Passo

#### 1️⃣ Aceder ao Router

**URLs comuns de routers:**
- `http://192.168.1.1` (mais comum)
- `http://192.168.0.1`
- `http://192.168.1.254`
- Ver na parte de trás do router

**Credenciais padrão:**
- Username: `admin` / `Admin`
- Password: `admin` / `password` / (vazia) / (ver no router)

#### 2️⃣ Encontrar Port Forwarding

Procura por uma destas opções no menu:
- **Port Forwarding**
- **Virtual Server**
- **NAT**
- **Aplicações e Jogos**
- **Redirecionamento de Portas**

#### 3️⃣ Criar Regra

Configurar com estes valores:

| Campo | Valor |
|-------|-------|
| **Nome/Serviço** | WSR Website |
| **Porta Externa** | 8000 |
| **Porta Interna** | 8000 |
| **IP Local** | 192.168.1.66 |
| **Protocolo** | TCP |
| **Status** | Ativado/Enabled |

**Exemplo visual:**
```
Nome: WSR Website
Tipo: TCP
Porta Externa: 8000
IP Interno: 192.168.1.66
Porta Interna: 8000
```

#### 4️⃣ Guardar e Reiniciar

- Clica em **Guardar/Save/Apply**
- Reinicia o router (se necessário)
- Aguarda 1-2 minutos

### 🌐 URL para Acesso Externo

Depois de configurar port forwarding, qualquer pessoa pode aceder:

```
http://188.81.242.235:8000
```

**Partilha este link** com quem quiser aceder de outra rede.

## 🔍 Verificar se Funciona

### Teste Online:
1. Vai a: https://www.yougetsignal.com/tools/open-ports/
2. IP: `188.81.242.235`
3. Port: `8000`
4. Clica em "Check"
5. Deve mostrar: **"Port 8000 is open"**

### Teste Móvel:
- Desativa WiFi
- Usa dados móveis
- Acede: http://188.81.242.235:8000

## ⚠️ Avisos Importantes

### Segurança:
- ⚠️ Servidor HTTP **não tem encriptação** (sem HTTPS)
- ⚠️ Qualquer pessoa com o IP pode aceder
- ⚠️ Não partilhes informações sensíveis
- ✅ Considera usar **senha** ou **VPN**

### IP Dinâmico:
- 📍 O IP público `188.81.242.235` pode mudar
- 🔄 Se mudar, tens que partilhar novo IP
- 💡 Solução: Usa serviço **DynDNS** ou **No-IP** (gratuito)

### Router/ISP:
- Alguns ISPs bloqueiam port forwarding
- Alguns routers não suportam
- MEO/NOS/Vodafone: geralmente permitem

## 🚀 Alternativas ao Port Forwarding

### 1. **ngrok** (Recomendado - Mais Fácil)

```powershell
# Instalar ngrok
choco install ngrok

# Criar túnel
ngrok http 8000
```

Gera URL tipo: `https://abc123.ngrok.io`
- ✅ Sem configurar router
- ✅ HTTPS automático
- ✅ Funciona em qualquer rede
- ⚠️ URL muda a cada reinício (versão gratuita)

### 2. **Cloudflare Tunnel**

```powershell
# Instalar cloudflared
choco install cloudflared

# Criar túnel
cloudflared tunnel --url http://localhost:8000
```

- ✅ Gratuito e permanente
- ✅ HTTPS automático
- ✅ Domínio próprio possível

### 3. **LocalTunnel**

```powershell
npm install -g localtunnel
lt --port 8000
```

- ✅ Rápido e simples
- ⚠️ URL muda frequentemente

## 📋 Routers Comuns - Guias Específicos

### MEO (Huawei/ZTE)
1. Aceder: `http://192.168.1.1`
2. **Avançado** → **NAT** → **Port Mapping**
3. Adicionar regra

### NOS (Arris/Technicolor)
1. Aceder: `http://192.168.1.1`
2. **Configuração** → **Port Forwarding**
3. Adicionar regra

### Vodafone (Huawei)
1. Aceder: `http://192.168.1.1`
2. **Internet** → **Port Mapping**
3. Adicionar regra

### TP-Link
1. Aceder: `http://192.168.1.1` ou `http://tplinkwifi.net`
2. **Forwarding** → **Virtual Servers**
3. Add New

### Asus
1. Aceder: `http://router.asus.com`
2. **WAN** → **Virtual Server / Port Forwarding**
3. Add Profile

## 🆘 Troubleshooting

### Não consigo aceder externamente:

1. **Verificar porta está aberta:**
   - https://www.yougetsignal.com/tools/open-ports/

2. **Verificar IP público:**
   ```powershell
   Invoke-RestMethod https://api.ipify.org?format=json
   ```

3. **Verificar firewall Windows:**
   ```powershell
   Get-NetFirewallRule -DisplayName "Python HTTP Server"
   ```

4. **Testar localmente primeiro:**
   - http://192.168.1.66:8000 (deve funcionar)

5. **Ver logs do servidor:**
   - Terminal deve mostrar acessos

6. **Router pode ter duplo NAT:**
   - Contactar ISP para ativar DMZ ou bridge mode

### IP público mudou:

```powershell
# Ver novo IP
Invoke-RestMethod https://api.ipify.org?format=json

# Atualizar este guia com novo IP
```

## 💡 Recomendação Final

**Para partilhar temporariamente (sem configurar router):**
→ Usa **ngrok** (mais fácil e rápido)

**Para acesso permanente:**
→ Configura **Port Forwarding** + **DynDNS**

**Para produção real:**
→ Hospedar em serviço cloud (Vercel, Netlify, GitHub Pages)

---

## 📊 Status Atual

**Servidor:** ✅ Online e configurado
**Firewall:** ✅ Porta 8000 aberta
**Bind:** ✅ 0.0.0.0 (aceita todas conexões)
**IP Público:** 188.81.242.235
**Port Forwarding:** ⚠️ **TU TENS QUE CONFIGURAR** no router

**URLs Disponíveis:**
- Rede Local: http://192.168.1.66:8000
- Externo (após port forwarding): http://188.81.242.235:8000

---

**Última atualização:** 2026-01-06 21:32
