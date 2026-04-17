const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

// 1. Ensure Equipe 2 on 20/04 has ONLY the 3 specified assets
const equipe2_2004_tags = ['RNAT1-SD6-06', 'RNAY-SD6-05', 'RNAY-SD6-04'];

data.forEach(asset => {
    // If it's one of the 3, force it to Equipe 2 on 20/04
    if (equipe2_2004_tags.includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    } 
    // If it WAS Equipe 2 on 20/04 but isn't one of the 3, move it
    else if (asset.date === '2026-04-20' && asset.teamId === 'EQUIPE_02') {
        asset.date = '2026-04-21'; // Move to next day or appropriate fallback
        asset.teamId = 'EQUIPE_04'; // Move to another team
        asset.leader = 'DEIVD';
    }

    // 2. Equipe 1 on 20/04
    if (['RNAT1-SD5-01', 'RNAT1-SB5-01'].includes(asset.tag)) {
        asset.date = '2026-04-20';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }

    // 3. Dia 22/04
    if (asset.tag === 'RNAT1-DI5-01') {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_02';
        asset.leader = 'VAGNER';
    }
    if (['RNAT1-TC5-A', 'RNAT1-TC5-B', 'RNAT1-TC5-V', 'RNAT1-PR5-A', 'RNAT1-PR5-B', 'RNAT1-PR5-V'].includes(asset.tag)) {
        asset.date = '2026-04-22';
        asset.teamId = 'EQUIPE_01';
        asset.leader = 'WANDERSON';
    }
});

// Re-sort and re-index
data.sort((a, b) => a.date.localeCompare(b.date));
data.forEach((asset, index) => {
    asset.displayIndex = index + 1;
});

const newContent = content.replace(
    /export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = \[[\s\S]*?\];/,
    `export const MASTER_ASSETS_DATA: MasterAssetEntry[] = ${JSON.stringify(data, null, 2)};`
);

fs.writeFileSync(path, newContent);
console.log('MasterData updated successfully.');
console.log('Verification:');
const finalEquipe2_2004 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_02');
console.log(`Equipe 2 em 20/04: ${finalEquipe2_2004.length} ativos`);
finalEquipe2_2004.forEach(a => console.log(`- ${a.tag}`));
