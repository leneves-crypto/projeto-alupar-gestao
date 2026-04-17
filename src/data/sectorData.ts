import { Sector, SectorActivity } from "../types";

export const INITIAL_SECTORS: Sector[] = [
  { 
    id: 'SEC-01', 
    name: 'FT Vão AT6-01 – Transformação', 
    description: 'Transformação e Interligação de Barra', 
    hasFranchise: true, 
    order: 1,
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-03', 
    name: 'FT Vão AT6-02 - Transformação', 
    description: 'Transformação e Interligação de Barra', 
    hasFranchise: true, 
    order: 2,
    precedentSectorId: 'SEC-01',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-06', 
    name: 'Vão CY - LMLT5-01 - Cachoeiro C2', 
    description: 'Entrada de Linha de Transmissão', 
    hasFranchise: false, 
    order: 3,
    precedentSectorId: 'SEC-03',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-07', 
    name: 'Vão DY - LMLT5-01 - Cachoeiro C1', 
    description: 'Entrada de Linha de Transmissão', 
    hasFranchise: false, 
    order: 4,
    precedentSectorId: 'SEC-06',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-02', 
    name: 'Módulo Geral', 
    description: 'Módulo Geral de Manobra', 
    hasFranchise: true, 
    order: 5,
    precedentSectorId: 'SEC-07',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-04', 
    name: 'Vão AY - LMLT5-01 - Lameirão C1', 
    description: 'Entrada de Linha de Transmissão', 
    hasFranchise: false, 
    order: 6,
    precedentSectorId: 'SEC-02',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  },
  { 
    id: 'SEC-05', 
    name: 'Vão BY/BX - LMLT5-01 - Guarapari C1 + IB', 
    description: 'Entrada de Linha de Transmissão', 
    hasFranchise: false, 
    order: 7,
    precedentSectorId: 'SEC-04',
    isValidated: false,
    day1Validated: false,
    day2Validated: false
  }
];

