// Script para buscar informações do canal do YouTube
const puppeteer = require('puppeteer');
const fs = require('fs');

async function getChannelInfo() {
    console.log('🎵 Buscando informações do canal World Studio Records...\n');
    
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Ir para a página do canal
        console.log('📺 Acessando canal...');
        await page.goto('https://www.youtube.com/@worldstudiorecords/about', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Aceitar cookies
        try {
            const acceptButton = await page.$('button[aria-label*="Accept"], button[aria-label*="Aceitar"]');
            if (acceptButton) {
                await acceptButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (e) {}
        
        // Extrair informações do canal
        const channelInfo = await page.evaluate(() => {
            const info = {};
            
            // Tentar pegar subscribers
            const subsElement = document.querySelector('#subscriber-count');
            if (subsElement) {
                info.subscribers = subsElement.textContent.trim();
            }
            
            // Tentar pegar views totais
            const statsElements = document.querySelectorAll('yt-formatted-string');
            statsElements.forEach(el => {
                const text = el.textContent;
                if (text.includes('views')) {
                    info.totalViews = text.trim();
                } else if (text.includes('subscribers')) {
                    info.subscribers = text.replace('subscribers', '').trim();
                } else if (text.includes('videos')) {
                    info.totalVideos = text.replace('videos', '').trim();
                }
            });
            
            return info;
        });
        
        console.log('📊 Informações do Canal:');
        console.log('   Inscritos:', channelInfo.subscribers || 'Não encontrado');
        console.log('   Views Totais:', channelInfo.totalViews || 'Não encontrado');
        console.log('   Total de Vídeos:', channelInfo.totalVideos || 'Não encontrado');
        console.log('');
        
        // Agora ir para a página de vídeos e contar mais
        console.log('🎬 Buscando vídeos do canal...');
        await page.goto('https://www.youtube.com/@worldstudiorecords/videos', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Scroll para carregar mais vídeos
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Contar vídeos visíveis
        const videoCount = await page.evaluate(() => {
            return document.querySelectorAll('ytd-rich-item-renderer').length;
        });
        
        console.log(`📹 Vídeos encontrados na página: ${videoCount}`);
        console.log('');
        
        await browser.close();
        
        return {
            ...channelInfo,
            videosScraped: videoCount
        };
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (browser) await browser.close();
        return null;
    }
}

// Executar
getChannelInfo().then(info => {
    if (info) {
        console.log('✅ Informações coletadas com sucesso!\n');
        
        // Ler youtube_data.json atual
        const data = JSON.parse(fs.readFileSync('youtube_data.json', 'utf-8'));
        
        // Adicionar info do canal
        data.channelInfo = info;
        
        // Salvar
        fs.writeFileSync('youtube_data.json', JSON.stringify(data, null, 2));
        console.log('💾 Dados salvos em youtube_data.json');
    }
});
