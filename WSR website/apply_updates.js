const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'youtube_data_updated.json';
const TARGET_FILE = 'youtube_data.json';
const BACKUP_DIR = 'backups';

console.log('🔄 APLICANDO ATUALIZAÇÕES...\n');

// Verificar se o arquivo de atualizações existe
if (!fs.existsSync(SOURCE_FILE)) {
    console.error('❌ Erro: youtube_data_updated.json não encontrado!');
    console.log('💡 Primeiro exporta os dados da interface update_data_interface.html');
    process.exit(1);
}

// Criar diretório de backups se não existir
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
    console.log('📁 Diretório de backups criado');
}

try {
    // Validar JSON atualizado
    const updatedData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
    console.log(`✅ JSON válido: ${updatedData.tracks.length} músicas encontradas`);

    // Criar backup do arquivo atual
    if (fs.existsSync(TARGET_FILE)) {
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupFile = path.join(BACKUP_DIR, `youtube_data_backup_${timestamp}.json`);
        fs.copyFileSync(TARGET_FILE, backupFile);
        console.log(`💾 Backup criado: ${backupFile}`);
    }

    // Aplicar atualizações
    fs.copyFileSync(SOURCE_FILE, TARGET_FILE);
    console.log(`✅ Dados atualizados em ${TARGET_FILE}`);

    // Verificar integridade
    const newData = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
    console.log(`\n📊 VERIFICAÇÃO:`);
    console.log(`   - Total de músicas: ${newData.tracks.length}`);
    console.log(`   - Total de artistas: ${new Set(newData.tracks.map(t => t.artist)).size}`);
    
    // Contar músicas com dados atualizados
    const withBPM = newData.tracks.filter(t => t.bpm && t.bpm !== 0).length;
    const withGenre = newData.tracks.filter(t => t.genre && t.genre !== 'Electronic').length;
    console.log(`   - Com BPM definido: ${withBPM}`);
    console.log(`   - Com gênero específico: ${withGenre}`);

    console.log('\n✨ ATUALIZAÇÕES APLICADAS COM SUCESSO!');
    console.log('🌐 Recarrega o website para ver as alterações');

    // Opcional: deletar o arquivo temporário
    console.log('\n❓ Apagar youtube_data_updated.json? (já foi aplicado)');
    console.log('   Para manter histórico, move-o para a pasta backups');
    
    const tempBackup = path.join(BACKUP_DIR, `youtube_data_updated_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
    fs.copyFileSync(SOURCE_FILE, tempBackup);
    fs.unlinkSync(SOURCE_FILE);
    console.log(`✅ Arquivo temporário movido para: ${tempBackup}`);

} catch (error) {
    console.error('❌ Erro ao aplicar atualizações:', error.message);
    process.exit(1);
}
