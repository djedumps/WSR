#!/usr/bin/env node

// Script de validação de dados - garante que os dados estão corretos
const fs = require('fs');

console.log('🔍 Validando dados do site...\n');

let hasErrors = false;

// Ler arquivos
let youtubeData, artistStats, htmlContent;

try {
    youtubeData = JSON.parse(fs.readFileSync('youtube_data.json', 'utf-8'));
    artistStats = JSON.parse(fs.readFileSync('artist_stats.json', 'utf-8'));
    htmlContent = fs.readFileSync('index.html', 'utf-8');
} catch (err) {
    console.error('❌ Erro ao ler arquivos:', err.message);
    process.exit(1);
}

// Validação 1: Verificar se youtube_data.json tem tracks
console.log('✓ Verificando youtube_data.json...');
if (!youtubeData.tracks || youtubeData.tracks.length === 0) {
    console.error('  ❌ Nenhuma track encontrada em youtube_data.json');
    hasErrors = true;
} else {
    console.log(`  ✓ ${youtubeData.tracks.length} tracks encontradas`);
    
    // Verificar se todas têm videoId
    const tracksWithoutVideo = youtubeData.tracks.filter(t => !t.videoId);
    if (tracksWithoutVideo.length > 0) {
        console.error(`  ⚠️  ${tracksWithoutVideo.length} tracks sem videoId`);
    }
    
    // Verificar durações
    const tracksWithDefaultDuration = youtubeData.tracks.filter(t => t.duration === '3:45');
    if (tracksWithDefaultDuration.length > youtubeData.tracks.length * 0.5) {
        console.warn(`  ⚠️  ${tracksWithDefaultDuration.length} tracks com duração padrão (3:45)`);
    }
}

// Validação 2: Calcular total de views e comparar
console.log('\n✓ Verificando cálculo de views...');
let calculatedViews = 0;

youtubeData.tracks.forEach(track => {
    // Se tiver viewsNum, usar direto
    if (track.viewsNum) {
        calculatedViews += track.viewsNum;
    } else {
        // Senão, parsear o campo plays
        let plays = track.plays.toString().toUpperCase().replace(/,/g, '');
        // Não remover o ponto antes do M/K pois é o decimal (ex: 16.0M)
        if (plays.includes('M')) {
            calculatedViews += parseFloat(plays.replace('M', '')) * 1000000;
        } else if (plays.includes('K')) {
            calculatedViews += parseFloat(plays.replace('K', '')) * 1000;
        } else {
            calculatedViews += parseInt(plays) || 0;
        }
    }
});

const savedViews = artistStats.labelStats?.totalStreams || 0;
const viewsDiff = Math.abs(calculatedViews - savedViews);

if (viewsDiff > 1000) {
    console.error(`  ❌ Discrepância nas views: Calculado=${calculatedViews}, Salvo=${savedViews}`);
    hasErrors = true;
} else {
    console.log(`  ✓ Total de views: ${(calculatedViews / 1000000).toFixed(1)}M`);
}

// Validação 3: Verificar artist_stats.json
console.log('\n✓ Verificando artist_stats.json...');
if (!artistStats.labelStats) {
    console.error('  ❌ labelStats não encontrado');
    hasErrors = true;
} else {
    console.log(`  ✓ Label Stats: ${artistStats.labelStats.totalStreamsFormatted}`);
    console.log(`  ✓ Artistas: ${artistStats.labelStats.totalArtists}`);
    console.log(`  ✓ Tracks: ${artistStats.labelStats.totalTracks}`);
}

if (!artistStats.topReleases || artistStats.topReleases.length === 0) {
    console.error('  ❌ topReleases vazio');
    hasErrors = true;
}

if (!artistStats.topArtists || artistStats.topArtists.length === 0) {
    console.error('  ❌ topArtists vazio');
    hasErrors = true;
}

// Validação 4: Verificar index.html
console.log('\n✓ Verificando index.html...');

const streamsMatch = htmlContent.match(/<div class="stat-value">([\d.]+[KMB]?)\+<\/div>\s*<div class="stat-label">Total Streams<\/div>/);
const artistsMatch = htmlContent.match(/<div class="stat-value">([\d.]+)\+<\/div>\s*<div class="stat-label">Signed Artists<\/div>/);
const releasesMatch = htmlContent.match(/<div class="stat-value">([\d.]+[KMB]?)\+<\/div>\s*<div class="stat-label">Releases<\/div>/);

if (streamsMatch) {
    const htmlStreams = streamsMatch[1];
    const expectedStreams = artistStats.labelStats.totalStreamsFormatted;
    if (htmlStreams !== expectedStreams) {
        console.error(`  ❌ Streams no HTML (${htmlStreams}) diferente do esperado (${expectedStreams})`);
        hasErrors = true;
    } else {
        console.log(`  ✓ Streams no HTML: ${htmlStreams}`);
    }
}

if (artistsMatch) {
    const htmlArtists = artistsMatch[1];
    const expectedArtists = artistStats.labelStats.totalArtists.toString();
    if (htmlArtists !== expectedArtists) {
        console.error(`  ❌ Artistas no HTML (${htmlArtists}) diferente do esperado (${expectedArtists})`);
        hasErrors = true;
    } else {
        console.log(`  ✓ Artistas no HTML: ${htmlArtists}`);
    }
}

if (releasesMatch) {
    const htmlReleases = releasesMatch[1];
    const expectedReleases = artistStats.labelStats.totalTracks.toString();
    if (htmlReleases !== expectedReleases) {
        console.error(`  ❌ Releases no HTML (${htmlReleases}) diferente do esperado (${expectedReleases})`);
        hasErrors = true;
    } else {
        console.log(`  ✓ Releases no HTML: ${htmlReleases}`);
    }
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ VALIDAÇÃO FALHOU - Existem erros nos dados');
    console.log('');
    console.log('Para corrigir, execute:');
    console.log('  npm run update');
    console.log('  ou');
    console.log('  node get_real_youtube_data.js');
    console.log('='.repeat(50));
    process.exit(1);
} else {
    console.log('✅ VALIDAÇÃO OK - Todos os dados estão corretos!');
    console.log('');
    console.log('📊 Resumo:');
    console.log(`  • Total Streams: ${artistStats.labelStats.totalStreamsFormatted}`);
    console.log(`  • Artistas: ${artistStats.labelStats.totalArtists}`);
    console.log(`  • Releases: ${artistStats.labelStats.totalTracks}`);
    console.log(`  • Top Artist: ${artistStats.topArtists[0]?.name} (${artistStats.topArtists[0]?.totalViewsFormatted})`);
    console.log('='.repeat(50));
}
