// Script to update website with YouTube data
const fs = require('fs');

// Read the YouTube data
const youtubeData = JSON.parse(fs.readFileSync('youtube_data.json', 'utf-8'));

// Generate JavaScript code for script.js
function generateCatalogData(tracks) {
    return `// Full catalog data (${tracks.length} tracks)
const fullCatalog = ${JSON.stringify(tracks, null, 4)};`;
}

function generateArtistsData(artists) {
    return `// Artists data
const artistsData = ${JSON.stringify(artists, null, 4)};`;
}

// Read script.js
let scriptContent = fs.readFileSync('js/script.js', 'utf-8');

// Replace catalog data
const catalogRegex = /\/\/ Full catalog data[\s\S]*?const fullCatalog = \[[\s\S]*?\];/;
scriptContent = scriptContent.replace(catalogRegex, generateCatalogData(youtubeData.tracks));

// Replace artists data
const artistsRegex = /\/\/ Artists data[\s\S]*?const artistsData = \[[\s\S]*?\];/;
scriptContent = scriptContent.replace(artistsRegex, generateArtistsData(youtubeData.artists));

// Write back to script.js
fs.writeFileSync('js/script.js', scriptContent, 'utf-8');

console.log('✅ Updated js/script.js with real YouTube data');
console.log(`   - ${youtubeData.tracks.length} tracks`);
console.log(`   - ${youtubeData.artists.length} artists`);

// Generate HTML for index.html releases section
function generateReleasesHTML(tracks) {
    const latestTracks = tracks.slice(0, 8);
    
    return latestTracks.map(track => `
                <div class="release-card">
                    <div class="release-cover">
                        <img src="${track.artwork}" alt="${track.title}" loading="lazy">
                        <button class="play-btn" aria-label="Play ${track.title}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="release-info">
                        <h3 class="release-title">${track.title}</h3>
                        <p class="release-artist">${track.artist}</p>
                        <div class="release-meta">
                            <span class="release-genre">${track.genre}</span>
                            <span class="release-plays">${track.plays} plays</span>
                        </div>
                    </div>
                </div>`).join('');
}

// Generate HTML for artists section
function generateArtistsHTML(artists) {
    const featuredArtists = artists.slice(0, 3);
    
    return featuredArtists.map(artist => `
                <div class="artist-card">
                    <div class="artist-avatar">
                        <img src="${artist.avatar}" alt="${artist.name}">
                    </div>
                    <h3 class="artist-name">${artist.name}</h3>
                    <p class="artist-genres">${artist.genres.join(' • ')}</p>
                    <div class="artist-stats">
                        <div class="stat">
                            <strong>${artist.followers}</strong>
                            <span>Followers</span>
                        </div>
                        <div class="stat">
                            <strong>${artist.tracks}</strong>
                            <span>Tracks</span>
                        </div>
                    </div>
                </div>`).join('');
}

console.log('\n📝 HTML snippets generated (manual update required for index.html)');
console.log('\nTo update releases section, replace the release cards with:');
console.log(generateReleasesHTML(youtubeData.tracks));

console.log('\nTo update artists section, replace the artist cards with:');
console.log(generateArtistsHTML(youtubeData.artists));

console.log('\n✨ Done! The website now uses real data from World Studio Records.');
