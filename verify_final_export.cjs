const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

// REGRAS FINAIS
const E2_20_04 = ['RNAT1-SD6-06', 'RNAY-SD6-05', 'RNAY-SD6-04'];
const E1_20_04 = ['RNAT1-SD5-01', 'RNAT1-SB5-01'];
const E2_22_04 = ['RNAT1-DI5-01'];
const E5_22_04 = ['RNAT1-TC5-A', 'RNAT1-TC5-B', 'RNAT1-TC5-V', 'RNAT1-PR5-A', 'RNAT1-PR5-B', 'RNAT1-PR5-V'];

data.forEach(asset => {
    // Equipe 2 - 20/04
    if (E2_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    } 
    // Equipe 1 - 20/04
    else if (E1_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }
    // Equipe 2 - 22/04
    else if (E2_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    }
    // Equipe 5 - 22/04
    else if (E5_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_05';
        asset.leader = 'FELIPE/SAVIO';
    }
    // Limpeza dia 20
    else if (asset.date === '2026-04-20' && (asset.teamId === 'EQUIPE_01' || asset.teamId === 'EQUIPE_02')) {
        asset.date = '2026-05-04';
        asset.teamId = 'EQUIPE_04';
        asset.leader = 'DEIVD';
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
console.log('MasterData finalizado com sucesso.');

// Verificação
const finalE2_20 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_02');
console.log(`Equipe 2 em 20/04: ${finalE2_20.length} ativos`);
finalE2_20.forEach(a => console.log(`  - ${a.tag}`));
