// YouTube scraper with Puppeteer (browser automation)
const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeYouTubeChannel() {
    console.log('🎵 Starting YouTube scraper with Puppeteer...\n');
    
    let browser;
    
    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set realistic browser properties
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('Navigating to World Studio Records channel...');
        await page.goto('https://www.youtube.com/@worldstudiorecords/videos', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });
        
        console.log('Waiting for page to stabilize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try to accept cookies if prompted
        try {
            const acceptButton = await page.$('button[aria-label*="Accept"], button[aria-label*="Aceitar"], button[aria-label*="all"], tp-yt-paper-button');
            if (acceptButton) {
                await acceptButton.click();
                console.log('Accepted cookies');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (e) {
            console.log('No cookie prompt or already accepted');
        }
        
        // Wait for video grid to load
        console.log('Waiting for videos to load...');
        try {
            await page.waitForSelector('ytd-rich-item-renderer, ytd-grid-video-renderer', { timeout: 15000 });
            console.log('Video grid loaded');
        } catch (e) {
            console.log('Timeout waiting for videos, trying alternative selectors...');
        }
        
        // Scroll to load more videos
        console.log('Scrolling to load videos...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Extracting video data...');
        
        // Extract video information
        const videos = await page.evaluate(() => {
            const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
            const videos = [];
            
            console.log(`Found ${videoElements.length} video elements`);
            
            videoElements.forEach((element, index) => {
                if (index >= 30) return; // Limit to 30 videos
                
                try {
                    // Get title link
                    const titleLink = element.querySelector('a#video-title-link');
                    if (!titleLink) return;
                    
                    const title = titleLink.getAttribute('title') || titleLink.textContent?.trim() || '';
                    const videoUrl = titleLink.href || '';
                    const videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';
                    
                    if (!title || !videoId) return;
                    
                    // Get metadata
                    const metaLine = element.querySelector('#metadata-line');
                    let viewsText = '0 views';
                    let dateText = '';
                    
                    if (metaLine) {
                        const spans = metaLine.querySelectorAll('span');
                        if (spans.length >= 1) viewsText = spans[0]?.textContent?.trim() || '0 views';
                        if (spans.length >= 2) dateText = spans[1]?.textContent?.trim() || '';
                    }
                    
                    // Get thumbnail
                    const img = element.querySelector('img');
                    const thumbnail = img?.src || img?.getAttribute('src') || '';
                    
                    // Get duration
                    const durationOverlay = element.querySelector('ytd-thumbnail-overlay-time-status-renderer span');
                    const duration = durationOverlay?.textContent?.trim() || '3:45';
                    
                    videos.push({
                        title,
                        videoId,
                        viewsText,
                        dateText,
                        thumbnail: thumbnail.split('?')[0],
                        duration
                    });
                    
                } catch (e) {
                    console.error('Error extracting video:', e);
                }
            });
            
            console.log(`Extracted ${videos.length} videos`);
            return videos;
        });
        
        console.log(`✅ Found ${videos.length} videos\n`);
        
        if (videos.length === 0) {
            console.log('⚠️  No videos extracted. Using fallback data.');
            return generateFallbackData();
        }
        
        // Process and structure the data
        const data = processVideoData(videos);
        
        // Show sample
        console.log('Sample tracks:');
        data.tracks.slice(0, 5).forEach(track => {
            console.log(`   ${track.number}. ${track.artist} - ${track.title} (${track.genre}) [${track.plays}]`);
        });
        
        return data;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('Using fallback data...');
        return generateFallbackData();
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight || totalHeight >= 3000) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

function parseViewCount(viewText) {
    const match = viewText.match(/([\d,.]+)\s*([KMB]?)/i);
    if (!match) return 0;
    
    const num = parseFloat(match[1].replace(/,/g, ''));
    const suffix = match[2].toUpperCase();
    
    const multipliers = { K: 1000, M: 1000000, B: 1000000000 };
    return Math.floor(num * (multipliers[suffix] || 1));
}

function formatViewCount(count) {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}

function extractArtistAndTitle(videoTitle) {
    let title = videoTitle
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Visualizer\)/gi, '')
        .replace(/\[Visualizer\]/gi, '')
        .replace(/\(Lyric.*?\)/gi, '')
        .replace(/\[Lyric.*?\]/gi, '')
        .trim();
    
    const separators = [' - ', ' – ', ' — ', ': ', ' | '];
    
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
    
    return {
        artist: 'World Studio Records',
        title: videoTitle
    };
}

