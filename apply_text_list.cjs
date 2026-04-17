const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

// DEFINIÇÕES OBRIGATÓRIAS (TEXTO PURO DO USUÁRIO)
const E2_20_04 = ['RNAT1-SD6-06', 'RNAY-SD6-05', 'RNAY-SD6-04'];
const E1_20_04 = ['RNAT1-SD5-01', 'RNAT1-SB5-01'];
const E2_22_04 = ['RNAT1-DI5-01'];
const E5_22_04 = ['RNAT1-TC5-A', 'RNAT1-TC5-B', 'RNAT1-TC5-V', 'RNAT1-PR5-A', 'RNAT1-PR5-B', 'RNAT1-PR5-V'];

data.forEach(asset => {
    // [EQUIPE 2 - DIA 20/04]
    if (E2_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    } 
    // [EQUIPE 1 - DIA 20/04]
    else if (E1_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }
    // [DIA 22/04 - EQUIPE 2]
    else if (E2_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    }
    // [DIA 22/04 - EQUIPE 5]
    else if (E5_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_05';
        asset.leader = 'FELIPE/SAVIO';
    }
    // LIMPEZA OBRIGATÓRIA: Se estiver no dia 20/04 e NÃO for um dos permitidos, move para fora
    else if (asset.date === '2026-04-20' && (asset.teamId === 'EQUIPE_01' || asset.teamId === 'EQUIPE_02')) {
        // RNAY-SD6-03 deve sair do dia 20
        asset.date = '2026-05-04'; // Data original/fallback
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    }
});

// Re-sort e re-index
data.sort((a, b) => a.date.localeCompare(b.date));
data.forEach((asset, index) => {
    asset.displayIndex = index + 1;
});

const newContent = content.replace(
    /export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = \[[\s\S]*?\];/,
    `export const MASTER_ASSETS_DATA: MasterAssetEntry[] = ${JSON.stringify(data, null, 2)};`
);

fs.writeFileSync(path, newContent);
console.log('Base de dados atualizada conforme lista de texto puro.');

// Validação final
const finalE2_20 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_02');
const finalE1_20 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_01');
const finalE2_22 = data.filter(a => a.date === '2026-04-22' && a.teamId === 'EQUIPE_02');
const finalE5_22 = data.filter(a => a.date === '2026-04-22' && a.teamId === 'EQUIPE_05');

console.log(`\n--- DIA 20/04 ---`);
console.log(`Equipe 2 (Vagner): ${finalE2_20.length} ativos`);
finalE2_20.forEach(a => console.log(`  - ${a.tag}`));
console.log(`Equipe 1 (Wanderson): ${finalE1_20.length} ativos`);
finalE1_20.forEach(a => console.log(`  - ${a.tag}`));

console.log(`\n--- DIA 22/04 ---`);
console.log(`Equipe 2 (Vagner): ${finalE2_22.length} ativos`);
finalE2_22.forEach(a => console.log(`  - ${a.tag}`));
console.log(`Equipe 5 (Felipe/Savio): ${finalE5_22.length} ativos`);
finalE5_22.forEach(a => console.log(`  - ${a.tag}`));

const sd603 = data.find(a => a.tag === 'RNAY-SD6-03');
console.log(`\nStatus RNAY-SD6-03: Data=${sd603.date}`);
