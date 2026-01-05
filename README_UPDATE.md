# 🎵 World Studio Records - YouTube Data Update Guide

## Passo 1: Ir ao Canal do YouTube
Abrir: https://www.youtube.com/@worldstudiorecords/videos

## Passo 2: Copiar Informações dos Vídeos

Para cada vídeo, copiar:
- **Título** (ex: "Artist Name - Track Name")
- **Views** (ex: "1.2M views")
- **Data de publicação** (ex: "2 weeks ago")
- **Thumbnail URL** (botão direito na miniatura > Copiar endereço da imagem)

## Passo 3: Editar youtube_data.json

Abrir o ficheiro `youtube_data.json` e adicionar os dados reais:

```json
{
  "tracks": [
    {
      "number": 1,
      "title": "Nome da Track",
      "artist": "Nome do Artista",
      "genre": "Genre (House, Techno, Progressive, etc.)",
      "date": "2025-12-15",
      "plays": "1.2M",
      "duration": "3:45",
      "bpm": 128,
      "artwork": "URL_DA_THUMBNAIL_DO_YOUTUBE",
      "videoId": "ID_DO_VIDEO_YOUTUBE"
    },
    {
      "number": 2,
      "title": "Outra Track",
      "artist": "Outro Artista",
      ...
    }
  ],
  "artists": [
    {
      "name": "Nome do Artista",
      "genres": ["House", "Progressive House"],
      "bio": "Biografia do artista",
      "image": "URL_DA_THUMBNAIL",
      "avatar": "URL_DA_THUMBNAIL",
      "tracks": 5,
      "followers": "120K",
      "streams": "12M",
      "country": "🇵🇹 Portugal"
    }
  ]
}
```

## Passo 4: Executar o Script de Atualização

Depois de editar o ficheiro, executar:
```bash
node update_website.js
```

Isto irá:
✅ Atualizar automaticamente o js/script.js com os dados reais
✅ Atualizar o modal de catálogo com as músicas reais
✅ Atualizar o modal de artistas com os artistas reais

## Dicas:

- **Extração do Video ID**: O ID está no URL do YouTube
  - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
  - Video ID: `dQw4w9WgXcQ`

- **Thumbnail URL**: Usar o formato do YouTube
  - `https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg`
  - ou `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`

- **Género**: Identificar pelo título ou descrição do vídeo

- **Formato de Data**: Usar YYYY-MM-DD (ex: 2025-12-15)

- **Views**: Usar formato K (milhares) ou M (milhões)
  - 1200 views = "1.2K"
  - 1200000 views = "1.2M"

## Exemplo Rápido:

Se o vídeo é "Techno Vibes - Dark Night (Official Music Video)" com 500K views:

```json
{
  "number": 1,
  "title": "Dark Night",
  "artist": "Techno Vibes",
  "genre": "Techno",
  "date": "2025-12-10",
  "plays": "500K",
  "duration": "4:30",
  "bpm": 135,
  "artwork": "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
  "videoId": "abc123"
}
```

---

**Nota**: Depois de atualizar, abrir o `index.html` no browser para ver as mudanças!
