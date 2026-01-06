# World Studio Records - Website

## 🎵 Sistema Automático de Download de Música

### Como funcionar:

1. **Download manual:**
   ```bash
   node download_music.js
   ```

2. **Usando o menu automático:**
   ```bash
   auto_update.bat
   ```

3. **Atualização completa (scrape + download):**
   ```bash
   npm run update
   ```

### O que faz:

✅ Detecta novos vídeos no canal YouTube  
✅ Baixa automaticamente em MP3 (alta qualidade)  
✅ Salva na pasta `/music/`  
✅ Atualiza automaticamente o website  
✅ Player funciona com progresso e controles  

### Estrutura de arquivos:

```
WSR website/
├── music/                 # MP3s baixados
│   ├── 001_CAHAYA.mp3
│   ├── 002_Never_Be_The_Same.mp3
│   └── ...
├── download_music.js      # Script de download
├── auto_update.bat        # Menu automático
└── youtube_data.json      # Dados atualizados
```

### Requisitos:

- Node.js
- Puppeteer (já instalado)
- yt-dlp (instala automaticamente)

### Automação diária:

Execute `auto_update.bat` e escolha opção [2] para configurar downloads diários às 3h da manhã.
