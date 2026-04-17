/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'tecnico' | 'lider' | 'coordenador' | 'engenharia' | 'tst' | 'developer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
  activity: string;
  Status_Liberação?: 'LIBERADO' | 'BLOQUEADO';
}

export interface Asset {
  tag: string;
  type: string;
  sector: '345kV' | '138kV' | 'Auxiliar';
  manufacturer?: string;
  model?: string;
  franquia20h?: boolean;
  pmo?: string;
  pmo_name?: string;
}

export type TaskStatus = 'pendente' | 'em_execucao' | 'concluido';

export interface PMOItem {
  id: string;
  description: string;
  type?: 'check' | 'measurement';
  unit?: string;
  status?: 'C' | 'NC' | 'NA';
  measurement?: string;
  observation?: string;
}

export interface PMOSection {
  title: string;
  items: PMOItem[];
}

export interface PMOReport {
  id: string;
  taskId: string;
  pmoNumber: string;
  teamId: string;
  substation: string;
  date: string;
  startTime: string;
  endTime: string;
  assetTag: string;
  executor: string;
  sections: PMOSection[];
  technicalData: Record<string, string>;
  measurements: Record<string, any>;
  observations: string;
  photos: {
    url: string;
    caption: string;
    timestamp: string;
  }[];
  status: 'rascunho' | 'finalizado';
  updatedAt?: string;
  approvedBy?: {
    tecnico?: string;
    supervisor?: string;
    coordenador?: string;
  };
}

export interface MaintenanceTask {
  id: string;
  assetTag: string;
  teamId: string;
  status: TaskStatus;
  pmo: string;
  pmo_name?: string;
  reportId?: string;
  sectorId?: string;
  dayNumber?: number;
  milestoneId?: string; // ID of the milestone this task belongs to
  activities?: {
    id: string;
    description: string;
    completed: boolean;
  }[];
  photos?: {
    url: string;
    caption: string;
    timestamp: string;
  }[];
  measurements?: {
    contactResistance?: number;
    openingTime?: number;
    closingTime?: number;
  };
  ESTAGIO_OPERACIONAL?: 'PENDENTE' | 'ATERRAMENTO_CONCLUIDO';
  groundingConfirmed: boolean;
  isActive?: boolean;
  data_inicio?: string | null;
  data_fim?: string | null;
  responsavel?: string | null;
  data_conclusao?: string | null;
  responsavel_pmo?: string | null;
  respostas_pmo?: any[];
  updatedAt: string;
  updatedBy: string;
  date?: string;
  leader?: string;
  assignedTo?: string;
  displayIndex?: number;
}

export type GroundingStatus = 'pendente' | 'instalado' | 'retirado';

export interface GroundingPoint {
  id: string;
  bay: string;
  day: number;
  status: GroundingStatus;
  description?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  responsibleTeamId?: string;
  type: 'aterramento' | 'bloqueio';
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProb: number;
  timestamp: string;
}

export interface Abnormality {
  id: string;
  description: string;
  photoUrl?: string;
  reportedBy: string;
  reportedByName?: string;
  reportedAt: string;
  teamId: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  assetTag?: string;
}

export interface Sector {
  id: string;
  name: string;
  description: string;
  hasFranchise: boolean;
  order: number;
  precedentSectorId?: string; // ID of the bay that must be finished before this one
  isValidated?: boolean;
  day1Validated?: boolean;
  day2Validated?: boolean;
  validatedBy?: string;
  validatedAt?: string;
}

export interface SectorActivity {
  id: string;
  sectorId: string;
  dayNumber: number;
  date: string;
  description: string;
  status: TaskStatus;
  foreman: string;
  equipment: string[];
  timeline: {
    time: string;
    description: string;
    teamId: string;
  }[];
  isLocked?: boolean;
  authorizedStart?: boolean;
  authorizedTeams?: string[];
  macroFinalized?: boolean;
  milestoneId?: string;
  precedentMilestoneId?: string;
  type: 'operacao' | 'manutencao' | 'comissionamento';
  assignedTeams?: string[]; // Teams assigned to this activity
  // Physical columns for interlock status
  [key: string]: any; 
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  mitigation: string;
  category: 'eletrico' | 'altura' | 'clima' | 'ergonomico';
}
