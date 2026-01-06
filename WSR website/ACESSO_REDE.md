# 🌐 Acesso ao Website na Rede Local

## ✅ Servidor Configurado

**Status:** 🟢 Online e acessível em toda a rede local

### 📱 URLs para Acesso de Outros Dispositivos

Use qualquer um destes IPs dependendo da rede:

1. **Rede Principal (recomendado):**
   ```
   http://192.168.1.66:8000
   ```

2. **Rede Hamachi/VPN:**
   ```
   http://26.250.57.166:8000
   ```

3. **Outras interfaces:**
   ```
   http://192.168.109.1:8000
   http://192.168.241.1:8000
   ```

## 🔧 Configuração Aplicada

### Firewall
✅ Regra criada: "Python HTTP Server"
- **Porta:** 8000
- **Direção:** Inbound
- **Protocolo:** TCP
- **Ação:** Allow

### Servidor
✅ Escutando em: `0.0.0.0:8000`
- Aceita conexões de **TODOS** os dispositivos na rede
- Não restrito a localhost

## 📱 Como Acessar de Outros Dispositivos

### No Telemóvel/Tablet/Outro PC:

1. **Conectar à mesma rede WiFi** que este computador
2. **Abrir navegador** (Chrome, Safari, Firefox, etc.)
3. **Digitar na barra de endereço:**
   ```
   http://192.168.1.66:8000
   ```

### Verificar Conectividade:

**No outro dispositivo, testar:**
```
http://192.168.1.66:8000
```

Se não funcionar, tentar os outros IPs listados acima.

## 🛠️ Troubleshooting

### Se não conseguir aceder:

1. **Verificar se estão na mesma rede:**
   - Computador e dispositivo devem estar no mesmo WiFi/rede local

2. **Verificar firewall:**
   ```powershell
   Get-NetFirewallRule -DisplayName "Python HTTP Server"
   ```

3. **Testar ping:**
   ```
   ping 192.168.1.66
   ```

4. **Verificar se servidor está ativo:**
   - Ver terminal do VS Code
   - Deve mostrar: `Serving HTTP on 0.0.0.0 port 8000`

5. **Desativar firewall temporariamente** (teste):
   - Windows Defender → Firewall → Desligar
   - Se funcionar, o problema é firewall

## 🔄 Reiniciar Servidor

Se precisar reiniciar:

```powershell
cd "c:\Users\edumps\Documents\GitHub\WSR\WSR website"
py -m http.server 8000 --bind 0.0.0.0
```

## 📊 Logs de Acesso

O servidor mostra todos os acessos no terminal:
```
192.168.1.123 - - [06/Jan/2026 21:30:00] "GET / HTTP/1.1" 200 -
```

Cada linha mostra:
- IP do dispositivo que acedeu
- Data/hora
- Página acessada
- Código de resposta (200 = sucesso)

## ⚡ Configuração Permanente

Para manter sempre acessível:

1. Criar script de inicialização
2. Configurar IP estático no router
3. Port forwarding (se quiser acesso da internet)

## 🎯 URLs Finais

**Acesso Local (este PC):**
- http://localhost:8000
- http://127.0.0.1:8000

**Acesso Rede Local (outros dispositivos):**
- http://192.168.1.66:8000 ⭐ (principal)
- http://26.250.57.166:8000 (Hamachi)

---

**Última atualização:** 2026-01-06 21:30
**Status:** ✅ Servidor ativo e firewall configurado
