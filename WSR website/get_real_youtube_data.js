// Script definitivo para obter dados REAIS do canal YouTube
const puppeteer = require('puppeteer');
const fs = require('fs');

async function getRealYouTubeData() {
    console.log('🎵 Buscando dados REAIS do canal @worldstudiorecords...\n');
    
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📺 Acessando canal do YouTube...');
        await page.goto('https://www.youtube.com/@worldstudiorecords/videos', {
            waitUntil: 'networkidle2',
            timeout: 90000
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Aceitar cookies
        try {
            const acceptButtons = await page.$$('button[aria-label*="Accept"], button[aria-label*="Aceitar"], tp-yt-paper-button');
            if (acceptButtons.length > 0) {
                await acceptButtons[0].click();
                console.log('✓ Cookies aceitos');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {}
        
        // Scroll para carregar mais vídeos
        console.log('📜 Carregando vídeos...');
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('📊 Extraindo dados dos vídeos...\n');
        
        // Extrair dados REAIS
        const videos = await page.evaluate(() => {
            const results = [];
            const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
            
            videoElements.forEach((element, index) => {
                try {
                    // Pegar link/título
                    const titleLink = element.querySelector('a#video-title-link');
                    if (!titleLink) return;
                    
                    const fullTitle = titleLink.getAttribute('title') || titleLink.getAttribute('aria-label') || titleLink.textContent?.trim() || '';
                    const videoUrl = titleLink.href || '';
                    const videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
                    
                    if (!fullTitle || !videoId) return;
                    
                    // Pegar views - procurar em metadata
                    const metadataLine = element.querySelector('#metadata-line');
                    let viewsText = '0';
                    let dateText = '';
                    
                    if (metadataLine) {
                        const spans = metadataLine.querySelectorAll('span.inline-metadata-item');
                        if (spans.length >= 1) {
                            viewsText = spans[0]?.textContent?.trim() || '0 views';
                        }
                        if (spans.length >= 2) {
                            dateText = spans[1]?.textContent?.trim() || '';
                        }
                    }
                    
                    // Pegar duração
                    const durationElement = element.querySelector('ytd-thumbnail-overlay-time-status-renderer span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
                    const duration = durationElement?.textContent?.trim() || '3:30';
                    
                    // Pegar thumbnail
                    const img = element.querySelector('img');
                    let thumbnail = img?.src || img?.getAttribute('src') || '';
                    if (thumbnail.includes('data:image')) {
                        thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
                    } else {
                        thumbnail = thumbnail.split('?')[0];
                    }
                    
                    results.push({
                        fullTitle,
                        videoId,
                        viewsText,
                        dateText,
                        thumbnail,
                        duration
                    });
                    
                } catch (e) {
                    console.error('Erro ao extrair vídeo:', e);
                }
            });
            
            return results;
        });
        
        await browser.close();
        
        console.log(`✅ Encontrados ${videos.length} vídeos\n`);
        
        if (videos.length === 0) {
            console.log('⚠️  Nenhum vídeo encontrado. Verifique o canal.');
            return null;
        }
        
        // Processar dados
        return processVideoData(videos);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (browser) await browser.close();
        return null;
    }
}

function parseViewCount(viewText) {
    // Remove "views" e limpa
    const cleaned = viewText.replace(/views?/i, '').replace(/visualizações?/i, '').trim();
    const match = cleaned.match(/([\d,.]+)\s*([KMB]?)/i);
    
    if (!match) return 0;
    
    const num = parseFloat(match[1].replace(/,/g, '').replace(/\./g, ''));
    const suffix = match[2].toUpperCase();
    
    const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
    return Math.floor(num * (multipliers[suffix] || 1));
}

function formatViewCount(count) {
    if (count >= 1000000000) {
        return `${(count / 1000000000).toFixed(1)}B`;
    } else if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}

function extractArtistAndTitle(videoTitle) {
    // Remover tags comuns
    let title = videoTitle
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Visualizer\)/gi, '')
        .replace(/\[Visualizer\]/gi, '')
        .replace(/\(Lyric.*?\)/gi, '')
        .replace(/\[Lyric.*?\]/gi, '')
        .trim();
    
    // Tentar separar artista e título
    const separators = [' - ', ' – ', ' — ', ': '];
    
    for (const sep of separators) {
        if (title.includes(sep)) {
            const parts = title.split(sep);
            if (parts.length >= 2) {
                return {
                    artist: parts[0].trim(),
                    title: parts.slice(1).join(sep).trim()
                };
            }
        }
    }
    
    // Se não encontrou separador, assumir que é da label
    return {
        artist: 'World Studio Records',
        title: videoTitle
    };
}

function estimateBPM(title) {
    const titleLower = title.toLowerCase();
    
    // Tentar extrair BPM do título
    const bpmMatch = title.match(/(\d{2,3})\s*bpm/i);
    if (bpmMatch) return parseInt(bpmMatch[1]);
    
    // Baseado em palavras-chave
    if (titleLower.includes('house') || titleLower.includes('progressive')) return 128;
    if (titleLower.includes('techno')) return 132;
    if (titleLower.includes('trance')) return 138;
    if (titleLower.includes('dubstep') || titleLower.includes('bass')) return 140;
    if (titleLower.includes('dnb') || titleLower.includes('drum')) return 174;
    if (titleLower.includes('ambient') || titleLower.includes('chill')) return 95;
    
    // Variar entre 124-135
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bpms = [124, 125, 126, 128, 130, 132, 135];
    return bpms[hash % bpms.length];
}

function processVideoData(videos) {
    const tracks = [];
    let totalViews = 0;
    const artistsMap = {};
    
    videos.forEach((video, index) => {
        const { artist, title } = extractArtistAndTitle(video.fullTitle);
        const viewCount = parseViewCount(video.viewsText);
        const plays = formatViewCount(viewCount);
        
        totalViews += viewCount;
        
        const track = {
            number: index + 1,
            title: title,
            artist: artist,
            genre: 'Electronic',
            date: new Date().toISOString().split('T')[0],
            plays: plays,
            viewsNum: viewCount,
            duration: video.duration || '3:30',
            bpm: estimateBPM(video.fullTitle),
            artwork: video.thumbnail,
            videoId: video.videoId,
            youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
            audioFile: `music/${String(index + 1).padStart(3, '0')}_${title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40)}.mp3`
        };
        
        tracks.push(track);
        
        // Mapear artistas (excluir "World Studio Records")
        if (artist !== 'World Studio Records') {
            if (!artistsMap[artist]) {
                artistsMap[artist] = {
                    name: artist,
                    totalViews: 0,
                    tracks: []
                };
            }
            artistsMap[artist].totalViews += viewCount;
            artistsMap[artist].tracks.push(track);
        }
    });
    
    // Ordenar artistas por views
    const artists = Object.values(artistsMap)
        .sort((a, b) => b.totalViews - a.totalViews)
        .map(artist => ({
            name: artist.name,
            totalViews: artist.totalViews,
            totalViewsFormatted: formatViewCount(artist.totalViews),
            tracks: artist.tracks.length,
            image: artist.tracks[0].artwork,
            topTrack: artist.tracks.sort((a, b) => b.viewsNum - a.viewsNum)[0]
        }));
    
    console.log('📊 ESTATÍSTICAS CALCULADAS:\n');
    console.log(`   Total de Views: ${formatViewCount(totalViews)} (${totalViews.toLocaleString()})`);
    console.log(`   Total de Tracks: ${tracks.length}`);
    console.log(`   Total de Artistas: ${artists.length}`);
    console.log('');
    
    console.log('🏆 TOP 5 MÚSICAS:\n');
    tracks.sort((a, b) => b.viewsNum - a.viewsNum).slice(0, 5).forEach((t, i) => {
        console.log(`${i + 1}. ${t.artist} - ${t.title}`);
        console.log(`   ${t.plays} views | ${t.duration} | ${t.bpm} BPM`);
        console.log('');
    });
    
    console.log('👥 TOP 5 ARTISTAS:\n');
    artists.slice(0, 5).forEach((a, i) => {
        console.log(`${i + 1}. ${a.name} - ${a.totalViewsFormatted} (${a.tracks} tracks)`);
    });
    console.log('');
    
    return {
        tracks,
        totalViews,
        totalTracks: tracks.length,
        totalArtists: artists.length,
        artists
    };
}

// Executar
getRealYouTubeData().then(data => {
    if (!data) {
        console.log('❌ Falha ao obter dados. Abortando.');
        process.exit(1);
    }
    
    // Salvar youtube_data.json
    const youtubeData = {
        tracks: data.tracks,
        channelStats: {
            totalViews: data.totalViews,
            totalTracks: data.totalTracks,
            totalArtists: data.totalArtists
        }
    };
    
    fs.writeFileSync('youtube_data.json', JSON.stringify(youtubeData, null, 2));
    console.log('✅ youtube_data.json atualizado');
    
    // Calcular artist_stats
    const topReleases = [...data.tracks]
        .sort((a, b) => b.viewsNum - a.viewsNum)
        .slice(0, 8);
    
    const artistStats = {
        labelStats: {
            totalStreams: data.totalViews,
            totalStreamsFormatted: formatViewCount(data.totalViews),
            totalTracks: data.totalTracks,
            totalArtists: data.totalArtists
        },
        topReleases,
        topArtists: data.artists.slice(0, 3),
        allArtists: data.artists
    };
    
    fs.writeFileSync('artist_stats.json', JSON.stringify(artistStats, null, 2));
    console.log('✅ artist_stats.json atualizado');
    
    // Atualizar index.html
    console.log('\n📝 Atualizando index.html...');
    
    let html = fs.readFileSync('index.html', 'utf-8');
    
    // Atualizar estatísticas
    html = html.replace(
        /<div class="stat-value">[\d.]+[KMB]?\+<\/div>\s*<div class="stat-label">Total Streams<\/div>/,
        `<div class="stat-value">${formatViewCount(data.totalViews)}+</div>\n                        <div class="stat-label">Total Streams</div>`
    );
    
    html = html.replace(
        /<div class="stat-value">[\d.]+\+<\/div>\s*<div class="stat-label">Signed Artists<\/div>/,
        `<div class="stat-value">${data.totalArtists}+</div>\n                        <div class="stat-label">Signed Artists</div>`
    );
    
    html = html.replace(
        /<div class="stat-value">[\d.]+[KMB]?\+<\/div>\s*<div class="stat-label">Releases<\/div>/,
        `<div class="stat-value">${data.totalTracks}+</div>\n                        <div class="stat-label">Releases</div>`
    );
    
    fs.writeFileSync('index.html', html);
    console.log('✅ index.html atualizado');
    
    console.log('\n🎉 ATUALIZAÇÃO COMPLETA!\n');
    console.log('📊 Estatísticas finais:');
    console.log(`   - Total Streams: ${formatViewCount(data.totalViews)}`);
    console.log(`   - Artistas: ${data.totalArtists}`);
    console.log(`   - Releases: ${data.totalTracks}`);
    console.log('');
}).catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
