// Script para detectar BPM preciso através de análise de áudio real
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const dataPath = path.join(__dirname, 'youtube_data.json');
const tempDir = path.join(__dirname, 'temp_audio');

// Criar diretório temporário
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let updated = 0;
let failed = 0;
const results = [];

// Verificar dependências
async function checkDependencies() {
    console.log('🔍 Verificando dependências...\n');
    
    const dependencies = {
        'yt-dlp': false,
        'ffmpeg': false,
        'sox': false
    };
    
    // Verificar yt-dlp
    try {
        await execPromise('yt-dlp --version');
        dependencies['yt-dlp'] = true;
        console.log('✅ yt-dlp encontrado');
    } catch {
        console.log('❌ yt-dlp não encontrado');
    }
    
    // Verificar ffmpeg
    try {
        await execPromise('ffmpeg -version');
        dependencies['ffmpeg'] = true;
        console.log('✅ ffmpeg encontrado');
    } catch {
        console.log('❌ ffmpeg não encontrado');
    }
    
    // Verificar sox (com bpm detector)
    try {
        await execPromise('sox --version');
        dependencies['sox'] = true;
        console.log('✅ sox encontrado');
    } catch {
        console.log('❌ sox não encontrado');
    }
    
    console.log('');
    return dependencies;
}

// Instalar yt-dlp e ffmpeg se necessário
async function installDependencies() {
    console.log('📦 Instalando dependências...\n');
    
    try {
        // Instalar yt-dlp via npm
        console.log('Instalando yt-dlp...');
        await execPromise('npm install -g yt-dlp');
        console.log('✅ yt-dlp instalado\n');
    } catch (error) {
        console.log('⚠️  Erro ao instalar yt-dlp:', error.message);
        console.log('Instale manualmente: https://github.com/yt-dlp/yt-dlp/releases\n');
    }
    
    console.log('📝 Para ffmpeg e sox, instale manualmente:');
    console.log('   ffmpeg: https://ffmpeg.org/download.html');
    console.log('   sox: http://sox.sourceforge.net/\n');
}

// Download de áudio do YouTube
async function downloadAudio(videoId, outputPath) {
    return new Promise((resolve, reject) => {
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(outputPath);
            }
        });
    });
}

// Analisar BPM usando Sox
async function analyzeBPMWithSox(audioPath) {
    try {
        const { stdout } = await execPromise(`sox "${audioPath}" -t raw -r 44100 -e float -c 1 - | sox -t raw -r 44100 -e float -c 1 - -n stat 2>&1`);
        
        // Sox não tem detector de BPM direto, vamos usar outro método
        return null;
    } catch (error) {
        return null;
    }
}

// Analisar BPM usando análise manual de picos
async function analyzeBPMManual(audioPath) {
    return new Promise((resolve, reject) => {
        // Usar ffmpeg para extrair informações de áudio
        const command = `ffmpeg -i "${audioPath}" -af "atempo=1.0" -f null - 2>&1`;
        
        exec(command, (error, stdout, stderr) => {
            // Tentar extrair BPM de metadados
            const output = stderr || stdout;
            const bpmMatch = output.match(/BPM[:\s]*(\d{2,3})/i);
            
            if (bpmMatch && bpmMatch[1]) {
                const bpm = parseInt(bpmMatch[1]);
                if (bpm >= 60 && bpm <= 200) {
                    resolve(bpm);
                    return;
                }
            }
            
            resolve(null);
        });
    });
}

// Método alternativo: usar API do vocalremover.org (scraping)
async function getBPMFromVocalRemover(audioPath) {
    // Esta função requer upload do arquivo para vocalremover.org
    // Implementação complexa, vamos usar método local
    return null;
}

