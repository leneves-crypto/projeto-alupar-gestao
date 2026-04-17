import { Asset, Team, Risk, UserProfile, GroundingPoint } from "../types";

export const INITIAL_TEAMS: Team[] = [
  { id: "EQUIPE_01", name: "Equipe 01 - Seccionadora", activity: "PMO 12 - Seccionadora" },
  { id: "EQUIPE_02", name: "Equipe 02 - Seccionadora", activity: "PMO 12 - Seccionadora" },
  { id: "EQUIPE_03", name: "Equipe 03 - Disjuntor", activity: "PMO 07 - Disjuntor" },
  { id: "EQUIPE_04", name: "Equipe 04 - Proteção", activity: "PMO 21 - Proteção, Comando e Controle" },
  { id: "EQUIPE_05", name: "Equipe 05 - Transformadores/Para-Raios/TCs/TPs", activity: "PMO 03 - Transformador" },
];

export const INITIAL_USERS: Partial<UserProfile>[] = [
  {
    name: "Alexandre Lirio (Coordenação)",
    email: "alexandre.lirio@alupar.com.br",
    role: "coordenador"
  },
  {
    name: "Leneves (ADMIN)",
    email: "leneves@alupar.com.br",
    role: "developer"
  },
  {
    name: "Julio Cesar (Engenharia)",
    email: "engenharia@alupar.com.br",
    role: "engenharia"
  },
  {
    name: "Wanderson Costa (Líder 01)",
    email: "lider01@alupar.com.br",
    role: "lider",
    teamId: "EQUIPE_01"
  },
  {
    name: "Vagner Amorim (Líder 02)",
    email: "lider02@alupar.com.br",
    role: "lider",
    teamId: "EQUIPE_02"
  },
  {
    name: "Jakson Rodrigues (Líder 03)",
    email: "lider03@alupar.com.br",
    role: "lider",
    teamId: "EQUIPE_03"
  },
  {
    name: "Deivid Lopes (Líder 04)",
    email: "lider04@alupar.com.br",
    role: "lider",
    teamId: "EQUIPE_04"
  },
  {
    name: "Felipe/Sávio (Líderes 05)",
    email: "lider05@alupar.com.br",
    role: "lider",
    teamId: "EQUIPE_05"
  },
  {
    name: "TST - Segurança do Trabalho",
    email: "tst@alupar.com.br",
    role: "tst"
  }
];

export const INITIAL_ASSETS: Asset[] = [
  // Equipe 01 (Wanderson) - 13/04
  { tag: "RNAT1-SD5-01", type: "Seccionadora", sector: "138kV", manufacturer: "Siemens", model: "EVL", franquia20h: false, pmo: "PMO-12" },
  { tag: "RNAT1-SB5-01", type: "Seccionadora", sector: "138kV", manufacturer: "Siemens", model: "EVL", franquia20h: false, pmo: "PMO-12" },

  // Equipe 02 (Vagner) - 13/04
  { tag: "RNSD6-04", type: "Seccionadora", sector: "345kV", manufacturer: "Siemens", model: "RDA", franquia20h: true, pmo: "PMO-12" },
  { tag: "RNSD6-06", type: "Seccionadora", sector: "345kV", manufacturer: "Siemens", model: "RDA", franquia20h: true, pmo: "PMO-12" },

  // Autotransformadores e Unidades de Controle
  { tag: "RNAT6-01", type: "Autotransformador", sector: "345kV", manufacturer: "Siemens", model: "400 MVA", franquia20h: true, pmo: "PMO-03" },
  { tag: "RNAT6-02", type: "Autotransformador", sector: "345kV", manufacturer: "Siemens", model: "400 MVA", franquia20h: true, pmo: "PMO-03" },
  
  // Disjuntores
  { tag: "RNDJ6-08", type: "Disjuntor", sector: "345kV", manufacturer: "Siemens", model: "3AP2", franquia20h: true, pmo: "PMO-07" },
  { tag: "RNDJ6-02", type: "Disjuntor", sector: "345kV", manufacturer: "Siemens", model: "3AP2", franquia20h: true, pmo: "PMO-07" },
  { tag: "RNDJ6-03", type: "Disjuntor", sector: "345kV", manufacturer: "Siemens", model: "3AP2", franquia20h: true, pmo: "PMO-07" },

  // Outros equipamentos para manter a estrutura mínima
  { tag: "RNTC6-01", type: "TC", sector: "345kV", manufacturer: "Pfiffner", model: "JOF", franquia20h: true, pmo: "PMO-10" },
  { tag: "RNTC6-02", type: "TC", sector: "345kV", manufacturer: "Pfiffner", model: "JOF", franquia20h: true, pmo: "PMO-10" },
  { tag: "RNTC6-03", type: "TC", sector: "345kV", manufacturer: "Pfiffner", model: "JOF", franquia20h: true, pmo: "PMO-10" },
  { tag: "RNTP6-01", type: "TP", sector: "345kV", manufacturer: "Pfiffner", model: "ECF", franquia20h: true, pmo: "PMO-11" },
  { tag: "RNTP6-02", type: "TP", sector: "345kV", manufacturer: "Pfiffner", model: "ECF", franquia20h: true, pmo: "PMO-11" },
  { tag: "RNTP6-03", type: "TP", sector: "345kV", manufacturer: "Pfiffner", model: "ECF", franquia20h: true, pmo: "PMO-11" },
  { tag: "RNPR6-01", type: "Para-raios", sector: "345kV", manufacturer: "Siemens", model: "3EP", franquia20h: true, pmo: "PMO-09" },
  { tag: "RNPR6-02", type: "Para-raios", sector: "345kV", manufacturer: "Siemens", model: "3EP", franquia20h: true, pmo: "PMO-09" },
  { tag: "RNPR6-03", type: "Para-raios", sector: "345kV", manufacturer: "Siemens", model: "3EP", franquia20h: true, pmo: "PMO-09" },
  { tag: "RNAT6-01-PROT", type: "Proteção", sector: "345kV", pmo: "PMO-21" },
];

