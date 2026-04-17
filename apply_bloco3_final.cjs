const fs = require('fs');
const path = 'src/data/masterData.ts';
const content = fs.readFileSync(path, 'utf8');

const match = content.match(/export const MASTER_ASSETS_DATA: MasterAssetEntry\[\] = (\[[\s\S]*?\]);/);
if (!match) {
    console.error('Could not find MASTER_ASSETS_DATA');
    process.exit(1);
}

let data = eval(match[1]);

const bloco3 = [
  { id: 'RNAT2-SD5-02', equipe: '1', data: '2026-04-23', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNAT2-SB5-02', equipe: '1', data: '2026-04-23', lider: 'Wanderson', tipo: 'SECCIONADORA' },
  { id: 'RNAT2-DI5-02', equipe: '1', data: '2026-04-24', lider: 'Wanderson', tipo: 'DISJUNTOR' },
  { id: 'RNAT2-TC5-A', equipe: '5', data: '2026-04-24', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNAT2-TC5-B', equipe: '5', data: '2026-04-24', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNAT2-TC5-V', equipe: '5', data: '2026-04-24', lider: 'Felipe/Savio', tipo: 'TC' },
  { id: 'RNBY-SD6-07', equipe: '2', data: '2026-05-06', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNBY-SD6-08', equipe: '2', data: '2026-05-06', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNBX-SD6-09', equipe: '2', data: '2026-05-07', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNBY-SB5-05', equipe: '2', data: '2026-05-07', lider: 'Vagner', tipo: 'SECCIONADORA' },
  { id: 'RNBY-DI5-05', equipe: '2', data: '2026-05-07', lider: 'Vagner', tipo: 'DISJUNTOR' },
  { id: 'RNAY-UPCD1', equipe: '4', data: '2026-05-04', lider: 'Deivd', tipo: 'PROTEÇÃO' },
  { id: 'RNBY-UPCD1', equipe: '4', data: '2026-05-06', lider: 'Deivd', tipo: 'PROTEÇÃO' },
  { id: 'RNBX-UCD1', equipe: '4', data: '2026-05-07', lider: 'Deivd', tipo: 'PROTEÇÃO' },
  { id: 'RNS-LMLT5-01', equipe: '4', data: '2026-04-30', lider: 'Deivd', tipo: 'PMO 21' },
  { id: 'RNTF2-03', equipe: '3', data: '2026-04-20', lider: 'Jakson', tipo: 'TRANSFORMADOR' },
  { id: 'RNTF2-01', equipe: '3', data: '2026-04-20', lider: 'Jakson', tipo: 'TRANSFORMADOR' }
];

bloco3.forEach(item => {
    let asset = data.find(a => a.tag === item.id);
    if (asset) {
        asset.date = item.data;
        asset.teamId = `EQUIPE_0${item.equipe}`;
        asset.leader = item.lider.toUpperCase();
        asset.type = item.tipo;
    } else {
        // Se não existir, cria um novo (ex: RNS-LMLT5-01)
        data.push({
            tag: item.id,
            date: item.data,
            teamId: `EQUIPE_0${item.equipe}`,
            leader: item.lider.toUpperCase(),
            type: item.tipo,
            pmo: 'PMO 21', // Default
            sector: item.id.includes('6') ? '345kV' : '138kV',
            manufacturer: 'ALUPAR',
            model: 'N/A',
            franquia20h: false
        });
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
console.log('Bloco 3 aplicado com sucesso.');

// VALIDAÇÃO FINAL CRÍTICA
const equipe2_20_04 = data.filter(a => a.date === '2026-04-20' && a.teamId === 'EQUIPE_02');
console.log(`\n--- VALIDAÇÃO FINAL ---`);
console.log(`Equipe 2 em 20/04: ${equipe2_20_04.length} ativos (ESPERADO: 3)`);
equipe2_20_04.forEach(a => console.log(`  - ${a.tag}`));

if (equipe2_20_04.length !== 3) {
    console.error('ERRO: Equipe 2 no dia 20/04 não tem exatamente 3 ativos!');
    process.exit(1);
}
