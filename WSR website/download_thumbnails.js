const fs = require('fs');
const https = require('https');
const path = require('path');

// Criar pasta thumbnails se não existir
const thumbnailsDir = path.join(__dirname, 'thumbnails');
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir);
}

// Ler dados do YouTube
const youtubeData = JSON.parse(fs.readFileSync('youtube_data.json', 'utf8'));
const tracks = youtubeData.tracks;

let completed = 0;
let successful = 0;

console.log(`\n🎬 Baixando thumbnails de ${tracks.length} vídeos...\n`);

function sanitizeFilename(str) {
    return str.replace(/[\\/:*?"<>|]/g, '_');
}

function downloadThumbnail(track, index) {
    return new Promise((resolve) => {
        const videoId = track.videoId;
        const title = sanitizeFilename(track.title);
        const num = String(track.number).padStart(3, '0');
        const filename = path.join(thumbnailsDir, `${num}_${title}.jpg`);
        
        // Tentar maxresdefault primeiro
        const maxresUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        const hqUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        
        const tryDownload = (url, quality) => {
            https.get(url, (response) => {
                if (response.statusCode === 200) {
                    const fileStream = fs.createWriteStream(filename);
                    response.pipe(fileStream);
                    
                    fileStream.on('finish', () => {
                        fileStream.close();
                        completed++;
                        successful++;
                        console.log(`[${completed}/${tracks.length}] ✓ ${title} (${quality})`);
                        resolve(true);
                    });
                } else if (quality === 'MaxRes') {
                    // Se maxres falhar, tentar HQ
                    tryDownload(hqUrl, 'HQ');
                } else {
                    completed++;
                    console.log(`[${completed}/${tracks.length}] ✗ ${title} - Erro HTTP ${response.statusCode}`);
                    resolve(false);
                }
            }).on('error', (err) => {
                if (quality === 'MaxRes') {
                    // Se maxres falhar, tentar HQ
                    tryDownload(hqUrl, 'HQ');
                } else {
                    completed++;
                    console.log(`[${completed}/${tracks.length}] ✗ ${title} - ${err.message}`);
                    resolve(false);
                }
            });
        };
        
        tryDownload(maxresUrl, 'MaxRes');
    });
}

// Baixar todos com delay entre cada um
async function downloadAll() {
    for (let i = 0; i < tracks.length; i++) {
        await downloadThumbnail(tracks[i], i);
        // Pequeno delay entre downloads
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n✅ Download completo: ${successful}/${tracks.length} thumbnails salvos em 'thumbnails/'\n`);
}

downloadAll().catch(console.error);
