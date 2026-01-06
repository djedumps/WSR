// Simplified scraper with debug
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🎵 Debugging YouTube scraper...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('Opening YouTube channel...');
    await page.goto('https://www.youtube.com/@worldstudiorecords/videos', {
        waitUntil: 'networkidle2',
        timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'youtube_debug.png', fullPage: true });
    
    console.log('Getting page content...');
    const content = await page.content();
    fs.writeFileSync('youtube_page.html', content);
    
    console.log('\nTrying different selectors:');
    
    const selectors = [
        'ytd-rich-item-renderer',
        'ytd-grid-video-renderer',
        '#video-title',
        'a#video-title-link',
        '#contents ytd-rich-item-renderer',
        'ytd-two-column-browse-results-renderer'
    ];
    
    for (const selector of selectors) {
        const elements = await page.$$(selector);
        console.log(`  ${selector}: ${elements.length} elements found`);
    }
    
    console.log('\n✅ Debug files saved:');
    console.log('  - youtube_debug.png (screenshot)');
    console.log('  - youtube_page.html (full HTML)');
    
    await browser.close();
})();