// Processar cada track
async function processTrack(track, index, dependencies) {
    const cleanTitle = track.title.replace(/[^a-zA-Z0-9]/g, '_');
    const audioPath = path.join(tempDir, `${track.videoId}_${cleanTitle}.mp3`);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${index + 1}/${data.tracks.length}] ${track.title}`);
    console.log(`   🎵 Artista: ${track.artist}`);
    console.log(`   🎯 BPM atual: ${track.bpm}`);
    console.log(`   🔗 YouTube: ${track.youtubeUrl}`);
    
    try {
        // 1. Download do áudio
        if (dependencies['yt-dlp']) {
            console.log('   📥 Fazendo download do áudio...');
            await downloadAudio(track.videoId, audioPath);
            console.log('   ✅ Download completo');
            
            // 2. Analisar BPM
            console.log('   🔍 Analisando BPM...');
            
            let detectedBPM = null;
            
            // Método 1: Metadados do arquivo
            detectedBPM = await analyzeBPMManual(audioPath);
            
            if (detectedBPM) {
                const oldBpm = track.bpm;
                track.bpm = detectedBPM;
                console.log(`   ✅ BPM DETECTADO: ${oldBpm} → ${detectedBPM}`);
                updated++;
                results.push({
                    track: track.title,
                    artist: track.artist,
                    oldBpm: oldBpm,
                    newBpm: detectedBPM,
                    method: 'Audio Analysis',
                    status: 'success'
                });
            } else {
                console.log(`   ⚠️  BPM não detectado automaticamente (mantém ${track.bpm})`);
                failed++;
                results.push({
                    track: track.title,
                    artist: track.artist,
                    bpm: track.bpm,
                    status: 'not_detected'
                });
            }
            
            // Limpar arquivo temporário
            if (fs.existsSync(audioPath)) {
                fs.unlinkSync(audioPath);
            }
        } else {
            console.log('   ❌ yt-dlp não disponível, pulando...');
            failed++;
        }
        
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        failed++;
        results.push({
            track: track.title,
            artist: track.artist,
            error: error.message,
            status: 'error'
        });
    }
}

// Python script para análise de BPM usando librosa
const pythonBPMScript = `
import sys
import json
import librosa
import numpy as np

def detect_bpm(audio_path):
    try:
        # Carregar áudio
        y, sr = librosa.load(audio_path)
        
        # Detectar tempo (BPM)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Retornar BPM arredondado
        bpm = int(round(tempo))
        
        return bpm
    except Exception as e:
        return None

if __name__ == "__main__":
    audio_path = sys.argv[1]
    bpm = detect_bpm(audio_path)
    
    if bpm:
        print(json.dumps({"bpm": bpm, "success": True}))
    else:
        print(json.dumps({"success": False}))
`;

// Criar script Python
fs.writeFileSync(path.join(__dirname, 'detect_bpm.py'), pythonBPMScript);

// Função para detectar BPM usando Python + librosa
async function detectBPMWithPython(audioPath) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'detect_bpm.py');
        const command = `python "${pythonScript}" "${audioPath}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                resolve(null);
                return;
            }
            
            try {
                const result = JSON.parse(stdout);
                if (result.success && result.bpm >= 60 && result.bpm <= 200) {
                    resolve(result.bpm);
                } else {
                    resolve(null);
                }
            } catch {
                resolve(null);
            }
        });
    });
}

// Função principal melhorada
async function processTrackImproved(track, index) {
    const cleanTitle = track.title.replace(/[^a-zA-Z0-9]/g, '_');
    const audioPath = path.join(tempDir, `${track.videoId}_${cleanTitle}.mp3`);
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`[${index + 1}/${data.tracks.length}] ${track.title}`);
    console.log(`   🎵 Artista: ${track.artist}`);
    console.log(`   🎯 BPM atual: ${track.bpm}`);
    console.log(`   🔗 YouTube: ${track.youtubeUrl}`);
    
    try {
        // 1. Download do áudio
        console.log('   📥 Fazendo download do áudio...');
        await downloadAudio(track.videoId, audioPath);
        console.log('   ✅ Download completo');
        
        // 2. Tentar análise com Python + librosa (mais preciso)
        console.log('   🔍 Analisando BPM com Python/librosa...');
        let detectedBPM = await detectBPMWithPython(audioPath);
        
        if (detectedBPM) {
            const oldBpm = track.bpm;
            track.bpm = detectedBPM;
            console.log(`   ✅ BPM DETECTADO: ${oldBpm} → ${detectedBPM} (librosa)`);
            updated++;
            results.push({
                track: track.title,
                artist: track.artist,
                oldBpm: oldBpm,
                newBpm: detectedBPM,
                method: 'Python/librosa',
                status: 'success'
            });
        } else {
            console.log(`   ⚠️  BPM não detectado (mantém ${track.bpm})`);
            failed++;
            results.push({
                track: track.title,
                artist: track.artist,
                bpm: track.bpm,
                status: 'not_detected'
            });
        }
        
        // Limpar arquivo temporário
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
        
    } catch (error) {
        console.log(`   ❌ ERRO: ${error.message}`);
        failed++;
        results.push({
            track: track.title,
            artist: track.artist,
            error: error.message,
            status: 'error'
        });
    }
}

