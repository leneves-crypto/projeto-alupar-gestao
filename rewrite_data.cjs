const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

// DEFINIÇÕES OBRIGATÓRIAS
const EQUIPE_2_20_04 = ['RNAT1-SD6-06', 'RNAY-SD6-05', 'RNAY-SD6-04'];
const EQUIPE_1_20_04 = ['RNAT1-SD5-01', 'RNAT1-SB5-01'];
const EQUIPE_2_22_04 = ['RNAT1-DI5-01'];
const EQUIPE_1_22_04 = ['RNAT1-TC5-A', 'RNAT1-TC5-B', 'RNAT1-TC5-V', 'RNAT1-PR5-A', 'RNAT1-PR5-B', 'RNAT1-PR5-V'];

data.forEach(asset => {
    // EQUIPE 2 - DIA 20/04 (APENAS ESTES 3)
    if (EQUIPE_2_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    } 
    // EQUIPE 1 - DIA 20/04 (APENAS ESTES 2)
    else if (EQUIPE_1_20_04.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }
    // EQUIPE 2 - DIA 22/04 (DISJUNTOR)
    else if (EQUIPE_2_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    }
    // EQUIPE 1 - DIA 22/04 (TCs e PRs)
    else if (EQUIPE_1_22_04.includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }
    // LIMPEZA: Se algum ativo estiver no dia 20/04 e NÃO for um dos permitidos, move para outro dia
    else if (asset.date === '2026-04-20' && (asset.teamId === 'EQUIPE_01' || asset.teamId === 'EQUIPE_02')) {
        // RNAY-SD6-03 e outros devem sair do dia 20 se estavam lá
        asset.date = '2026-04-21'; 
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
console.log('MasterData REESCRITO com sucesso.');

// Validação rigorosa
const finalE2_20 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_02');
const finalE1_20 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_01');
const finalE2_22 = data.filter(a => a.date === '2026-04-22' && a.teamId === 'EQUIPE_02');
const finalE1_22 = data.filter(a => a.date === '2026-04-22' && a.teamId === 'EQUIPE_01');

console.log(`\n--- VALIDAÇÃO DIA 20/04 ---`);
console.log(`Equipe 2 (Vagner): ${finalE2_20.length} ativos (Esperado: 3)`);
finalE2_20.forEach(a => console.log(`  - ${a.tag}`));
console.log(`Equipe 1 (Wanderson): ${finalE1_20.length} ativos (Esperado: 2)`);
finalE1_20.forEach(a => console.log(`  - ${a.tag}`));

console.log(`\n--- VALIDAÇÃO DIA 22/04 ---`);
console.log(`Equipe 2 (Vagner): ${finalE2_22.length} ativos (Esperado: 1)`);
finalE2_22.forEach(a => console.log(`  - ${a.tag}`));
console.log(`Equipe 1 (Wanderson): ${finalE1_22.length} ativos (Esperado: 6)`);
finalE1_22.forEach(a => console.log(`  - ${a.tag}`));

const sd603 = data.find(a => a.tag === 'RNAY-SD6-03');
console.log(`\nStatus RNAY-SD6-03: Data=${sd603.date}, Equipe=${sd603.teamId}`);
