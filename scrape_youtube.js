// Script to fetch YouTube channel data using YouTube Data API
// Run: node scrape_youtube.js

const https = require('https');
const fs = require('fs');

// You need to get a YouTube Data API key from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const API_KEY = 'YOUR_YOUTUBE_API_KEY_HERE'; // Replace with your API key
const CHANNEL_ID = 'UCw8V5xM4HhZ4l5c5DqPsZmg'; // World Studio Records channel ID

function getChannelVideos() {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=50&type=video`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function getVideoDetails(videoIds) {
    const idsString = videoIds.join(',');
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${idsString}&part=snippet,contentDetails,statistics`;
    
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

function extractArtistAndTitle(videoTitle) {
    // Common patterns in music video titles
    const patterns = [
        /^(.+?)\s*[-–—]\s*(.+?)(?:\s*\[.*?\]|\s*\(.*?\))?$/,  // Artist - Title
        /^(.+?)\s*:\s*(.+?)$/,  // Artist : Title
    ];
    
    for (const pattern of patterns) {
        const match = videoTitle.match(pattern);
        if (match) {
            let artist = match[1].trim();
            let title = match[2].trim();
            
            // Remove common suffixes
            title = title.replace(/\s*\[.*?\]$/, '').replace(/\s*\(.*?\)$/, '');
            
            return { artist, title };
        }
    }
    
    // If no pattern matches
    return { artist: 'World Studio Records', title: videoTitle };
}

function guessGenre(title) {
    const titleLower = title.toLowerCase();
    
    const genreKeywords = {
        'Progressive House': ['progressive', 'prog house', 'melodic'],
        'Techno': ['techno', 'tech house'],
        'Trance': ['trance', 'uplifting', 'psy'],
        'House': ['house', 'deep house'],
        'Future Bass': ['future bass', 'future'],
        'Dubstep': ['dubstep', 'bass'],
        'Drum & Bass': ['drum and bass', 'dnb', 'd&b'],
        'Synthwave': ['synthwave', 'retro'],
        'Ambient': ['ambient', 'chill'],
    };
    
    for (const [genre, keywords] of Object.entries(genreKeywords)) {
        if (keywords.some(keyword => titleLower.includes(keyword))) {
            return genre;
        }
    }
    
    return 'Electronic';
}

function parseDuration(duration) {
    // PT1M30S -> 1:30
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function main() {
    console.log('Fetching World Studio Records YouTube data...\n');
    
    if (API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
        console.log('ERROR: Please set your YouTube API key in the script.');
        console.log('Get one from: https://console.cloud.google.com/apis/credentials');
        process.exit(1);
    }
    
    try {
        // Get channel videos
        const searchData = await getChannelVideos();
        
        if (!searchData.items || searchData.items.length === 0) {
            console.log('No videos found.');
            return;
        }
        
        console.log(`Found ${searchData.items.length} videos\n`);
        
        // Get video IDs
        const videoIds = searchData.items
            .filter(item => item.id.kind === 'youtube#video')
            .map(item => item.id.videoId);
        
        // Get detailed video information
        const videoDetails = await getVideoDetails(videoIds);
        
        const tracks = [];
        const artistsDict = {};
        
        videoDetails.items.forEach((video, index) => {
            const { artist, title } = extractArtistAndTitle(video.snippet.title);
            const genre = guessGenre(video.snippet.title);
            
            const viewCount = parseInt(video.statistics.viewCount || 0);
            let plays;
            if (viewCount >= 1000000) {
                plays = `${(viewCount / 1000000).toFixed(1)}M`;
            } else if (viewCount >= 1000) {
                plays = `${(viewCount / 1000).toFixed(1)}K`;
            } else {
                plays = viewCount.toString();
            }
            
            const track = {
                number: index + 1,
                title: title,
                artist: artist,
                genre: genre,
                date: formatDate(video.snippet.publishedAt),
                plays: plays,
                duration: parseDuration(video.contentDetails.duration),
                bpm: 128,
                artwork: video.snippet.thumbnails.high.url,
                videoId: video.id
            };
            
            tracks.push(track);
            
            // Aggregate artist data
            if (!artistsDict[artist]) {
                artistsDict[artist] = {
                    name: artist,
                    tracks: 0,
                    genres: new Set(),
                    totalViews: 0,
                    thumbnails: []
                };
            }
            
            artistsDict[artist].tracks++;
            artistsDict[artist].genres.add(genre);
            artistsDict[artist].totalViews += viewCount;
            artistsDict[artist].thumbnails.push(video.snippet.thumbnails.high.url);
        });
        
        // Convert artists to array
        const artists = Object.values(artistsDict).map(artistData => {
            const totalViews = artistData.totalViews;
            const followers = totalViews >= 1000000 
                ? `${Math.floor(totalViews / 100000)}K`
                : `${Math.floor(totalViews / 1000)}K`;
            const streams = totalViews >= 1000000 
                ? `${Math.floor(totalViews / 100000)}M`
                : `${Math.floor(totalViews / 10000)}M`;
            
            return {
                name: artistData.name,
                genres: Array.from(artistData.genres).slice(0, 2),
                bio: `Electronic music producer signed to World Studio Records.`,
                image: artistData.thumbnails[0] || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
                avatar: artistData.thumbnails[0] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
                tracks: artistData.tracks,
                followers: followers,
                streams: streams,
                country: '🌍 Global'
            };
        });
        
        const data = { tracks, artists };
        
        // Save to JSON
        fs.writeFileSync('youtube_data.json', JSON.stringify(data, null, 2), 'utf-8');
        
        console.log(`Data saved to youtube_data.json`);
        console.log(`Tracks: ${tracks.length}`);
        console.log(`Artists: ${artists.length}\n`);
        
        // Print sample
        if (tracks.length > 0) {
            console.log('Sample tracks:');
            tracks.slice(0, 5).forEach(track => {
                console.log(`  - ${track.artist} - ${track.title} (${track.genre})`);
            });
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
