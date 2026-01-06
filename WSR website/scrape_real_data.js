// Script para fazer scraping de dados reais do YouTube
// Extrai views diretamente das páginas sem usar API

const fs = require('fs');
const https = require('https');
const path = require('path');

const dataPath = path.join(__dirname, 'youtube_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updated = 0;
let failed = 0;

// Função para fazer request HTTP/HTTPS
function fetch(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : require('http');
        protocol.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

// Função para extrair views do HTML do YouTube
function extractViews(html) {
    try {
        // Padrão 1: viewCount no JSON embebido
        let match = html.match(/"viewCount":"(\d+)"/);
        if (match) return parseInt(match[1]);
        
        // Padrão 2: text com "views"
        match = html.match(/(\d[\d,]*)\s*views/i);
        if (match) return parseInt(match[1].replace(/,/g, ''));
        
        return null;
    } catch (error) {
        return null;
    }
}

// Formatar número de views
function formatViews(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
}

// Processar cada track
async function updateTrack(track, index) {
    try {
        console.log(`\n[${index + 1}/${data.tracks.length}] ${track.title}`);
        
        // Buscar views do YouTube
        const url = `https://www.youtube.com/watch?v=${track.videoId}`;
        console.log(`   🔍 Buscando: ${url}`);
        
        const html = await fetch(url);
        const viewsNum = extractViews(html);
        
        if (viewsNum) {
            track.viewsNum = viewsNum;
            track.plays = formatViews(viewsNum);
            console.log(`   ✅ Views atualizadas: ${track.plays} (${viewsNum})`);
            updated++;
        } else {
            console.log(`   ⚠️  Não foi possível extrair views`);
            failed++;
        }
        
        // Aguardar 2 segundos entre requests (evitar rate limit)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        failed++;
    }
}

// Executar atualização
async function main() {
    console.log('🚀 Iniciando scraping de dados do YouTube...\n');
    console.log('⏱️  Isso pode levar alguns minutos (2s por música)\n');
    
    for (let i = 0; i < data.tracks.length; i++) {
        await updateTrack(data.tracks[i], i);
    }
    
    // Salvar arquivo atualizado
    const backupPath = path.join(__dirname, 'youtube_data_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ CONCLUÍDO!');
    console.log('='.repeat(70));
    console.log(`✅ ${updated} músicas atualizadas`);
    console.log(`❌ ${failed} falharam`);
    console.log(`💾 Backup salvo em: youtube_data_backup.json`);
    console.log(`📝 Arquivo atualizado: youtube_data.json`);
    console.log('');
    console.log('⚠️  PRÓXIMOS PASSOS:');
    console.log('');
    console.log('1. Revisar youtube_data.json e corrigir manualmente:');
    console.log('   - Gêneros (olhar nas thumbnails)');
    console.log('   - BPM (usar https://tunebat.com)');
    console.log('');
    console.log('2. Recarregar a página do website');
    console.log('');
}

main().catch(console.error);
