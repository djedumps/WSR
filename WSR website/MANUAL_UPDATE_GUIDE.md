# 📋 Guia de Atualização Manual dos Dados

## 🎯 Objetivo
Atualizar os dados de **gênero**, **views** e **BPM** para cada música sem usar API do YouTube.

---

## 📝 Checklist para Cada Música

Para cada track no `youtube_data.json`, você precisa atualizar:

### 1️⃣ **GÊNERO** (na thumbnail)
- Abra a thumbnail da música (campo `artwork`)
- Olhe o texto escrito na imagem
- Atualize o campo `"genre"` com o texto correto

**Exemplo:**
```json
"genre": "Future Bass"  // ← Copie exatamente como está na thumbnail
```

### 2️⃣ **VIEWS** (no YouTube)
- Abra o vídeo no YouTube (campo `youtubeUrl`)
- Copie o número exato de visualizações
- Atualize os campos `"plays"` e `"viewsNum"`

**Exemplo:**
```json
"plays": "2.9k",      // ← Formato curto (k, M)
"viewsNum": 2900      // ← Número completo
```

**Conversão:**
- 2.9k = 2,900
- 15.3k = 15,300
- 1.2M = 1,200,000
- 39M = 39,000,000

### 3️⃣ **BPM** (em sites especializados)
Pesquise o BPM em um destes sites:
- 🎵 https://tunebat.com
- 🎵 https://songbpm.com
- 🎵 https://bpmdatabase.com

**Como usar:**
1. Acesse o site
2. Busque: `Artista + Nome da Música`
3. Copie o BPM exato
4. Atualize o campo `"bpm"`

**Exemplo:**
```json
"bpm": 140  // ← BPM correto do site
```

---

## 🚀 Métodos de Atualização

### **Método 1: Manual (mais preciso)**

1. Abra `youtube_data.json`
2. Para cada track:
   ```json
   {
     "number": 33,
     "title": "Sunshine [WSR Release]",
     "artist": "Roadtownboy",
     "genre": "Electronic",           // ← ATUALIZAR (olhar thumbnail)
     "plays": "39.0M",                // ← ATUALIZAR (YouTube)
     "viewsNum": 39000000,            // ← ATUALIZAR (YouTube)
     "bpm": 128,                      // ← ATUALIZAR (Tunebat)
     "artwork": "https://...",        // ← Abrir para ver gênero
     "youtubeUrl": "https://..."      // ← Abrir para ver views
   }
   ```
3. Salve o arquivo
4. Recarregue o website (Ctrl+Shift+R)

---

### **Método 2: Script Automático (views apenas)**

Execute o script para atualizar **views automaticamente**:

```bash
node scrape_real_data.js
```

**O que faz:**
- ✅ Busca views reais do YouTube
- ✅ Atualiza `plays` e `viewsNum`
- ✅ Cria backup automático
- ⚠️ Gênero e BPM ainda precisam ser manuais

**Tempo estimado:** ~2 minutos (2s por música × 57 músicas)

---

## 📊 Exemplo Completo

**ANTES:**
```json
{
  "number": 33,
  "title": "Sunshine [WSR Release]",
  "artist": "Roadtownboy",
  "genre": "Electronic",
  "plays": "39.0M",
  "viewsNum": 39000000,
  "bpm": 128,
  "artwork": "https://i.ytimg.com/vi/wPnjckHdcc8/hqdefault.jpg",
  "videoId": "wPnjckHdcc8"
}
```

**DEPOIS DE ATUALIZAR:**
```json
{
  "number": 33,
  "title": "Sunshine [WSR Release]",
  "artist": "Roadtownboy",
  "genre": "Progressive House",      // ← Visto na thumbnail
  "plays": "2.9k",                   // ← Visto no YouTube
  "viewsNum": 2900,                  // ← Convertido de 2.9k
  "bpm": 124,                        // ← Verificado no Tunebat
  "artwork": "https://i.ytimg.com/vi/wPnjckHdcc8/hqdefault.jpg",
  "videoId": "wPnjckHdcc8"
}
```

---

## 🔗 Links Úteis

### Para cada música, abra:

1. **Thumbnail** (ver gênero):
   ```
   https://i.ytimg.com/vi/[videoId]/maxresdefault.jpg
   ```

2. **YouTube** (ver views):
   ```
   https://www.youtube.com/watch?v=[videoId]
   ```

3. **Tunebat** (ver BPM):
   ```
   https://tunebat.com/Search?q=[Artist]+[Title]
   ```

---

## ✅ Verificação Final

Após atualizar, verifique:

- [ ] Todos os gêneros estão corretos (da thumbnail)
- [ ] Todas as views estão formatadas (2.9k, 15.3k, 1.2M)
- [ ] Todos os viewsNum são números inteiros
- [ ] Todos os BPM foram verificados em sites especializados
- [ ] O arquivo JSON está válido (sem erros de sintaxe)

---

## 💡 Dicas

1. **Gêneros comuns nas thumbnails:**
   - Future Bass
   - Progressive House
   - Brazilian Phonk
   - Melodic House
   - Hard Dance
   - Chill/Ambient

2. **Formatação de views:**
   - Menos de 1.000: número direto (ex: 543)
   - 1.000 - 999.999: formato "k" (ex: 2.9k, 15.3k)
   - 1.000.000+: formato "M" (ex: 1.2M, 39M)

3. **BPM típicos:**
   - House: 120-130 BPM
   - Progressive House: 125-130 BPM
   - Future Bass: 140-170 BPM
   - Phonk: 120-140 BPM

---

## 🆘 Problemas?

Se encontrar algum erro:
1. Verifique a sintaxe JSON (vírgulas, aspas)
2. Use um validador: https://jsonlint.com
3. Restaure do backup: `youtube_data_backup.json`

---

**Boa sorte! 🚀**