export const INITIAL_RISKS: Risk[] = [
  {
    id: "R-01",
    title: "Risco Elétrico (Arco Elétrico)",
    category: "eletrico",
    description: "Possibilidade de arco elétrico durante manobras ou proximidade com partes energizadas.",
    mitigation: "Uso de EPI/EPC completo, distanciamento de segurança, aterramento temporário e bloqueio LOTO."
  },
  {
    id: "R-02",
    title: "Queda de Nível (Altura)",
    category: "altura",
    description: "Trabalho em equipamentos elevados (Disjuntores, TCs).",
    mitigation: "Uso de cinto de segurança tipo paraquedista, talabarte duplo, linha de vida e treinamento NR-35."
  },
  {
    id: "R-03",
    title: "Condições Climáticas Adversas",
    category: "clima",
    description: "Ventos fortes ou chuva durante a manutenção em altura ou manobras.",
    mitigation: "Monitoramento em tempo real via app, interrupção das atividades em caso de alerta de tempestade."
  },
  {
    id: "R-04",
    title: "Ergonomia e Esforço Físico",
    category: "ergonomico",
    description: "Movimentação de ferramentas pesadas e posturas inadequadas.",
    mitigation: "Uso de equipamentos auxiliares de içamento, pausas regulares e revezamento de equipe."
  }
];

export const INITIAL_GROUNDING: GroundingPoint[] = [
  // Equipe 05 (Felipe/Sávio) - TERRA 1, 8, 9, 10, 11, 12, 13
  { id: "TERRA-01", bay: "Geral", status: "pendente", day: 1, description: "TERRA 1", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-08", bay: "Geral", status: "pendente", day: 1, description: "TERRA 8", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-09", bay: "Geral", status: "pendente", day: 1, description: "TERRA 9", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-10", bay: "Geral", status: "pendente", day: 1, description: "TERRA 10", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-11", bay: "Geral", status: "pendente", day: 1, description: "TERRA 11", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-12", bay: "Geral", status: "pendente", day: 1, description: "TERRA 12", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },
  { id: "TERRA-13", bay: "Geral", status: "pendente", day: 1, description: "TERRA 13", responsibleTeamId: "EQUIPE_05", type: 'aterramento' },

  // Equipe 02 (Wagner) - TERRA 2, 3, 4, 5, 6, 7
  { id: "TERRA-02", bay: "Geral", status: "pendente", day: 1, description: "TERRA 2", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },
  { id: "TERRA-03", bay: "Geral", status: "pendente", day: 1, description: "TERRA 3", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },
  { id: "TERRA-04", bay: "Geral", status: "pendente", day: 1, description: "TERRA 4", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },
  { id: "TERRA-05", bay: "Geral", status: "pendente", day: 1, description: "TERRA 5", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },
  { id: "TERRA-06", bay: "Geral", status: "pendente", day: 1, description: "TERRA 6", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },
  { id: "TERRA-07", bay: "Geral", status: "pendente", day: 1, description: "TERRA 7", responsibleTeamId: "EQUIPE_02", type: 'aterramento' },

  // Equipe 01 (Wanderson) - TERRA 14, 15, 16, 17, 18, 19
  { id: "TERRA-14", bay: "Geral", status: "pendente", day: 1, description: "TERRA 14", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
  { id: "TERRA-15", bay: "Geral", status: "pendente", day: 1, description: "TERRA 15", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
  { id: "TERRA-16", bay: "Geral", status: "pendente", day: 1, description: "TERRA 16", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
  { id: "TERRA-17", bay: "Geral", status: "pendente", day: 1, description: "TERRA 17", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
  { id: "TERRA-18", bay: "Geral", status: "pendente", day: 1, description: "TERRA 18", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
  { id: "TERRA-19", bay: "Geral", status: "pendente", day: 1, description: "TERRA 19", responsibleTeamId: "EQUIPE_01", type: 'aterramento' },
];
