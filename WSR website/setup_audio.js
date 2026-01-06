const fs = require('fs');
const path = require('path');

console.log('🎵 World Studio Records - Audio File Generator\n');
console.log('⚠️  Note: Due to YouTube\'s terms of service, we cannot automatically');
console.log('   download audio files. Instead, this script will:');
console.log('   1. Generate placeholder audio paths');
console.log('   2. Update website to stream from YouTube directly\n');

// Read youtube_data.json
const youtubeDataPath = path.join(__dirname, 'youtube_data.json');
const youtubeData = JSON.parse(fs.readFileSync(youtubeDataPath, 'utf8'));

console.log('📝 Updating website data...\n');

// Update tracks with YouTube URLs for web playback
youtubeData.tracks.forEach((track, index) => {
    if (track.videoId) {
        // Store both YouTube URL and potential local file path
        track.youtubeUrl = `https://www.youtube.com/watch?v=${track.videoId}`;
        track.audioFile = `music/${String(index + 1).padStart(3, '0')}_${track.title.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 50)}.mp3`;
    }
});

// Save updated data
fs.writeFileSync(youtubeDataPath, JSON.stringify(youtubeData, null, 2));
console.log('✅ Updated youtube_data.json');

// Update script.js with new catalog
const scriptPath = path.join(__dirname, 'js', 'script.js');
let scriptContent = fs.readFileSync(scriptPath, 'utf8');

const catalogStart = scriptContent.indexOf('window.fullCatalog = [');
const catalogEnd = scriptContent.indexOf('];', catalogStart) + 2;

const newCatalog = `window.fullCatalog = ${JSON.stringify(youtubeData.tracks, null, 4)};`;

scriptContent = scriptContent.substring(0, catalogStart) + newCatalog + scriptContent.substring(catalogEnd);

fs.writeFileSync(scriptPath, scriptContent);
console.log('✅ Updated js/script.js');

console.log('\n🎉 Website updated successfully!');
console.log('\n📌 Manual Download Instructions:');
console.log('   To add local audio files:');
console.log('   1. Download music from YouTube manually');
console.log('   2. Convert to MP3 (use online converter or VLC)');
console.log('   3. Save to /music/ folder with names like:');
console.log('      - 001_CAHAYA.mp3');
console.log('      - 002_Never_Be_The_Same.mp3');
console.log('   4. Files will play automatically!\n');

// Create music directory if it doesn't exist
const musicDir = path.join(__dirname, 'music');
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir);
    console.log('✅ Created /music/ folder');
}

// Create a sample README in music folder
const readmePath = path.join(musicDir, 'README.txt');
const readmeContent = `World Studio Records - Music Folder

Place your MP3 files here with these names:

${youtubeData.tracks.slice(0, 10).map((t, i) => 
    `${String(i + 1).padStart(3, '0')}_${t.title.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 50)}.mp3`
).join('\n')}

... and more

YouTube URLs for reference:
${youtubeData.tracks.slice(0, 5).map((t, i) => 
    `${i + 1}. ${t.title}\n   https://www.youtube.com/watch?v=${t.videoId}`
).join('\n\n')}
`;

fs.writeFileSync(readmePath, readmeContent);
console.log('✅ Created music/README.txt with file naming guide\n');
