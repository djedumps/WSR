// Script para atualizar dados do YouTube sem usar API
// Scraping manual de views, BPM e gênero das thumbnails

const fs = require('fs');
const https = require('https');
const path = require('path');

// Lê o arquivo youtube_data.json
const dataPath = path.join(__dirname, 'youtube_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Função para fazer request HTTP
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Função para extrair views da página do YouTube
async function getYouTubeViews(videoId) {
    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const html = await httpsGet(url);
        
        // Procura por padrão de views no HTML
        const viewMatch = html.match(/"viewCount":"(\d+)"/);
        if (viewMatch) {
            const views = parseInt(viewMatch[1]);
            return formatViews(views);
        }
        
        return null;
    } catch (error) {
        console.error(`Erro ao buscar views de ${videoId}:`, error.message);
        return null;
    }
}

// Formatar views (ex: 2900 -> 2.9k, 1500000 -> 1.5M)
function formatViews(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// Função para buscar BPM em sites especializados
async function getBPMFromSite(artist, title) {
    try {
        // Tunebat.com é uma boa fonte de BPM
        const searchQuery = encodeURIComponent(`${artist} ${title}`);
        console.log(`🔍 Buscar BPM manualmente em: https://tunebat.com/Search?q=${searchQuery}`);
        console.log(`   Ou em: https://songbpm.com/@${searchQuery}`);
        return null; // Retorna null porque precisa ser feito manualmente
    } catch (error) {
        console.error('Erro:', error.message);
        return null;
    }
}

// INSTRUÇÕES PARA ATUALIZAÇÃO MANUAL:
console.log('='.repeat(70));
console.log('📋 GUIA DE ATUALIZAÇÃO MANUAL DOS DADOS');
console.log('='.repeat(70));
console.log('');
console.log('Para cada música, você precisa:');
console.log('');
console.log('1️⃣  GÊNERO - Olhar a thumbnail e extrair o gênero escrito');
console.log('   Abra cada thumbnail no navegador e veja o texto');
console.log('');
console.log('2️⃣  VIEWS - Ir ao vídeo no YouTube e copiar o número exato');
console.log('   Formato: 2.9k, 15.3k, 1.2M, etc.');
console.log('');
console.log('3️⃣  BPM - Pesquisar em sites especializados:');
console.log('   • https://tunebat.com');
console.log('   • https://songbpm.com');
console.log('   • https://bpmdatabase.com');
console.log('');
console.log('='.repeat(70));
console.log('');

// Lista todas as músicas para atualização
console.log('📝 LISTA DE MÚSICAS PARA ATUALIZAR:\n');
data.tracks.forEach((track, index) => {
    console.log(`${index + 1}. ${track.title}`);
    console.log(`   Artista: ${track.artist}`);
    console.log(`   Gênero atual: ${track.genre}`);
    console.log(`   Views atuais: ${track.plays}`);
    console.log(`   BPM atual: ${track.bpm}`);
    console.log(`   Thumbnail: ${track.artwork}`);
    console.log(`   YouTube: ${track.youtubeUrl}`);
    console.log(`   BPM search: https://tunebat.com/Search?q=${encodeURIComponent(`${track.artist} ${track.title.replace(/\[.*?\]/g, '').trim()}`)}`);
    console.log('');
});

console.log('='.repeat(70));
console.log('💡 COMO USAR:');
console.log('');
console.log('1. Abra youtube_data.json no editor');
console.log('2. Para cada track, atualize manualmente:');
console.log('   - "genre": veja na thumbnail');
console.log('   - "plays": vá ao YouTube e copie as views');
console.log('   - "viewsNum": converta para número (2.9k = 2900, 1.5M = 1500000)');
console.log('   - "bpm": pesquise nos sites acima');
console.log('3. Salve o arquivo');
console.log('4. Recarregue a página do website');
console.log('');
console.log('='.repeat(70));
console.log('');
console.log('🚀 OPCIONAL: Script automático de scraping');
console.log('');
console.log('Execute: node scrape_real_data.js');
console.log('(será criado em seguida)');
console.log('');
