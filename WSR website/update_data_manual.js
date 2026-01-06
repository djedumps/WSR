// Script para atualizar manualmente BPM, gêneros e views
// Execute: node update_data_manual.js

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'youtube_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('\n📋 GUIA RÁPIDO DE ATUALIZAÇÃO MANUAL\n');
console.log('Para cada música, você verá:');
console.log('- Link da thumbnail (para ver o gênero)');
console.log('- Link do YouTube (para ver as views)');
console.log('- Link do Tunebat (para verificar BPM)\n');
console.log('═'.repeat(70));

// Criar arquivo HTML interativo para facilitar
let html = `
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WSR - Atualização de Dados</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a0e27;
            color: #fff;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #00e5ff;
            margin-bottom: 30px;
        }
        .track-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 229, 255, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .track-header {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }
        .track-thumbnail {
            flex-shrink: 0;
        }
        .track-thumbnail img {
            width: 200px;
            border-radius: 8px;
        }
        .track-info {
            flex-grow: 1;
        }
        .track-title {
            font-size: 20px;
            font-weight: bold;
            color: #00e5ff;
            margin-bottom: 5px;
        }
        .track-artist {
            font-size: 16px;
            color: #a259ff;
            margin-bottom: 15px;
        }
        .track-data {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
        }
        .data-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 6px;
        }
        .data-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .data-value {
            font-size: 16px;
            font-weight: bold;
        }
        .input-value {
            width: 100%;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(0, 229, 255, 0.3);
            color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
        }
        .links {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .link-btn {
            background: rgba(0, 229, 255, 0.2);
            color: #00e5ff;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.3s;
        }
        .link-btn:hover {
            background: rgba(0, 229, 255, 0.4);
        }
        .save-btn {
            background: #00e5ff;
            color: #0a0e27;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
        }
        .save-btn:hover {
            background: #00b8cc;
        }
        .export-section {
            position: sticky;
            top: 20px;
            background: rgba(0, 229, 255, 0.1);
            border: 2px solid #00e5ff;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: center;
        }
        .export-btn {
            background: #00e5ff;
            color: #0a0e27;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 10px;
        }
        .export-btn:hover {
            background: #00b8cc;
        }
        .progress {
            font-size: 14px;
            color: #888;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 WSR - Atualização de Dados das Músicas</h1>
        
        <div class="export-section">
            <h2>📊 Progresso de Atualização</h2>
            <p class="progress">Músicas atualizadas: <span id="progress">0</span>/57</p>
            <button class="export-btn" onclick="exportJSON()">💾 Exportar JSON Atualizado</button>
        </div>

        <div id="tracks">
`;

data.tracks.forEach((track, index) => {
    const cleanTitle = track.title.replace(/\[.*?\]/g, '').trim();
    const tunebatUrl = `https://tunebat.com/Search?q=${encodeURIComponent(track.artist + ' ' + cleanTitle)}`;
    
    html += `
        <div class="track-card" data-index="${index}">
            <div class="track-header">
                <div class="track-thumbnail">
                    <img src="${track.artwork}" alt="${track.title}" loading="lazy">
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                    
                    <div class="track-data">
                        <div class="data-item">
                            <div class="data-label">Gênero</div>
                            <input type="text" class="input-value" id="genre-${index}" value="${track.genre}" onchange="updateProgress()" aria-label="Gênero da música">
                        </div>
                        <div class="data-item">
                            <div class="data-label">BPM</div>
                            <input type="number" class="input-value" id="bpm-${index}" value="${track.bpm}" onchange="updateProgress()" aria-label="BPM da música">
                        </div>
                        <div class="data-item">
                            <div class="data-label">Views (formato: 2.9k, 15.3k, 1.2M)</div>
                            <input type="text" class="input-value" id="plays-${index}" value="${track.plays}" onchange="updateProgress()" aria-label="Views formatado">
                        </div>
                        <div class="data-item">
                            <div class="data-label">Views (número)</div>
                            <input type="number" class="input-value" id="viewsNum-${index}" value="${track.viewsNum}" onchange="updateProgress()" aria-label="Views numérico">
                        </div>
                    </div>
                    
                    <div class="links">
                        <a href="${track.artwork.replace('hqdefault', 'maxresdefault')}" target="_blank" rel="noopener" class="link-btn">🖼️ Ver Thumbnail (Gênero)</a>
                        <a href="${track.youtubeUrl}" target="_blank" rel="noopener" class="link-btn">▶️ Abrir YouTube (Views)</a>
                        <a href="${tunebatUrl}" target="_blank" rel="noopener" class="link-btn">🎵 Verificar BPM (Tunebat)</a>
                    </div>
                </div>
            </div>
        </div>
    `;
});

html += `
        </div>
    </div>

    <script>
        function updateProgress() {
            // Contar quantos campos foram editados
            const totalTracks = ${data.tracks.length};
            let updated = 0;
            
            for (let i = 0; i < totalTracks; i++) {
                const genre = document.getElementById('genre-' + i).value;
                const originalGenre = 'Electronic';
                
                if (genre !== originalGenre) {
                    updated++;
                }
            }
            
            document.getElementById('progress').textContent = updated;
        }

        function exportJSON() {
            const tracks = [];
            const totalTracks = ${data.tracks.length};
            
            const originalTracks = ${JSON.stringify(data.tracks)};
            
            for (let i = 0; i < totalTracks; i++) {
                const track = {...originalTracks[i]};
                track.genre = document.getElementById('genre-' + i).value;
                track.bpm = parseInt(document.getElementById('bpm-' + i).value);
                track.plays = document.getElementById('plays-' + i).value;
                track.viewsNum = parseInt(document.getElementById('viewsNum-' + i).value);
                tracks.push(track);
            }
            
            const jsonData = {tracks: tracks};
            const jsonString = JSON.stringify(jsonData, null, 2);
            
            // Criar download
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'youtube_data_updated.json';
            a.click();
            URL.revokeObjectURL(url);
            
            alert('✅ JSON exportado! Substitua o arquivo youtube_data.json pelo arquivo baixado.');
        }
    </script>
</body>
</html>
`;

// Salvar HTML
const htmlPath = path.join(__dirname, 'update_data_interface.html');
fs.writeFileSync(htmlPath, html);

console.log(`\n✅ Interface criada com sucesso!\n`);
console.log(`📄 Arquivo: update_data_interface.html`);
console.log(`\n🚀 COMO USAR:`);
console.log(`\n1. Abra o arquivo update_data_interface.html no navegador`);
console.log(`2. Para cada música:`);
console.log(`   - Clique em "Ver Thumbnail" para ver o gênero na imagem`);
console.log(`   - Clique em "Abrir YouTube" para copiar as views exatas`);
console.log(`   - Clique em "Verificar BPM" para ver o BPM no Tunebat`);
console.log(`   - Edite os campos diretamente na página`);
console.log(`3. Quando terminar, clique em "Exportar JSON Atualizado"`);
console.log(`4. Execute: node apply_updates.js`);
console.log(`   (Aplica automaticamente as mudanças em todos os ficheiros)`);
console.log(`5. Recarregue o website para ver as alterações\n`);
console.log(`💡 A interface mostra a thumbnail de cada música para facilitar!\n`);
console.log(`═`.repeat(70));
console.log(`\nAbrindo interface no navegador...`);

// Abrir no navegador
const open = require('child_process').exec;
open(`start "" "${htmlPath}"`);
