// Script para extrair BPM preciso de múltiplas fontes usando links do YouTube
const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

const dataPath = path.join(__dirname, 'youtube_data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updated = 0;
let failed = 0;
const results = [];

// Função para fazer request HTTP/HTTPS
function fetch(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
            }
        }, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return fetch(res.headers.location).then(resolve).catch(reject);
            }
            
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

// Extrair BPM da descrição do YouTube
function extractBPMFromYouTube(html) {
    try {
        // Procurar por padrões comuns de BPM na descrição
        const patterns = [
            /BPM[:\s]*(\d{2,3})/i,
            /(\d{2,3})\s*BPM/i,
            /Tempo[:\s]*(\d{2,3})/i,
            /(\d{2,3})\s*tempo/i,
            /"description"[^}]*(\d{2,3})\s*BPM/i,
            /"description"[^}]*BPM[:\s]*(\d{2,3})/i
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                const bpm = parseInt(match[1]);
                if (bpm >= 60 && bpm <= 200) {
                    return { bpm, source: 'YouTube Description' };
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// Extrair BPM do Tunebat
function extractBPMFromTunebat(html) {
    try {
        const patterns = [
            /"tempo[":]+\s*(\d{2,3})/i,
            /Tempo[:\s]*<[^>]*>(\d{2,3})/i,
            /"bpm[":]+\s*(\d{2,3})/i,
            /(\d{2,3})\s*BPM/i,
            /BPM[:\s]*(\d{2,3})/i
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                const bpm = parseInt(match[1]);
                if (bpm >= 60 && bpm <= 200) {
                    return { bpm, source: 'Tunebat' };
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// Extrair BPM do SongBPM
function extractBPMFromSongBPM(html) {
    try {
        const patterns = [
            /"bpm[":]+\s*(\d{2,3})/i,
            /BPM[:\s]*(\d{2,3})/i,
            /(\d{2,3})\s*BPM/i,
            /tempo[:\s]*(\d{2,3})/i
        ];
        
        for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                const bpm = parseInt(match[1]);
                if (bpm >= 60 && bpm <= 200) {
                    return { bpm, source: 'SongBPM' };
                }
            }
        }
        
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

// Buscar BPM em múltiplas fontes
async function findBPM(track, cleanedTitle) {
    // 1. Tentar YouTube (descrição do vídeo)
    try {
        console.log('   🔍 Tentando YouTube...');
        const ytHtml = await fetch(track.youtubeUrl);
        const ytResult = extractBPMFromYouTube(ytHtml);
        if (ytResult) {
            return ytResult;
        }
    } catch (error) {
        console.log('   ⚠️  Erro no YouTube:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 2. Tentar Tunebat
    try {
        console.log('   🔍 Tentando Tunebat...');
        const tunebatUrl = `https://tunebat.com/Search?q=${encodeURIComponent(track.artist + ' ' + cleanedTitle)}`;
        const tunebatHtml = await fetch(tunebatUrl);
        const tunebatResult = extractBPMFromTunebat(tunebatHtml);
        if (tunebatResult) {
            return tunebatResult;
        }
    } catch (error) {
        console.log('   ⚠️  Erro no Tunebat:', error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Tentar SongBPM
    try {
        console.log('   🔍 Tentando SongBPM...');
        const songbpmUrl = `https://songbpm.com/@${encodeURIComponent(track.artist + ' ' + cleanedTitle)}`;
        const songbpmHtml = await fetch(songbpmUrl);
        const songbpmResult = extractBPMFromSongBPM(songbpmHtml);
        if (songbpmResult) {
            return songbpmResult;
        }
    } catch (error) {
        console.log('   ⚠️  Erro no SongBPM:', error.message);
    }
    
    return null;
}

// Processar cada track
async function updateTrack(track, index) {
    const cleanedTitle = cleanTitle(track.title);
    const searchQuery = `${track.artist} ${cleanedTitle}`;
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${index + 1}/${data.tracks.length}] ${track.title}`);
    console.log(`   🎵 Artista: ${track.artist}`);
    console.log(`   🔗 YouTube: ${track.youtubeUrl}`);
    console.log(`   🎯 BPM atual: ${track.bpm}`);
    
    try {
        const result = await findBPM(track, cleanedTitle);
        
        if (result) {
            const oldBpm = track.bpm;
            track.bpm = result.bpm;
            console.log(`   ✅ BPM ATUALIZADO: ${oldBpm} → ${result.bpm} (fonte: ${result.source})`);
            updated++;
            results.push({
                track: track.title,
                artist: track.artist,
                oldBpm: oldBpm,
                newBpm: result.bpm,
                source: result.source,
                status: 'success'
            });
        } else {
            console.log(`   ❌ BPM não encontrado (mantém ${track.bpm})`);
            failed++;
            results.push({
                track: track.title,
                artist: track.artist,
                bpm: track.bpm,
                status: 'not_found'
            });
        }
        
        // Aguardar 2 segundos entre tracks
        await new Promise(resolve => setTimeout(resolve, 2000));
        
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        failed++;
        results.push({
            track: track.title,
            artist: track.artist,
            error: error.message,
            status: 'error'
        });
    }
}

// Executar atualização
async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🎵 EXTRAÇÃO AUTOMÁTICA DE BPMs - MULTI-SOURCE');
    console.log('='.repeat(70));
    console.log('\n📊 Total de músicas: ' + data.tracks.length);
    console.log('⏱️  Tempo estimado: ~' + Math.ceil(data.tracks.length * 8 / 60) + ' minutos');
    console.log('\n🔍 Fontes de dados (em ordem de prioridade):');
    console.log('   1. YouTube (descrição do vídeo)');
    console.log('   2. Tunebat');
    console.log('   3. SongBPM');
    console.log('\n' + '='.repeat(70));
    
    for (let i = 0; i < data.tracks.length; i++) {
        await updateTrack(data.tracks[i], i);
    }
    
    // Salvar arquivo atualizado
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `youtube_data_backup_${timestamp}.json`);
    
    // Criar backup do original
    const originalData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2));
    
    // Salvar dados atualizados
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    // Salvar relatório detalhado
    const reportPath = path.join(__dirname, `bpm_update_report_${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ CONCLUÍDO!');
    console.log('='.repeat(70));
    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ❌ Não encontrados: ${failed}`);
    console.log(`   📊 Taxa de sucesso: ${((updated / data.tracks.length) * 100).toFixed(1)}%`);
    console.log(`\n💾 ARQUIVOS SALVOS:`);
    console.log(`   📄 Dados atualizados: youtube_data.json`);
    console.log(`   🔙 Backup criado: ${path.basename(backupPath)}`);
    console.log(`   📊 Relatório detalhado: ${path.basename(reportPath)}`);
    console.log(`\n🎯 DISTRIBUIÇÃO POR FONTE:`);
    const sources = {};
    results.filter(r => r.status === 'success').forEach(r => {
        sources[r.source] = (sources[r.source] || 0) + 1;
    });
    Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} músicas`);
    });
    console.log('\n' + '='.repeat(70));
    console.log('\n🔄 PRÓXIMO PASSO:');
    console.log('   Recarregue a página do website (Ctrl+Shift+R)');
    console.log('   Os BPMs estarão atualizados automaticamente!\n');
}

main().catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
});
