const fs = require('fs');

// Read youtube_data.json
let data;
try {
    data = JSON.parse(fs.readFileSync('youtube_data.json', 'utf-8'));
} catch (err) {
    console.error('❌ Error reading youtube_data.json:', err.message);
    process.exit(1);
}

// Function to convert plays string to number
function parseViews(viewsStr) {
    if (!viewsStr || viewsStr === 'Brevemente') return 0;
    
    viewsStr = viewsStr.toString().toUpperCase().replace(/,/g, '').replace(/\./g, '');
    
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
    if (views >= 1000000000) {
        return (views / 1000000000).toFixed(1) + 'B';
    } else if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    } else {
        return views.toString();
    }
}

console.log('🎵 Calculating statistics from YouTube data...\n');

// Calculate total streams for the label
let totalStreams = 0;
let totalTracks = data.tracks.length;

data.tracks.forEach(track => {
    totalStreams += parseViews(track.plays);
});

console.log('📊 LABEL STATISTICS:');
console.log(`   Total Tracks: ${totalTracks}`);
console.log(`   Total Streams: ${formatViews(totalStreams)} (${totalStreams.toLocaleString()})`);
console.log('');

// Calculate views per artist (sum of views from all their videos)
const artistStats = {};

data.tracks.forEach(track => {
    const artist = track.artist;
    const views = parseViews(track.plays);
    
    // Skip if artist is "World Studio Records" - it's the label, not an artist
    if (artist === 'World Studio Records') {
        return;
    }
    
    if (!artistStats[artist]) {
        artistStats[artist] = {
            name: artist,
            totalViews: 0,
            tracks: [],
            image: track.artwork,
            avatar: track.artwork,
            genre: track.genre
        };
    }
    
    artistStats[artist].totalViews += views;
    artistStats[artist].tracks.push({
        title: track.title,
        views: views,
        viewsFormatted: formatViews(views),
        videoId: track.videoId,
        duration: track.duration
    });
});

// Sort artists by total views
const sortedArtists = Object.values(artistStats).sort((a, b) => b.totalViews - a.totalViews);

// Count unique artists
const uniqueArtists = sortedArtists.length;

console.log('👥 ARTISTS STATISTICS:');
console.log(`   Unique Artists: ${uniqueArtists}`);
console.log('');

console.log('🏆 TOP ARTISTS BY TOTAL VIEWS:\n');
sortedArtists.slice(0, 10).forEach((artist, index) => {
    const topTrack = artist.tracks.sort((a, b) => b.views - a.views)[0];
    console.log(`${index + 1}. ${artist.name}`);
    console.log(`   Total Views: ${formatViews(artist.totalViews)} (${artist.totalViews.toLocaleString()})`);
    console.log(`   Tracks: ${artist.tracks.length}`);
    console.log(`   Top Track: "${topTrack.title}" (${topTrack.viewsFormatted})`);
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

console.log('🎵 TOP 8 RELEASES BY VIEWS:\n');
topReleases.forEach((track, index) => {
    console.log(`${index + 1}. "${track.title}" by ${track.artist}`);
    console.log(`   Views: ${formatViews(track.viewsNum)} (${track.viewsNum.toLocaleString()})`);
    console.log(`   Duration: ${track.duration} | BPM: ${track.bpm} | Genre: ${track.genre}`);
    console.log('');
});

// Get top 3 artists for HTML (with proper stats)
const top3Artists = sortedArtists.slice(0, 3).map(artist => ({
    name: artist.name,
    totalViews: artist.totalViews,
    totalViewsFormatted: formatViews(artist.totalViews),
    tracks: artist.tracks.length,
    image: artist.image,
    avatar: artist.avatar,
    genre: artist.genre,
    topTracks: artist.tracks.sort((a, b) => b.views - a.views).slice(0, 3)
}));

console.log('✨ TOP 3 ARTISTS FOR WEBSITE:\n');
top3Artists.forEach((artist, index) => {
    console.log(`${index + 1}. ${artist.name}`);
    console.log(`   Total Views: ${artist.totalViewsFormatted} (${artist.totalViews.toLocaleString()})`);
    console.log(`   Tracks on Label: ${artist.tracks}`);
    console.log(`   Top Track: "${artist.topTracks[0].title}" (${artist.topTracks[0].viewsFormatted})`);
    console.log('');
});

// Save updated data to artist_stats.json
const outputData = {
    labelStats: {
        totalStreams: totalStreams,
        totalStreamsFormatted: formatViews(totalStreams),
        totalTracks: totalTracks,
        totalArtists: uniqueArtists
    },
    topReleases: topReleases,
    topArtists: top3Artists,
    allArtists: sortedArtists.map(artist => ({
        name: artist.name,
        totalViews: artist.totalViews,
        totalViewsFormatted: formatViews(artist.totalViews),
        tracks: artist.tracks.length,
        image: artist.image,
        avatar: artist.avatar,
        genre: artist.genre
    }))
};

fs.writeFileSync('artist_stats.json', JSON.stringify(outputData, null, 2));
console.log('✅ Statistics saved to artist_stats.json');
console.log('');

// Update index.html stats
console.log('📝 Updating index.html statistics...');

try {
    let htmlContent = fs.readFileSync('index.html', 'utf-8');
    
    // Update label stats in hero section
    htmlContent = htmlContent.replace(
        /<div class="stat-value">[\d.]+[KMB]\+<\/div>\s*<div class="stat-label">Total Streams<\/div>/,
        `<div class="stat-value">${formatViews(totalStreams)}+</div>\n                        <div class="stat-label">Total Streams</div>`
    );
    
    htmlContent = htmlContent.replace(
        /<div class="stat-value">[\d.]+\+<\/div>\s*<div class="stat-label">Signed Artists<\/div>/,
        `<div class="stat-value">${uniqueArtists}+</div>\n                        <div class="stat-label">Signed Artists</div>`
    );
    
    htmlContent = htmlContent.replace(
        /<div class="stat-value">[\d.]+[KMB]?\+<\/div>\s*<div class="stat-label">Releases<\/div>/,
        `<div class="stat-value">${totalTracks}+</div>\n                        <div class="stat-label">Releases</div>`
    );
    
    fs.writeFileSync('index.html', htmlContent, 'utf-8');
    console.log('✅ index.html updated with new statistics');
    
} catch (err) {
    console.error('⚠️  Could not update index.html automatically:', err.message);
    console.log('   Please update manually:');
    console.log(`   - Total Streams: ${formatViews(totalStreams)}+`);
    console.log(`   - Signed Artists: ${uniqueArtists}+`);
    console.log(`   - Releases: ${totalTracks}+`);
}

console.log('\n✅ All statistics calculated and saved!');
console.log('');
console.log('📋 Summary:');
console.log(`   - Label Total Streams: ${formatViews(totalStreams)}`);
console.log(`   - Total Artists: ${uniqueArtists}`);
console.log(`   - Total Releases: ${totalTracks}`);
console.log(`   - Top Artist: ${sortedArtists[0].name} (${formatViews(sortedArtists[0].totalViews)} views)`);
console.log('');
