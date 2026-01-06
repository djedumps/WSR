const fs = require('fs');

// Read youtube_data.json
const data = JSON.parse(fs.readFileSync('youtube_data.json', 'utf-8'));

// Function to convert plays string to number
function parseViews(viewsStr) {
    if (!viewsStr || viewsStr === 'Brevemente') return 0;
    
    viewsStr = viewsStr.toString().toUpperCase().replace(/,/g, '');
    
    if (viewsStr.includes('M')) {
        return parseFloat(viewsStr.replace('M', '')) * 1000000;
    } else if (viewsStr.includes('K')) {
        return parseFloat(viewsStr.replace('K', '')) * 1000;
    } else {
        return parseInt(viewsStr) || 0;
    }
}

// Function to format views
function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    } else {
        return views.toString();
    }
}

// Function to extract all artists from a track
// Handles collaborations (x, ft., feat., &) and covers
function extractArtists(artistString, trackTitle) {
    const artists = [];
    
    // Check if it's a cover - artist name before "Cover"
    const coverMatch = trackTitle.match(/\(([^)]+)\s+Cover\)/i) || trackTitle.match(/\[([^\]]+)\s+Cover\]/i);
    if (coverMatch) {
        const coverArtist = coverMatch[1].trim();
        artists.push(coverArtist);
        console.log(`   📀 Cover detectado: "${trackTitle}" → Artista: ${coverArtist}`);
        return artists;
    }
    
    // Handle collaborations: split by common separators
    const collaborationPattern = /\s+x\s+|\s+ft\.?\s+|\s+feat\.?\s+|\s+&\s+|\s+,\s+/i;
    
    if (collaborationPattern.test(artistString)) {
        const splitArtists = artistString.split(collaborationPattern).map(a => a.trim());
        artists.push(...splitArtists);
        console.log(`   🤝 Colaboração detectada: "${artistString}" → Artistas: ${splitArtists.join(', ')}`);
    } else {
        // Single artist
        artists.push(artistString.trim());
    }
    
    return artists;
}

// Calculate views per artist (excluding "World Studio Records" as artist)
const artistStats = {};

console.log('\n🎵 Processando tracks e calculando views por artista...\n');

data.tracks.forEach(track => {
    const views = parseViews(track.plays);
    
    // Extract all artists from this track
    const artists = extractArtists(track.artist, track.title);
    
    // Add views to each artist
    artists.forEach(artistName => {
        // Skip if artist is "World Studio Records" - it's the label, not an artist
        if (artistName === 'World Studio Records') {
            return;
        }
        
        if (!artistStats[artistName]) {
            artistStats[artistName] = {
                name: artistName,
                totalViews: 0,
                tracks: [],
                image: track.artwork,
                avatar: track.artwork
            };
        }
        
        artistStats[artistName].totalViews += views;
        artistStats[artistName].tracks.push({
            title: track.title,
            views: views,
            videoId: track.videoId
        });
    });
});

// Sort artists by total views
const sortedArtists = Object.values(artistStats).sort((a, b) => b.totalViews - a.totalViews);

console.log('\n📊 TOP ARTISTS BY TOTAL VIEWS:\n');
sortedArtists.forEach((artist, index) => {
    console.log(`${index + 1}. ${artist.name}`);
    console.log(`   Total Views: ${formatViews(artist.totalViews)}`);
    console.log(`   Tracks: ${artist.tracks.length}`);
    console.log(`   Top Track: ${artist.tracks.sort((a, b) => b.views - a.views)[0].title} (${formatViews(artist.tracks[0].views)})`);
    console.log('');
});

// Get top 8 releases (all tracks sorted by views)
const topReleases = [...data.tracks]
    .map(track => ({
        ...track,
        viewsNum: parseViews(track.plays)
    }))
    .sort((a, b) => b.viewsNum - a.viewsNum)
    .slice(0, 8);

console.log('\n🎵 TOP 8 RELEASES:\n');
topReleases.forEach((track, index) => {
    console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
    console.log(`   Views: ${formatViews(track.viewsNum)}`);
    console.log(`   Video ID: ${track.videoId}`);
    console.log('');
});

// Get top 3 artists for HTML
const top3Artists = sortedArtists.slice(0, 3);

console.log('\n✨ TOP 3 ARTISTS FOR WEBSITE:\n');
top3Artists.forEach((artist, index) => {
    console.log(`${index + 1}. ${artist.name}`);
    console.log(`   Total Views: ${formatViews(artist.totalViews)}`);
    console.log(`   Tracks: ${artist.tracks.length}`);
    console.log(`   Image: ${artist.avatar}`);
    console.log('');
});

// Save updated data
const outputData = {
    topReleases: topReleases.slice(0, 8),
    topArtists: top3Artists,
    allArtists: sortedArtists
};

fs.writeFileSync('artist_stats.json', JSON.stringify(outputData, null, 2));
console.log('✅ Saved to artist_stats.json\n');