export const INITIAL_SECTOR_ACTIVITIES: SectorActivity[] = [
  // Vão AT6-01 - Dia 1 (13/04)
  {
    id: 'SA-01-D1-OP',
    sectorId: 'SEC-01',
    dayNumber: 1,
    date: '2026-04-20',
    milestoneId: 'SEC01-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['AT6-01', 'Barra 02', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-01-D1-MAN',
    sectorId: 'SEC-01',
    dayNumber: 1,
    date: '2026-04-20',
    milestoneId: 'SEC01-D1-MAN',
    precedentMilestoneId: 'SEC01-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNAT1-SD5-01', 'RNAT1-SB5-01', 'RNSD6-04', 'RNSD6-06', 'RNDJ6-08', 'RNDJ6-02', 'RNDJ6-03', 'RNTC6-01', 'RNTC6-02', 'RNTC6-03', 'RNTP6-01', 'RNTP6-02', 'RNTP6-03', 'RNPR6-01', 'RNPR6-02', 'RNPR6-03', 'RNAT6-01'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_01' },
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_02' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva Transformadores/Para-Raios/TCs/TPs', teamId: 'EQUIPE_05' },
      { time: '08:00', description: 'Proteção e Controle', teamId: 'EQUIPE_04' },
    ]
  },
  // Vão AT6-01 - Dia 2 (21/04)
  {
    id: 'SA-01-D2-MAN',
    sectorId: 'SEC-01',
    dayNumber: 2,
    date: '2026-04-22',
    milestoneId: 'SEC01-D2-MAN',
    precedentMilestoneId: 'SA-01-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSD6-05', 'RNST6-01', 'RNDJ6-04'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais e Comissionamento', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva Transformadores/Para-Raios/TCs/TPs', teamId: 'EQUIPE_05' },
    ]
  },
  // Módulo Geral (22/04)
  {
    id: 'SA-02-D1-OP',
    sectorId: 'SEC-02',
    dayNumber: 1,
    date: '2026-04-29',
    milestoneId: 'SEC02-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['Módulo Geral', 'Barra 02'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:20', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-02-D1-MAN',
    sectorId: 'SEC-02',
    dayNumber: 1,
    date: '2026-04-29',
    milestoneId: 'SEC02-D1-MAN',
    precedentMilestoneId: 'SA-02-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva',
    equipment: ['RNSD6-15', 'RNSD6-21', 'RNSD6-16', 'RNSD6-22', 'RNDJ6-08', 'RNDJ6-11'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '07:30', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_01' },
      { time: '07:30', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '07:30', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-02-D1-END',
    sectorId: 'SEC-02',
    dayNumber: 1,
    date: '2026-04-29',
    milestoneId: 'SEC02-D1-END',
    precedentMilestoneId: 'SA-02-D1-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['Módulo Geral'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '14:00', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '14:35', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  },


  // Vão AT6-02 - Dia 1 (23/04)
  {
    id: 'SA-03-D1-OP',
    sectorId: 'SEC-03',
    dayNumber: 1,
    date: '2026-04-23',
    milestoneId: 'SEC03-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['AT6-02', 'Barra 02', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-03-D1-MAN',
    sectorId: 'SEC-03',
    dayNumber: 1,
    date: '2026-04-23',
    milestoneId: 'SEC03-D1-MAN',
    precedentMilestoneId: 'SEC03-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNSD6-12', 'RNSD6-09', 'RNSD6-10', 'RNDJ6-11', 'RNDJ6-05', 'RNDJ6-06', 'RNTC6-04', 'RNTC6-05', 'RNTC6-06', 'RNTP6-04', 'RNTP6-05', 'RNTP6-06', 'RNAT6-02'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_01' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva Transformadores/Para-Raios/TCs/TPs', teamId: 'EQUIPE_05' },
      { time: '08:00', description: 'Proteção e Controle', teamId: 'EQUIPE_04' },
    ]
  },
  // Vão AT6-02 - Dia 2 (24/04)
  {
    id: 'SA-03-D2-MAN',
    sectorId: 'SEC-03',
    dayNumber: 2,
    date: '2026-04-24',
    milestoneId: 'SEC03-D2-MAN',
    precedentMilestoneId: 'SA-03-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSD6-11', 'RNST6-02', 'RNDJ6-07'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais e Comissionamento', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-03-D2-END',
    sectorId: 'SEC-03',
    dayNumber: 2,
    date: '2026-04-24',
    milestoneId: 'SEC03-D2-END',
    precedentMilestoneId: 'SA-03-D2-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['AT6-02'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '15:30', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '16:00', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  },


  // Vão AY (20/04 e 22/04)
  {
    id: 'SA-04-D1-OP',
    sectorId: 'SEC-04',
    dayNumber: 1,
    date: '2026-05-04',
    milestoneId: 'SEC04-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['Vão AY', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-04-D1-MAN',
    sectorId: 'SEC-04',
    dayNumber: 1,
    date: '2026-05-04',
    milestoneId: 'SEC04-D1-MAN',
    precedentMilestoneId: 'SEC04-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNSB5-03', 'RNSD5-02', 'RNDJ5-02', 'RNTC5-01', 'RNTC5-02', 'RNTC5-03'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_02' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-04-D2-MAN',
    sectorId: 'SEC-04',
    dayNumber: 2,
    date: '2026-05-05',
    milestoneId: 'SEC04-D2-MAN',
    precedentMilestoneId: 'SA-04-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSB5-04', 'RNSY5-02', 'RNTP5-01', 'RNTP5-02', 'RNTP5-03', 'RNPR5-01', 'RNPR5-02', 'RNPR5-03'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-04-D2-END',
    sectorId: 'SEC-04',
    dayNumber: 2,
    date: '2026-05-05',
    milestoneId: 'SEC04-D2-END',
    precedentMilestoneId: 'SA-04-D2-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['Vão AY'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '15:30', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '16:00', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  },

  // Vão BY/BX (23/04 e 24/04)
  {
    id: 'SA-05-D1-OP',
    sectorId: 'SEC-05',
    dayNumber: 1,
    date: '2026-05-06',
    milestoneId: 'SEC05-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['Vão BY/BX', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-05-D1-MAN',
    sectorId: 'SEC-05',
    dayNumber: 1,
    date: '2026-05-06',
    milestoneId: 'SEC05-D1-MAN',
    precedentMilestoneId: 'SEC05-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNSB5-05', 'RNSD5-03', 'RNSD5-05', 'RNDJ5-03', 'RNTC5-04', 'RNTC5-05', 'RNTC5-06', 'RNTC5-07', 'RNTC5-08', 'RNTC5-09'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_02' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-05-D2-MAN',
    sectorId: 'SEC-05',
    dayNumber: 2,
    date: '2026-05-07',
    milestoneId: 'SEC05-D2-MAN',
    precedentMilestoneId: 'SA-05-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSB5-06', 'RNSY5-03', 'RNSD5-04', 'RNDB5-01', 'RNTP5-04', 'RNTP5-05', 'RNTP5-06', 'RNPR5-04', 'RNPR5-05', 'RNPR5-06'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-05-D2-END',
    sectorId: 'SEC-05',
    dayNumber: 2,
    date: '2026-05-07',
    milestoneId: 'SEC05-D2-END',
    precedentMilestoneId: 'SA-05-D2-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['Vão BY/BX'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '15:30', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '16:00', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  },

  // Vão CY (27/04 e 28/04)
  {
    id: 'SA-06-D1-OP',
    sectorId: 'SEC-06',
    dayNumber: 1,
    date: '2026-04-25',
    milestoneId: 'SEC06-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['Vão CY', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-06-D1-MAN',
    sectorId: 'SEC-06',
    dayNumber: 1,
    date: '2026-04-25',
    milestoneId: 'SEC06-D1-MAN',
    precedentMilestoneId: 'SEC06-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNSB5-07', 'RNSD5-06', 'RNDJ5-04', 'RNTC5-10', 'RNTC5-11', 'RNTC5-12'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_02' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-06-D2-MAN',
    sectorId: 'SEC-06',
    dayNumber: 2,
    date: '2026-04-27',
    milestoneId: 'SEC06-D2-MAN',
    precedentMilestoneId: 'SA-06-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSB5-08', 'RNSY5-04', 'RNTP5-07', 'RNTP5-08', 'RNTP5-09', 'RNPR5-07', 'RNPR5-08', 'RNPR5-09'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-06-D2-END',
    sectorId: 'SEC-06',
    dayNumber: 2,
    date: '2026-04-27',
    milestoneId: 'SEC06-D2-END',
    precedentMilestoneId: 'SA-06-D2-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['Vão CY'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '15:30', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '16:00', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  },

  // Vão DY (29/04 e 30/04)
  {
    id: 'SA-07-D1-OP',
    sectorId: 'SEC-07',
    dayNumber: 1,
    date: '2026-04-28',
    milestoneId: 'SEC07-D1-OP',
    type: 'operacao',
    description: 'Bloqueios e Aterramentos',
    equipment: ['Vão DY', 'Barra 01'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '07:00', description: 'Manobras / Instalação Bloqueios', teamId: 'EQUIPE_01' },
      { time: '07:40', description: 'Instalação de Aterramentos', teamId: 'EQUIPE_01' },
    ]
  },
  {
    id: 'SA-07-D1-MAN',
    sectorId: 'SEC-07',
    dayNumber: 1,
    date: '2026-04-28',
    milestoneId: 'SEC07-D1-MAN',
    precedentMilestoneId: 'SEC07-D1-OP',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 1',
    equipment: ['RNSB5-11', 'RNSD5-08', 'RNDJ5-06', 'RNTC5-13', 'RNTC5-14', 'RNTC5-15'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Preventiva Chaves Seccionadoras', teamId: 'EQUIPE_02' },
      { time: '08:00', description: 'Preventiva Disjuntor', teamId: 'EQUIPE_03' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-07-D2-MAN',
    sectorId: 'SEC-07',
    dayNumber: 2,
    date: '2026-04-30',
    milestoneId: 'SEC07-D2-MAN',
    precedentMilestoneId: 'SA-07-D1-MAN',
    type: 'manutencao',
    description: 'Manutenção Preventiva - Dia 2',
    equipment: ['RNSB5-12', 'RNSY5-06', 'RNTP5-10', 'RNTP5-11', 'RNTP5-12', 'RNPR5-10', 'RNPR5-11', 'RNPR5-12'],
    foreman: 'Wanderson/Vagner/Jakson/Felipe/Sávio',
    assignedTeams: ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'],
    status: 'pendente',
    timeline: [
      { time: '08:00', description: 'Ensaios Finais', teamId: 'EQUIPE_04' },
      { time: '08:00', description: 'Preventiva TCs/TPs/Para-Raios', teamId: 'EQUIPE_05' },
    ]
  },
  {
    id: 'SA-07-D2-END',
    sectorId: 'SEC-07',
    dayNumber: 2,
    date: '2026-04-30',
    milestoneId: 'SEC07-D2-END',
    precedentMilestoneId: 'SA-07-D2-MAN',
    type: 'comissionamento',
    description: 'Retirada e Energização',
    equipment: ['Vão DY'],
    foreman: 'Alexandre Lirio',
    assignedTeams: ['EQUIPE_01'],
    status: 'pendente',
    timeline: [
      { time: '15:30', description: 'Retirada de Aterramentos', teamId: 'EQUIPE_01' },
      { time: '16:00', description: 'Energização', teamId: 'EQUIPE_01' },
    ]
  }
];
