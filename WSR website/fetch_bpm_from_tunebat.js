// Script para extrair BPM exato do Tunebat e atualizar automaticamente
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const dataPath = path.join(__dirname, 'youtube_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updated = 0;
let failed = 0;

// Função para fazer request HTTP/HTTPS
function fetch(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (res) => {
            // Seguir redirecionamentos
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetch(res.headers.location).then(resolve).catch(reject);
            }
            
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

// Função para extrair BPM do HTML do Tunebat
function extractBPM(html) {
    try {
        // Padrão 1: Buscar por "BPM" com número antes ou depois
        let match = html.match(/(\d{2,3})\s*BPM/i);
        if (match) return parseInt(match[1]);
        
        // Padrão 2: Buscar em JSON embebido
        match = html.match(/"bpm[":]+\s*(\d{2,3})/i);
        if (match) return parseInt(match[1]);
        
        // Padrão 3: Buscar em meta tags
        match = html.match(/content="(\d{2,3})\s*BPM"/i);
        if (match) return parseInt(match[1]);
        
        return null;
    } catch (error) {
        return null;
    }
}

// Limpar título para busca
function cleanTitle(title) {
    return title
        .replace(/\[WSR Release\]/gi, '')
        .replace(/\[WSR X NCR Release\]/gi, '')
        .replace(/\[WSR x NCR Release\]/gi, '')
        .replace(/\[WSR Battle\]/gi, '')
        .replace(/\(.*?\)/g, '')
        .trim();
}

// Processar cada track
async function updateTrack(track, index) {
    try {
        const cleanedTitle = cleanTitle(track.title);
        const searchQuery = `${track.artist} ${cleanedTitle}`;
        
        console.log(`\n[${index + 1}/${data.tracks.length}] ${track.title}`);
        console.log(`   🎵 Artista: ${track.artist}`);
        console.log(`   🔍 Buscando: ${searchQuery}`);
        
        // Buscar no Tunebat
        const searchUrl = `https://tunebat.com/Search?q=${encodeURIComponent(searchQuery)}`;
        console.log(`   🌐 URL: ${searchUrl}`);
        
        const html = await fetch(searchUrl);
        const bpm = extractBPM(html);
        
        if (bpm && bpm >= 60 && bpm <= 200) {
            const oldBpm = track.bpm;
            track.bpm = bpm;
            console.log(`   ✅ BPM atualizado: ${oldBpm} → ${bpm}`);
            updated++;
        } else {
            console.log(`   ⚠️  BPM não encontrado ou inválido (mantém ${track.bpm})`);
            failed++;
        }
        
        // Aguardar 3 segundos entre requests (evitar rate limit)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
    } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        failed++;
    }
}

// Executar atualização
async function main() {
    console.log('🎵 Iniciando busca de BPMs no Tunebat...\n');
    console.log('⏱️  Isso vai levar alguns minutos (3s por música)\n');
    console.log('📊 Total de músicas: ' + data.tracks.length + '\n');
    console.log('='.repeat(70));
    
    for (let i = 0; i < data.tracks.length; i++) {
        await updateTrack(data.tracks[i], i);
    }
    
    // Salvar arquivo atualizado
    const backupPath = path.join(__dirname, 'youtube_data_backup_bpm.json');
    fs.writeFileSync(backupPath, JSON.stringify(JSON.parse(fs.readFileSync(dataPath, 'utf8')), null, 2));
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ CONCLUÍDO!');
    console.log('='.repeat(70));
    console.log(`✅ ${updated} BPMs atualizados`);
    console.log(`⚠️  ${failed} não encontrados ou mantidos`);
    console.log(`💾 Backup salvo em: youtube_data_backup_bpm.json`);
    console.log(`📝 Arquivo atualizado: youtube_data.json`);
    console.log('');
    console.log('🔄 Recarregue a página do website para ver os BPMs atualizados!');
    console.log('');
}

main().catch(console.error);
