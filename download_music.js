const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🎵 World Studio Records - Music Downloader\n');

// Check if yt-dlp is installed
async function checkYtDlp() {
    try {
        await execPromise('yt-dlp --version');
        console.log('✅ yt-dlp is installed');
        return true;
    } catch (e) {
        console.log('❌ yt-dlp not found');
        console.log('\n📥 Installing yt-dlp...');
        try {
            await execPromise('winget install yt-dlp');
            console.log('✅ yt-dlp installed successfully');
            return true;
        } catch (installError) {
            console.log('\n⚠️  Please install yt-dlp manually:');
            console.log('   1. Download from: https://github.com/yt-dlp/yt-dlp/releases');
            console.log('   2. Or run: winget install yt-dlp');
            return false;
        }
    }
}

// Get video list from YouTube channel
async function getVideoList() {
    console.log('\n📡 Connecting to YouTube channel...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://www.youtube.com/@worldstudiorecords/videos', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('⏳ Loading videos...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Accept cookies if prompted
        try {
            const acceptButton = await page.$('button[aria-label*="Accept"], button[aria-label*="Aceitar"]');
            if (acceptButton) {
                await acceptButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (e) {
            // No cookies prompt
        }

        // Scroll to load videos
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('🔍 Extracting video data...');

        const videos = await page.evaluate(() => {
            const videoElements = document.querySelectorAll('ytd-rich-item-renderer');
            const videos = [];

            videoElements.forEach((element, index) => {
                if (index >= 30) return;

                try {
                    const titleLink = element.querySelector('a#video-title-link');
                    if (!titleLink) return;

                    const title = titleLink.getAttribute('title') || titleLink.textContent?.trim() || '';
                    const videoUrl = titleLink.href || '';
                    const videoId = videoUrl.split('v=')[1]?.split('&')[0] || '';

                    if (!title || !videoId) return;

                    const metaLine = element.querySelector('#metadata-line');
                    let viewsText = '0 views';
                    
                    if (metaLine) {
                        const spans = metaLine.querySelectorAll('span');
                        if (spans.length >= 1) viewsText = spans[0]?.textContent?.trim() || '0 views';
                    }

                    videos.push({
                        title,
                        videoId,
                        videoUrl,
                        viewsText
                    });

                } catch (e) {
                    console.error('Error extracting video:', e);
                }
            });

            return videos;
        });

        console.log(`✅ Found ${videos.length} videos\n`);
        return videos;

    } finally {
        await browser.close();
    }
}

// Download audio from YouTube
async function downloadAudio(videoId, title, index) {
    const musicDir = path.join(__dirname, 'music');
    if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir);
    }

    // Sanitize filename
    const safeTitle = title
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
    
    const filename = `${String(index + 1).padStart(3, '0')}_${safeTitle}.mp3`;
    const filepath = path.join(musicDir, filename);

    // Check if already downloaded
    if (fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping: ${title} (already exists)`);
        return {
            success: true,
            filename,
            filepath: `music/${filename}`
        };
    }

    console.log(`📥 Downloading: ${title}`);

    try {
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${filepath}" "https://www.youtube.com/watch?v=${videoId}"`;
        
        await execPromise(command, { maxBuffer: 1024 * 1024 * 10 });
        
        console.log(`✅ Downloaded: ${filename}`);
        
        return {
            success: true,
            filename,
            filepath: `music/${filename}`
        };
    } catch (error) {
        console.error(`❌ Failed to download: ${title}`);
        console.error(error.message);
        return {
            success: false,
            filename: null,
            filepath: null
        };
    }
}

// Update website data with downloaded files
function updateWebsiteData(videos, downloadResults) {
    const youtubeDataPath = path.join(__dirname, 'youtube_data.json');
    const youtubeData = JSON.parse(fs.readFileSync(youtubeDataPath, 'utf8'));

    // Update tracks with audio file paths
    youtubeData.tracks.forEach((track, index) => {
        if (downloadResults[index] && downloadResults[index].success) {
            track.audioFile = downloadResults[index].filepath;
        }
    });

    fs.writeFileSync(youtubeDataPath, JSON.stringify(youtubeData, null, 2));
    console.log('\n✅ Updated youtube_data.json with audio file paths');

    // Update script.js
    const scriptPath = path.join(__dirname, 'js', 'script.js');
    let scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Replace fullCatalog data
    const catalogStart = scriptContent.indexOf('window.fullCatalog = [');
    const catalogEnd = scriptContent.indexOf('];', catalogStart) + 2;
    
    const newCatalog = `window.fullCatalog = ${JSON.stringify(youtubeData.tracks, null, 4)};`;
    
    scriptContent = scriptContent.substring(0, catalogStart) + newCatalog + scriptContent.substring(catalogEnd);
    
    fs.writeFileSync(scriptPath, scriptContent);
    console.log('✅ Updated js/script.js with audio files');
}

// Main function
async function main() {
    try {
        // Check yt-dlp
        const hasYtDlp = await checkYtDlp();
        if (!hasYtDlp) {
            process.exit(1);
        }

        // Get video list
        const videos = await getVideoList();
        
        if (videos.length === 0) {
            console.log('❌ No videos found');
            process.exit(1);
        }

        console.log('\n🎵 Starting downloads...\n');
        console.log('═'.repeat(60));

        // Download all videos
        const downloadResults = [];
        for (let i = 0; i < Math.min(videos.length, 30); i++) {
            const video = videos[i];
            const result = await downloadAudio(video.videoId, video.title, i);
            downloadResults.push(result);
            console.log('─'.repeat(60));
        }

        const successful = downloadResults.filter(r => r.success).length;
        console.log('\n═'.repeat(60));
        console.log(`\n✅ Download complete: ${successful}/${videos.length} successful`);

        // Update website
        console.log('\n📝 Updating website files...');
        updateWebsiteData(videos, downloadResults);

        console.log('\n🎉 All done! Your website now has local MP3 files.');
        console.log('\n💡 Tip: Run this script again anytime to download new releases.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