function guessGenre(title) {
    const titleLower = title.toLowerCase();
    
    const genreMap = {
        'Progressive House': ['progressive', 'prog house', 'melodic house'],
        'Techno': ['techno'],
        'Tech House': ['tech house'],
        'Deep House': ['deep house'],
        'House': ['house'],
        'Trance': ['trance', 'uplifting'],
        'Psytrance': ['psytrance', 'psy'],
        'Future Bass': ['future bass'],
        'Dubstep': ['dubstep'],
        'Drum & Bass': ['drum and bass', 'dnb', 'd&b', 'drum&bass'],
        'Synthwave': ['synthwave', 'retrowave'],
        'Ambient': ['ambient', 'chill'],
        'EDM': ['edm'],
    };
    
    for (const [genre, keywords] of Object.entries(genreMap)) {
        if (keywords.some(kw => titleLower.includes(kw))) {
            return genre;
        }
    }
    
    return 'Electronic';
}

function estimateBPM(genre) {
    const bpmRanges = {
        'Techno': 130,
        'Tech House': 125,
        'Progressive House': 128,
        'House': 125,
        'Deep House': 120,
        'Trance': 138,
        'Psytrance': 145,
        'Dubstep': 140,
        'Drum & Bass': 174,
        'Future Bass': 150,
        'Synthwave': 110,
        'Ambient': 90,
    };
    
    return bpmRanges[genre] || 128;
}

function processVideoData(videos) {
    const tracks = [];
    const artistsMap = {};
    
    videos.forEach((video, index) => {
        const { artist, title } = extractArtistAndTitle(video.title);
        const genre = guessGenre(video.title);
        const viewCount = parseViewCount(video.viewsText);
        const plays = formatViewCount(viewCount);
        
        const artwork = video.videoId 
            ? `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`
            : video.thumbnail;
        
        const track = {
            number: index + 1,
            title: title,
            artist: artist,
            genre: genre,
            date: new Date().toISOString().split('T')[0],
            plays: plays,
            duration: video.duration,
            bpm: estimateBPM(genre),
            artwork: artwork,
            videoId: video.videoId
        };
        
        tracks.push(track);
        
        if (!artistsMap[artist]) {
            artistsMap[artist] = {
                name: artist,
                genres: new Set(),
                tracks: 0,
                totalViews: 0,
                artworks: []
            };
        }
        
        artistsMap[artist].genres.add(genre);
        artistsMap[artist].tracks++;
        artistsMap[artist].totalViews += viewCount;
        artistsMap[artist].artworks.push(artwork);
    });
    
    const artists = Object.values(artistsMap).map(artist => {
        const totalViews = artist.totalViews;
        const followers = totalViews >= 100000 
            ? `${Math.floor(totalViews / 10000)}K`
            : `${Math.floor(totalViews / 1000)}K`;
        const streams = totalViews >= 100000
            ? `${Math.floor(totalViews / 100000)}M`
            : `${(totalViews / 100000).toFixed(1)}M`;
        
        return {
            name: artist.name,
            genres: Array.from(artist.genres).slice(0, 2),
            bio: `Electronic music producer signed to World Studio Records. ${artist.tracks} releases on the label.`,
            image: artist.artworks[0],
            avatar: artist.artworks[0],
            tracks: artist.tracks,
            followers: followers,
            streams: streams,
            country: '🌍 Global'
        };
    });
    
    return { tracks, artists };
}

function generateFallbackData() {
    return {
        tracks: [
            { number: 1, title: 'Midnight Dreams', artist: 'Various Artists', genre: 'Progressive House', date: '2025-12-15', plays: '1.2M', duration: '3:45', bpm: 128, artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', videoId: '' },
            { number: 2, title: 'Eclipse', artist: 'Various Artists', genre: 'Techno', date: '2025-12-10', plays: '850K', duration: '4:12', bpm: 130, artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400', videoId: '' },
            { number: 3, title: 'Horizon', artist: 'Various Artists', genre: 'House', date: '2025-12-05', plays: '920K', duration: '3:58', bpm: 125, artwork: 'https://images.unsplash.com/photo-1571266028243-d220b925a05c?w=400', videoId: '' },
        ],
        artists: [
            { name: 'Various Artists', genres: ['Progressive House', 'Techno'], bio: 'World Studio Records collective.', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', tracks: 3, followers: '100K', streams: '10M', country: '🌍 Global' }
        ]
    };
}

async function main() {
    const data = await scrapeYouTubeChannel();
    
    // Save to JSON
    fs.writeFileSync('youtube_data.json', JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`\n📝 Saved to youtube_data.json`);
    console.log(`   - Tracks: ${data.tracks.length}`);
    console.log(`   - Artists: ${data.artists.length}\n`);
    
    console.log('✅ Running update script...\n');
    
    // Run update script
    require('./update_website.js');
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    main().catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
} catch (e) {
    console.log('⚠️  Puppeteer not installed yet.');
    console.log('Please wait for: npm install puppeteer');
    console.log('Then run: node puppeteer_scraper.js');
}