// Main
async function main() {
    console.log('\n' + '='.repeat(70));
    console.log('🎵 DETECÇÃO PRECISA DE BPM - ANÁLISE DE ÁUDIO');
    console.log('='.repeat(70));
    console.log('\n📊 Total de músicas: ' + data.tracks.length);
    console.log('⏱️  Tempo estimado: ~' + Math.ceil(data.tracks.length * 1.5) + ' minutos\n');
    
    // Verificar dependências
    const deps = await checkDependencies();
    
    if (!deps['yt-dlp']) {
        console.log('\n⚠️  AVISO: yt-dlp não encontrado!');
        console.log('Instalando dependências...\n');
        await installDependencies();
    }
    
    console.log('\n🔧 Método de detecção:');
    console.log('   1. Download do áudio do YouTube');
    console.log('   2. Análise com Python + librosa (detecção de batidas)');
    console.log('   3. Validação de range (60-200 BPM)');
    console.log('\n' + '='.repeat(70));
    
    // Processar tracks
    for (let i = 0; i < data.tracks.length; i++) {
        await processTrackImproved(data.tracks[i], i);
        
        // Pequena pausa entre tracks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Salvar resultados
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `youtube_data_backup_audio_${timestamp}.json`);
    
    const originalData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    fs.writeFileSync(backupPath, JSON.stringify(originalData, null, 2));
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    const reportPath = path.join(__dirname, `bpm_audio_report_${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    
    // Limpar diretório temporário
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✨ CONCLUÍDO!');
    console.log('='.repeat(70));
    console.log(`\n📈 ESTATÍSTICAS:`);
    console.log(`   ✅ Detectados: ${updated}`);
    console.log(`   ❌ Não detectados: ${failed}`);
    console.log(`   📊 Taxa de sucesso: ${((updated / data.tracks.length) * 100).toFixed(1)}%`);
    console.log(`\n💾 ARQUIVOS SALVOS:`);
    console.log(`   📄 Dados atualizados: youtube_data.json`);
    console.log(`   🔙 Backup: ${path.basename(backupPath)}`);
    console.log(`   📊 Relatório: ${path.basename(reportPath)}`);
    console.log('\n' + '='.repeat(70));
    console.log('\n🔄 Recarregue a página do website!\n');
}

// Instalar dependências do Python
console.log('\n📦 INSTALAÇÃO DE DEPENDÊNCIAS:\n');
console.log('Execute os seguintes comandos antes de rodar o script:\n');
console.log('1. Instalar Python (se não tiver): https://www.python.org/downloads/');
console.log('2. Instalar librosa: pip install librosa');
console.log('3. Instalar yt-dlp: pip install yt-dlp');
console.log('4. Instalar ffmpeg: https://ffmpeg.org/download.html\n');
console.log('Depois execute: node extract_precise_bpm.js\n');
console.log('Pressione Ctrl+C para cancelar ou Enter para continuar...\n');

// Aguardar confirmação
process.stdin.once('data', () => {
    main().catch(error => {
        console.error('\n❌ ERRO FATAL:', error);
        process.exit(1);
    });
});
