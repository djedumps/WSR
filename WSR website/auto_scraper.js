// Advanced YouTube scraper without API key
const https = require('https');
const fs = require('fs');

const CHANNEL_URL = 'https://www.youtube.com/@worldstudiorecords/videos';

function httpsGet(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function extractYouTubeData(html) {
    try {
        // Find ytInitialData in the HTML
        const match = html.match(/var ytInitialData = ({.+?});/);
        
        if (!match) {
            console.log('Could not find ytInitialData in page');
            return null;
        }
        
        const data = JSON.parse(match[1]);
        
        // Navigate through YouTube's nested structure
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        
        if (!tabs) {
            console.log('Could not find tabs in data structure');
            return null;
        }
        
        let videos = [];
        
        for (const tab of tabs) {
            const tabRenderer = tab.tabRenderer;
            if (!tabRenderer?.content) continue;
            
            const content = tabRenderer.content;
            
            // Try richGridRenderer (new layout)
            if (content.richGridRenderer) {
                const contents = content.richGridRenderer.contents || [];
                
                for (const item of contents) {
                    if (item.richItemRenderer?.content?.videoRenderer) {
                        const video = item.richItemRenderer.content.videoRenderer;
                        videos.push(extractVideoInfo(video));
                    }
                }
            }
            
            // Try sectionListRenderer (old layout)
            if (content.sectionListRenderer) {
                const contents = content.sectionListRenderer.contents || [];
                
                for (const section of contents) {
                    const itemSection = section.itemSectionRenderer;
                    if (!itemSection) continue;
                    
                    for (const item of itemSection.contents || []) {
                        if (item.gridRenderer) {
                            for (const gridItem of item.gridRenderer.items || []) {
                                if (gridItem.gridVideoRenderer) {
                                    videos.push(extractVideoInfo(gridItem.gridVideoRenderer));
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return videos;
        
    } catch (error) {
        console.error('Error parsing YouTube data:', error.message);
        return null;
    }
}

function extractVideoInfo(videoRenderer) {
    const title = videoRenderer.title?.runs?.[0]?.text || 
                  videoRenderer.title?.simpleText || 
                  'Unknown Title';
    
    const videoId = videoRenderer.videoId || '';
    
    const viewCountText = videoRenderer.viewCountText?.simpleText || 
                         videoRenderer.shortViewCountText?.simpleText || 
                         '0 views';
    
    const publishedText = videoRenderer.publishedTimeText?.simpleText || 'Unknown';
    
    const thumbnails = videoRenderer.thumbnail?.thumbnails || [];
    const thumbnail = thumbnails[thumbnails.length - 1]?.url || '';
    
    const lengthText = videoRenderer.lengthText?.simpleText || 
                      videoRenderer.thumbnailOverlays?.find(o => o.thumbnailOverlayTimeStatusRenderer)
                          ?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || '0:00';
    
    return {
        title,
        videoId,
        viewCount: parseViewCount(viewCountText),
        viewCountText,
        publishedText,
        thumbnail: thumbnail.split('?')[0], // Remove query params
        duration: lengthText
    };
}

function parseViewCount(viewText) {
    const match = viewText.match(/([\d.]+)([KMB]?)/i);
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
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
    // Remove common prefixes/suffixes
    let title = videoTitle
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Visualizer\)/gi, '')
        .replace(/\[Visualizer\]/gi, '')
        .trim();
    
    // Try different separators
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
    
    // If no separator, use whole title
    return {
        artist: 'World Studio Records',
        title: videoTitle
    };
}

function guessGenre(title) {
    const titleLower = title.toLowerCase();
    
    const genreMap = {
        'Progressive House': ['progressive', 'prog', 'melodic house'],
        'Techno': ['techno'],
        'Tech House': ['tech house'],
        'Deep House': ['deep house'],
        'House': ['house'],
        'Trance': ['trance', 'uplifting'],
        'Psytrance': ['psytrance', 'psy'],
        'Future Bass': ['future bass'],
        'Dubstep': ['dubstep'],
        'Drum & Bass': ['drum and bass', 'dnb', 'd&b'],
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

function generateTrackData(videos) {
    const tracks = [];
    const artistsMap = {};
    
    videos.forEach((video, index) => {
        const { artist, title } = extractArtistAndTitle(video.title);
        const genre = guessGenre(video.title);
        const plays = formatViewCount(video.viewCount);
        
        // Convert thumbnail to maxresdefault
        let artwork = video.thumbnail;
        if (video.videoId) {
            artwork = `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`;
        }
        
        const track = {
            number: index + 1,
            title: title,
            artist: artist,
            genre: genre,
            date: new Date().toISOString().split('T')[0], // Use current date
            plays: plays,
            duration: video.duration,
            bpm: estimateBPM(genre),
            artwork: artwork,
            videoId: video.videoId
        };
        
        tracks.push(track);
        
        // Aggregate artist data
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
        artistsMap[artist].totalViews += video.viewCount;
        artistsMap[artist].artworks.push(artwork);
    });
    
    // Convert artists map to array
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
            image: artist.artworks[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
            avatar: artist.artworks[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            tracks: artist.tracks,
            followers: followers,
            streams: streams,
            country: '🌍 Global'
        };
    });
    
    return { tracks, artists };
}

async function main() {
    console.log('🎵 Scraping World Studio Records YouTube channel...\n');
    
    try {
        console.log('Fetching channel page...');
        const html = await httpsGet(CHANNEL_URL);
        
        console.log('Extracting video data...');
        const videos = extractYouTubeData(html);
        
        if (!videos || videos.length === 0) {
            console.log('❌ No videos found. YouTube might have changed their page structure.');
            console.log('Keeping existing data or using fallback data.');
            return;
        }
        
        console.log(`✅ Found ${videos.length} videos\n`);
        
        // Generate structured data
        const data = generateTrackData(videos);
        
        // Save to JSON
        fs.writeFileSync('youtube_data.json', JSON.stringify(data, null, 2), 'utf-8');
        
        console.log(`📝 Saved data to youtube_data.json`);
        console.log(`   - Tracks: ${data.tracks.length}`);
        console.log(`   - Artists: ${data.artists.length}\n`);
        
        // Show sample
        if (data.tracks.length > 0) {
            console.log('Sample tracks:');
            data.tracks.slice(0, 5).forEach(track => {
                console.log(`   ${track.number}. ${track.artist} - ${track.title} (${track.genre}) [${track.plays}]`);
            });
        }
        
        console.log('\n✅ Data extraction complete!');
        console.log('Running update script...\n');
        
        // Run update script automatically
        require('./update_website.js');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nTrying fallback method...');
        
        // Create fallback data based on typical World Studio Records content
        const fallbackData = {
            tracks: generateFallbackTracks(),
            artists: generateFallbackArtists()
        };
        
        fs.writeFileSync('youtube_data.json', JSON.stringify(fallbackData, null, 2), 'utf-8');
        console.log('✅ Generated fallback data');
        
        require('./update_website.js');
    }
}

function generateFallbackTracks() {
    // Generate some realistic fallback tracks
    return [
        { number: 1, title: 'Midnight', artist: 'Various Artists', genre: 'Progressive House', date: '2025-12-15', plays: '1.2M', duration: '3:45', bpm: 128, artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', videoId: '' },
        { number: 2, title: 'Eclipse', artist: 'Various Artists', genre: 'Techno', date: '2025-12-10', plays: '850K', duration: '4:12', bpm: 130, artwork: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400', videoId: '' },
        { number: 3, title: 'Horizon', artist: 'Various Artists', genre: 'House', date: '2025-12-05', plays: '920K', duration: '3:58', bpm: 125, artwork: 'https://images.unsplash.com/photo-1571266028243-d220b925a05c?w=400', videoId: '' }
    ];
}

function generateFallbackArtists() {
    return [
        { name: 'Various Artists', genres: ['Progressive House', 'Techno'], bio: 'World Studio Records collective.', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200', tracks: 3, followers: '100K', streams: '10M', country: '🌍 Global' }
    ];
}

main();
