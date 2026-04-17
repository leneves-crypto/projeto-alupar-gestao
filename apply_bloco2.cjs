const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

const bloco2 = [
  { id: 'RNS-MG-BARRA1', equipe: '1', data: '2026-04-29', lider: 'Wanderson', tipo: 'BARRAMENTO' },
  { id: 'RNS-MG-BARRA2', equipe: '1', data: '2026-04-29', lider: 'Wanderson', tipo: 'BARRAMENTO' },
  { id: 'RNS-MG-INFRA', equipe: '1', data: '2026-04-29', lider: 'Wanderson', tipo: 'INFRAESTRUTURA' },
  { id: 'RNCY-TP5-A', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'TP' },
  { id: 'RNCY-TP5-B', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'TP' },
  { id: 'RNCY-TP5-V', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'TP' },
  { id: 'RNCY-PR5-A', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNCY-PR5-B', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNCY-PR5-V', equipe: '5', data: '2026-04-25', lider: 'Felipe/Savio', tipo: 'PARA RAIO' },
  { id: 'RNCY-SY5-04', equipe: '1', data: '2026-04-27', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNCY-SB5-08', equipe: '1', data: '2026-04-27', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNCY-DI5-07', equipe: '1', data: '2026-04-27', lider: 'Wanderson', tipo: 'DISJUNTOR' },
  { id: 'RNDY-SD5-05', equipe: '1', data: '2026-04-28', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNDY-SB5-07', equipe: '1', data: '2026-04-28', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNDY-DI5-09', equipe: '1', data: '2026-04-30', lider: 'Wanderson', tipo: 'DISJUNTOR' },
  { id: 'RNTF1-01', equipe: '3', data: '2026-04-20', lider: 'Jakson', tipo: 'TRANSFORMADOR' },
  { id: 'RNTF2-05', equipe: '3', data: '2026-04-20', lider: 'Jakson', tipo: 'TRANSFORMADOR' },
  { id: 'VETRA-TR5-01', equipe: '3', data: '2026-05-23', lider: 'Jakson', tipo: 'TRANSFORMADOR' }
];

bloco2.forEach(item => {
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
console.log('Bloco 2 aplicado com sucesso.');
