const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

const bloco1 = [
  { id: 'RNAT1-SD5-01', equipe: '1', data: '2026-04-20', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNAT1-SB5-01', equipe: '1', data: '2026-04-20', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNAT1-SD6-06', equipe: '2', data: '2026-04-20', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNAY-SD6-05', equipe: '2', data: '2026-04-20', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNAY-SD6-04', equipe: '2', data: '2026-04-20', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNAT1-DI5-01', equipe: '2', data: '2026-04-22', lider: 'Vagner', tipo: 'DISJUNTOR' },
  { id: 'RNAT1-TC5-A', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNAT1-TC5-B', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNAT1-TC5-V', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNAT1-PR5-A', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNAT1-PR5-B', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNAT1-PR5-V', equipe: '5', data: '2026-04-22', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNAY-SD6-03', equipe: '2', data: '2026-05-04', lider: 'Vagner', tipo: 'SECCIONADORA' }
];

bloco1.forEach(item => {
    const asset = data.find(a => a.tag === item.id);
    if (asset) {
        asset.date = item.data;
        asset.teamId = `EQUIPE_0${item.equipe}`;
        asset.leader = item.lider.toUpperCase();
        asset.type = item.tipo;
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
console.log('Bloco 1 aplicado com sucesso.');
