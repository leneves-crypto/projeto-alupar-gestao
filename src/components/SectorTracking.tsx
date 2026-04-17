import React, { useState } from 'react';
import { toast } from 'sonner';
import { Sector, SectorActivity, MaintenanceTask, Team, TaskStatus, GroundingPoint, UserProfile, GroundingStatus } from '../types';
import { Card } from './Card';
import { Lock, CheckCircle2, Clock, MapPin, User, Zap, ChevronRight, X, AlertCircle, ShieldCheck, ShieldAlert, Shield, Settings, ClipboardCheck, Users, ArrowRightCircle, LayoutGrid, Calendar, Check, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './Button';
import { maintenanceService } from '../services/maintenanceService';
import { seedInitialData, resetSimulation } from '../services/seedData';
import { ConfirmationModal } from './ConfirmationModal';

import { PMO_TEMPLATES } from '../constants/pmoTemplates';
import { PMOForm } from './PMOForm';
import { ChecklistForm } from './ChecklistForm';

import { INITIAL_SECTORS, INITIAL_SECTOR_ACTIVITIES } from '../data/sectorData';

interface SectorTrackingProps {
  user: UserProfile;
  sectors: Sector[];
  activities: SectorActivity[];
  tasks: MaintenanceTask[];
  teams: Team[];
  grounding: GroundingPoint[];
  onUpdateTask: (id: string, data: Partial<MaintenanceTask>) => Promise<void>;
  onUpdateGrounding: (id: string, status: GroundingStatus, userId: string) => Promise<void>;
  onValidateSector: (sectorId: string, userId: string) => Promise<void>;
  onValidateSectorDay: (sectorId: string, day: number, userId: string) => Promise<void>;
  onAuthorizeActivity: (activityId: string, userId: string, teamId?: string) => Promise<void>;
  onCancelAuthorization: (activityId: string, userId: string, teamId: string) => Promise<void>;
  onRequestAuthorization: (activityId: string, userId: string, teamId: string) => Promise<void>;
  onFinalizeMacro: (activityId: string, userId: string) => Promise<void>;
  teamAuthorizations: Record<string, string>;
  onUpdateTeamAuthorization: (teamId: string, status: 'LIBERADO' | 'BLOQUEADO', userId: string) => Promise<void>;
}

export const SectorTracking: React.FC<SectorTrackingProps> = ({ 
  user, sectors, activities, tasks, teams, grounding, teamAuthorizations,
  onUpdateTask, onUpdateGrounding, onValidateSector, onValidateSectorDay, onAuthorizeActivity, onCancelAuthorization, onRequestAuthorization, onFinalizeMacro, onUpdateTeamAuthorization
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [activeTabDay, setActiveTabDay] = useState<number>(1);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [drillDownTeamId, setDrillDownTeamId] = useState<string | null>(null);
  const [showMassSeedConfirm, setShowMassSeedConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);

  const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
  const filteredTeams = teams.filter(t => validTeams.includes(t.id));
  const filteredActivities = activities.filter(a => (a.assignedTeams || []).some(teamId => validTeams.includes(teamId)));
  const filteredTasks = tasks.filter(t => validTeams.includes(t.teamId));

  const isDeveloper = user.role === 'developer' || user.email === 'leneves@alupar.com.br';
  const isCoordinator = user.role === 'coordenador' || user.role === 'engenharia' || isDeveloper;
  const isTST = user.role === 'tst';
  const isManagement = isCoordinator || isTST;
  const canRelease = user.role === 'engenharia' || isDeveloper;
  const showEvolutionBars = user.role === 'engenharia' || isDeveloper || user.email === 'leneves@alupar.com.br';

  // Helper to check if previous sector is 100% complete
  const isPreviousSectorComplete = (currentOrder: number) => {
    if (currentOrder <= 1) return true;
    const prevSector = (sectors || []).find(s => s.order === currentOrder - 1);
    if (!prevSector) return true;
    return calculateSectorProgress(prevSector.id) === 100;
  };

  // Helper to check if a specific day is locked by sequencing
  const isDayLockedBySequencing = (sector: Sector, day: number) => {
    if (isManagement) return false;
    
    // Rule: Vão X only if Vão X-1 is 100%
    if (!isPreviousSectorComplete(sector.order)) return true;

    // Rule: Dia 2 only if Dia 1 is 100% AND Validated
    if (day === 2) {
      const day1Progress = calculateSectorDayProgress(sector.id, 1);
      return day1Progress < 100 || !sector.day1Validated;
    }
    
    // Rule: If Day 1 is already validated, it's "past", hide it to show only Day 2
    if (day === 1 && sector.day1Validated) return true;
    
    return false;
  };

  // Auto-expand first relevant bay or Vão 01 for coordinators
  React.useEffect(() => {
    if (!selectedSectorId && (sectors || []).length > 0) {
      if (isManagement) {
        // For management, default to Vão 01 (SEC-01) if nothing selected
        const vao01 = [...(sectors || [])].sort((a, b) => a.order - b.order)[0];
        if (vao01) setSelectedSectorId(vao01.id);
      } else if ((activities || []).length > 0) {
        // For technicians, find their first relevant sector
        const relevantSector = (sectors || []).find(s => {
          const sectorActivities = (activities || []).filter(a => 
            a && a.sectorId === s.id && 
            (a.assignedTeams?.includes(user.teamId || '') || a.foreman === user.name)
          );
          return sectorActivities.length > 0;
        });
        
        if (relevantSector) {
          setSelectedSectorId(relevantSector.id);
          
          // Find first unlocked day for teams
          const unlockedDay = [1, 2].find(d => !isDayLockedBySequencing(relevantSector, d));
          if (unlockedDay) {
            setActiveTabDay(unlockedDay);
          } else {
            const firstActivity = (activities || []).find(a => 
              a && a.sectorId === relevantSector.id && 
              (a.assignedTeams?.includes(user.teamId || '') || a.foreman === user.name)
            );
            if (firstActivity) {
              setActiveTabDay(firstActivity.dayNumber);
            }
          }
        }
      }
    }
  }, [isManagement, selectedSectorId, activities, sectors, user.teamId, user.name]);

  // Helper to check if all tasks for an activity are completed
  const areAllTasksCompleted = (milestoneId: string) => {
    const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
    const milestoneTasks = (filteredTasks || []).filter(t => t && t.milestoneId === milestoneId);
    if (milestoneTasks.length === 0) return true;
    
    // Check if all tasks are completed
    const allTasksCompleted = milestoneTasks.every(t => t && t.status === 'concluido');
    
    // Find the activity to check assigned teams
    const activity = (filteredActivities || []).find(a => a && a.milestoneId === milestoneId);
    if (!activity) return allTasksCompleted;

    // Rule: All assigned teams must have 100% progress
    const allTeamsReached100 = (activity.assignedTeams || []).filter(tid => validTeams.includes(tid)).every(teamId => {
      const teamTasks = milestoneTasks.filter(t => t.teamId === teamId);
      return teamTasks.length > 0 && teamTasks.every(t => t.status === 'concluido');
    });

    return allTasksCompleted && allTeamsReached100;
  };

  const getTeamProgress = (activity: SectorActivity, teamId: string) => {
    const teamTasks = (tasks || []).filter(t => t && t.milestoneId === activity.milestoneId && t.teamId === teamId);
    const total = teamTasks.length;
    const completed = teamTasks.filter(t => t.status === 'concluido').length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      progress,
      total,
      completed,
      status: progress === 100 ? 'concluido' : progress > 0 ? 'em_andamento' : 'pendente',
      tasks: teamTasks
    };
  };

  // Helper to check if a team is authorized (CHAVE_MESTRA_EQX = 'LIBERADO')
  const isTeamAuthorized = (teamId: string) => {
    return teamAuthorizations[teamId] === 'LIBERADO';
  };

  // Helper to check if a team is waiting for authorization
  const isTeamWaitingAuthorization = (teamId: string) => {
    return !isTeamAuthorized(teamId);
  };

  // Helper to check if milestone is locked based on team-specific logic
  const isMilestoneLocked = (activity: SectorActivity, teamId?: string) => {
    if (isDeveloper) return false;
    
    const sector = (sectors || []).find(s => s.id === activity.sectorId);
    if (!sector) return true;

    // 1. Check Day/Sector Sequencing
    if (isDayLockedBySequencing(sector, activity.dayNumber)) return true;

    // 2. SANEAMENTO: Destravamento de Escrita (Editable_If): [Status_Autorizacao_Engenheiro] = "LIBERADO"
    const currentTeamId = teamId || user.teamId || '';
    if (!currentTeamId) return true;
    
    return !isTeamAuthorized(currentTeamId);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'concluido': return 'text-green-600 bg-green-100';
      case 'em_execucao': return 'text-blue-600 bg-blue-100';
      default: return 'text-slate-400 bg-slate-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'operacao': return <Zap size={14} />;
      case 'manutencao': return <Settings size={14} />;
      case 'comissionamento': return <ClipboardCheck size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const calculateSectorDayProgress = (sectorId: string, day: number) => {
    const dayActivities = (filteredActivities || []).filter(a => a && a.sectorId === sectorId && a.dayNumber === day);
    if (dayActivities.length === 0) return 0;
    const completed = dayActivities.filter(a => a && a.status === 'concluido').length;
    return (completed / dayActivities.length) * 100;
  };

  const calculateSectorProgress = (sectorId: string) => {
    const sectorActivities = (filteredActivities || []).filter(a => {
      if (!a || a.sectorId !== sectorId) return false;
      if (isManagement) return true;
      return (a.assignedTeams || []).includes(user.teamId || '') || a.foreman === user.name;
    });

    if (sectorActivities.length === 0) return 0;
    const completed = sectorActivities.filter(a => a && a.status === 'concluido').length;
    return (completed / sectorActivities.length) * 100;
  };

  const displaySectors = (sectors && sectors.length > 0) ? sectors : INITIAL_SECTORS;

  return (
    <div className="space-y-8">
      {isDeveloper && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-[32px] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                <ShieldAlert size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Console de Desenvolvedor</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Acesso de Super-Usuário Ativo</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest"
                onClick={() => {
                  console.log('DEBUG DATA DUMP:', { sectors, activities, tasks, grounding, teams, user });
                  alert(`Sectors: ${sectors.length}\nActivities: ${activities.length}\nTasks: ${tasks.length}\nGrounding: ${grounding.length}\nCheck console for details.`);
                }}
              >
                Dump Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 rounded-xl font-black text-[10px] uppercase tracking-widest"
                onClick={() => setShowMassSeedConfirm(true)}
                disabled={syncStatus !== 'idle'}
              >
                Carga em Massa
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="rounded-xl gap-2 font-black text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-red-900/20"
                onClick={() => setShowResetConfirm(true)}
                disabled={syncStatus !== 'idle'}
              >
                <Trash2 size={16} />
                Zerar Simulação de Testes
              </Button>
            </div>
          </div>
          
          {syncStatus !== 'idle' && (
            <div className="fixed inset-0 bg-[#001a33]/90 backdrop-blur-md z-[300] flex flex-col items-center justify-center p-6 text-center text-white">
              {syncStatus === 'syncing' && (
                <>
                  <RefreshCw className="w-12 h-12 animate-spin mb-4 text-blue-400" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Sincronizando Dados...</h2>
                  <p className="text-blue-300 font-bold uppercase tracking-widest text-xs mt-2 mb-6">Por favor, aguarde enquanto atualizamos o sistema</p>
                  <Button 
                    variant="ghost" 
                    className="text-white/30 hover:text-white text-[10px] uppercase font-black"
                    onClick={() => setSyncStatus('idle')}
                  >
                    Cancelar Visualmente
                  </Button>
                </>
              )}
              {syncStatus === 'success' && (
                <>
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                    <Check className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Sincronização Concluída!</h2>
                  <p className="text-green-400 text-[10px] mt-2 uppercase font-bold mb-6">O sistema será reiniciado em instantes...</p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="border-white/20 text-white hover:bg-white/10 text-[10px] uppercase font-black"
                      onClick={() => window.location.reload()}
                    >
                      Recarregar Agora
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="text-white/50 hover:text-white text-[10px] uppercase font-black"
                      onClick={() => setSyncStatus('idle')}
                    >
                      Continuar sem Recarregar
                    </Button>
                  </div>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                    <X className="text-white" size={32} />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Erro na Sincronização</h2>
                  <p className="text-red-400 text-[10px] mt-2 uppercase font-bold mb-6">Tente novamente ou verifique sua conexão</p>
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => setSyncStatus('idle')}
                  >
                    Fechar
                  </Button>
                </>
              )}
            </div>
          )}

          <ConfirmationModal
            isOpen={showMassSeedConfirm}
            onClose={() => setShowMassSeedConfirm(false)}
            onConfirm={() => {
              console.log('[SectorTracking] Starting mass seed...');
              setSyncStatus('syncing');
              seedInitialData(true).then(() => {
                console.log('[SectorTracking] Mass seed success, reloading...');
                setSyncStatus('success');
                toast.success('Carga em Massa Concluída!');
                setTimeout(() => window.location.href = '/', 1500);
              }).catch(err => {
                console.error('[SectorTracking] Mass seed error:', err);
                setSyncStatus('error');
                toast.error('Erro na carga em massa.');
              });
            }}
            title="Carga em Massa"
            message="Deseja realizar a carga em massa de 181 ativos? Isso irá limpar os dados atuais e reconstruir a estrutura."
            confirmLabel="Executar Carga"
          />

          <ConfirmationModal
            isOpen={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={() => {
              console.log('[SectorTracking] Starting simulation reset...');
              setSyncStatus('syncing');
              
              const timeoutId = setTimeout(() => {
                setSyncStatus('error');
                toast.error('O reset demorou mais que o esperado.');
              }, 45000);

              resetSimulation().then(() => {
                console.log('[SectorTracking] Simulation reset success, reloading...');
                clearTimeout(timeoutId);
                setSyncStatus('success');
                toast.success('Simulação Zerada com Sucesso!');
                
                // Force immediate reload to clear memory and restart App
                setTimeout(() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/'; 
                }, 1500);
              }).catch(err => {
                clearTimeout(timeoutId);
                console.error('[SectorTracking] Simulation reset error:', err);
                setSyncStatus('error');
                toast.error('Erro ao zerar simulação.');
                
                // Reset status to idle so the user can try again
                setTimeout(() => setSyncStatus('idle'), 3000);
              });
            }}
            title="Zerar Simulação"
            message="Deseja apagar todos os avanços de teste e voltar ao início do cronograma? (Isso não apagará as tags dos equipamentos)"
            confirmLabel="Zerar Agora"
            variant="destructive"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Setores</p>
              <p className="text-xl font-black text-white">{(sectors || []).length}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Atividades</p>
              <p className="text-xl font-black text-white">{(activities || []).length}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Tarefas</p>
              <p className="text-xl font-black text-white">{(tasks || []).length}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Aterramentos</p>
              <p className="text-xl font-black text-white">{(grounding || []).length}</p>
            </div>
          </div>
        </div>
      )}
      {/* SEÇÃO 1: Bloqueios e Aterramentos */}
      {isManagement && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#003366] uppercase tracking-tighter">Seção 1: Bloqueios e Aterramentos</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autorização do Engenheiro (Sempre Visível)</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg">
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(num => {
                  const teamId = `EQUIPE_0${num}`;
                  const isAuthorized = isTeamAuthorized(teamId);

                return (
                  <div key={teamId} className="flex flex-col items-center gap-2">
                    <Button
                      variant={isAuthorized ? 'success' : 'outline'}
                      className={`w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-tighter transition-all ${
                        isAuthorized ? 'shadow-md shadow-green-100' : 'border-slate-100 text-slate-300'
                      }`}
                      onClick={async () => {
                        const newStatus = isAuthorized ? 'BLOQUEADO' : 'LIBERADO';
                        const msg = isAuthorized ? `EQ ${num} BLOQUEADA.` : `EQ ${num} LIBERADA!`;
                        
                        try {
                          await onUpdateTeamAuthorization(teamId, newStatus, user.uid);
                          if (newStatus === 'BLOQUEADO') toast.error(msg);
                          else toast.success(msg);
                        } catch (err) {
                          toast.error("Erro na autorização.");
                        }
                      }}
                    >
                      {isAuthorized ? 'LIB' : 'BLOQ'}
                    </Button>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Equipe {num}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 2: Manutenção Preventiva Dia 1 */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#003366] uppercase tracking-tighter">Seção 2: Manutenção Preventiva Dia 1</h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de Vãos e PMOs</p>
                {isTST && (
                  <button
                    onClick={() => setShowHighRiskOnly(!showHighRiskOnly)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                      showHighRiskOnly 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-white border-orange-100 text-orange-600'
                    }`}
                  >
                    <ShieldAlert size={10} />
                    {showHighRiskOnly ? 'Risco Alto' : 'Filtrar Risco'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Concluído
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Em Execução
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 px-2">
          {[...displaySectors]
            .sort((a, b) => a.order - b.order)
            .filter(sector => {
              if (isManagement) return true;
              
              // For teams: Only show the current "active" sector that is released
              const isAuthorized = isTeamAuthorized(user.teamId || '');
              const prevComplete = isPreviousSectorComplete(sector.order);
              
              // Show if it's the first incomplete sector for the team AND it's authorized
              // OR if they have already started it (in case authorization was revoked or something)
              const sectorProgress = calculateSectorProgress(sector.id);
              const isCurrentSector = prevComplete && sectorProgress < 100;
              
              // If it's authorized and it's the "next" one, show it.
              return isAuthorized && isCurrentSector;
            })
            .map((sector) => {
          const locked = isManagement ? false : !isPreviousSectorComplete(sector.order);
          const progress = calculateSectorProgress(sector.id);
          const isFinished = sector.isValidated;
          const isReady = progress === 100 && !isFinished;
          const hasDelay = false;
          const sectorActivities = (activities || []).filter(a => a && a.sectorId === sector.id);
          const days = Array.from(new Set(sectorActivities.map(a => a.dayNumber))).sort();

          return (
            <Card 
              key={sector.id}
              className={`overflow-hidden border-l-4 transition-all ${
                locked ? 'border-l-slate-300 bg-slate-50/50' : 
                isFinished ? 'border-l-green-500' : 'border-l-blue-500'
              }`}
            >
              <div className="p-4 md:p-6 border-b border-slate-50 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${
                      locked ? 'bg-slate-200 text-slate-400' :
                      isFinished ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {locked ? <Lock size={20} /> : <MapPin size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          locked ? 'bg-slate-200 text-slate-500' : 'bg-blue-50 text-blue-600'
                        }`}>
                          Vão {sector.order}
                        </span>
                        {locked && (
                          <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock size={10} />
                            Aguardando Início
                          </span>
                        )}
                        {hasDelay && (
                          <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <AlertCircle size={10} />
                            Atraso Previsto
                          </span>
                        )}
                      </div>
                      <h3 className={`text-base font-black uppercase tracking-tight ${locked ? 'text-slate-400' : 'text-[#003366]'}`}>
                        {sector.name}
                      </h3>
                    </div>
                  </div>

                    <div className="flex items-center gap-6">
                      {showEvolutionBars && isManagement ? (
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                            Progresso por Dia
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black text-slate-400 uppercase">Dia 1</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-black uppercase ${calculateSectorDayProgress(sector.id, 1) === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                  {Math.round(calculateSectorDayProgress(sector.id, 1))}%
                                </span>
                                {calculateSectorDayProgress(sector.id, 1) === 100 && (
                                  <span className="text-[8px] font-black text-green-600 uppercase bg-green-50 px-1 rounded">Dia Concluído</span>
                                )}
                              </div>
                            </div>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${calculateSectorDayProgress(sector.id, 1) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${calculateSectorDayProgress(sector.id, 1)}%` }}
                              />
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] font-black text-slate-400 uppercase">Dia 2</span>
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-black uppercase ${calculateSectorDayProgress(sector.id, 2) === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                  {Math.round(calculateSectorDayProgress(sector.id, 2))}%
                                </span>
                                {calculateSectorDayProgress(sector.id, 2) === 100 && (
                                  <span className="text-[8px] font-black text-green-600 uppercase bg-green-50 px-1 rounded">Dia Concluído</span>
                                )}
                              </div>
                            </div>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${calculateSectorDayProgress(sector.id, 2) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${calculateSectorDayProgress(sector.id, 2)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                      <Button 
                        variant={locked ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => !locked && setSelectedSectorId(sector.id === selectedSectorId ? null : sector.id)}
                        className="shrink-0"
                      >
                        {locked ? <Lock size={14} /> : selectedSectorId === sector.id ? 'Fechar' : 'Ver Detalhes'}
                      </Button>
                    
                      {isManagement && isReady && !sector.isValidated && (
                        <Button
                          variant="success"
                          size="sm"
                          disabled={calculateSectorProgress(sector.id) < 100}
                          onClick={() => onValidateSector(sector.id, user.uid)}
                          className="shrink-0 gap-1"
                        >
                          <ShieldCheck size={14} />
                          Finalizar Macro (Vão)
                        </Button>
                      )}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedSectorId === sector.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 md:p-6 bg-white space-y-6">
                      {/* Tabs for Day 1 and Day 2 */}
                      <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                        {[1, 2].map(dayNum => {
                          const dayActivity = sectorActivities.find(a => a.dayNumber === dayNum);
                          const dateStr = dayActivity?.date ? dayActivity.date.split('-').reverse().join('/') : `Dia ${dayNum}`;
                          const dayLocked = isDayLockedBySequencing(sector, dayNum);
                          
                          if (!isManagement && dayLocked) return null;

                          return (
                            <button
                              key={dayNum}
                              onClick={() => setActiveTabDay(dayNum)}
                              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTabDay === dayNum 
                                  ? 'bg-white text-blue-600 shadow-sm' 
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {dateStr}
                            </button>
                          );
                        })}
                      </div>

                      {(() => {
                        const day = activeTabDay;
                        let dayActivities = sectorActivities.filter(a => a.dayNumber === day);
                        
                        if (showHighRiskOnly) {
                          // Filter for high risk or critical activities
                          dayActivities = dayActivities.filter(a => 
                            a.description.toLowerCase().includes('crítica') || 
                            a.description.toLowerCase().includes('risco') ||
                            a.type === 'operacao'
                          );
                        }

                        const dayTasks = tasks.filter(t => 
                          t.sectorId === sector.id && 
                          t.dayNumber === day &&
                          (!user.teamId || t.teamId === user.teamId || isCoordinator)
                        );

                        if (dayActivities.length === 0) return (
                          <div className="py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <Calendar size={24} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                              Nenhuma atividade programada para este dia
                            </p>
                          </div>
                        );
                        
                        const isDayValidated = day === 1 ? sector.day1Validated : sector.day2Validated;
                        const day1Tasks = (filteredTasks || []).filter(t => t.sectorId === sector.id && t.dayNumber === 1);
                        const day1Completed = day1Tasks.filter(t => t.status === 'concluido').length;
                        const day1Progress = day1Tasks.length > 0 ? (day1Completed / day1Tasks.length) * 100 : 0;

                        return (
                          <div className="space-y-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                                  isDayValidated ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                }`}>
                                  {day}
                                </div>
                                <div>
                                  <h3 className="text-sm font-black uppercase tracking-tighter text-[#003366]">
                                    Cronograma Diário
                                  </h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    {dayActivities[0]?.date.split('-').reverse().join('/')}
                                  </p>
                                </div>
                              </div>

                              {isManagement && day === 1 && !sector.day1Validated && (
                                <Button
                                  variant={day1Progress >= 100 ? "success" : "outline"}
                                  size="sm"
                                  disabled={day1Progress < 100}
                                  onClick={() => onValidateSectorDay(sector.id, 1, user.uid)}
                                  className="gap-2 rounded-xl"
                                >
                                  <ShieldCheck size={16} />
                                  Validar Dia 1
                                </Button>
                              )}

                              {isDayValidated && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full border border-green-100">
                                  <CheckCircle2 size={14} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Validado</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-10">
                              {dayActivities
                                .filter(a => a.type !== 'operacao') // Hide operation blocks to avoid duplicity
                                .map((activity) => {
                                    // Find corresponding operation activity to include its tasks
                                    const opActivity = dayActivities.find(a => a.type === 'operacao');
                                    const opTasks = opActivity ? (filteredTasks || []).filter(t => t.milestoneId === opActivity.milestoneId) : [];
                                    const activityTasks = [...(filteredTasks || []).filter(t => t.milestoneId === activity.milestoneId), ...opTasks];
                                    
                                    const isLocked = isMilestoneLocked(activity);
                                    const isCompleted = activity.status === 'concluido';
                                    
                                    // Filter tasks for the current team if not management
                                  const visibleTasks = (isManagement 
                                    ? activityTasks 
                                    : activityTasks.filter(t => t.teamId === user.teamId)
                                  ).sort((a, b) => (a.displayIndex || 0) - (b.displayIndex || 0));

                                  if (visibleTasks.length === 0 && !isManagement) return null;

                                  return (
                                    <div key={activity.id} className="space-y-4">
                                      <div 
                                        onClick={() => setExpandedActivityId(expandedActivityId === activity.id ? null : activity.id)}
                                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className={`p-3 rounded-2xl transition-colors ${
                                            isCompleted ? 'bg-green-100 text-green-600' :
                                            isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                          }`}>
                                            {getTypeIcon(activity.type)}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h4 className="text-sm font-black uppercase text-[#003366] tracking-tight">
                                                {activity.description}
                                              </h4>
                                              <ChevronRight size={16} className={`text-slate-300 transition-transform ${expandedActivityId === activity.id ? 'rotate-90' : ''}`} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                              <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                <User size={10} /> {activity.foreman}
                                              </span>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          {isManagement && !isCompleted && (
                                            <Button
                                              variant="success"
                                              size="sm"
                                              disabled={!areAllTasksCompleted(activity.milestoneId)}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onFinalizeMacro(activity.id, user.uid);
                                              }}
                                              className={`text-[10px] font-black uppercase tracking-widest h-9 rounded-xl gap-2 px-4 transition-all ${
                                                areAllTasksCompleted(activity.milestoneId) 
                                                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' 
                                                  : 'bg-slate-100 text-slate-400'
                                              }`}
                                            >
                                              <Check size={16} />
                                              Finalizar Etapa
                                            </Button>
                                          )}
                                          <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            isCompleted ? 'bg-green-100 text-green-600' :
                                            isLocked ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                          }`}>
                                            {activity.status.replace('_', ' ')}
                                          </div>
                                        </div>
                                      </div>

                                      <AnimatePresence>
                                        {expandedActivityId === activity.id && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-6">
                                              {/* Team Progress Dashboard */}
                                              {showEvolutionBars && isManagement && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {(activity.assignedTeams || []).filter(tid => validTeams.includes(tid)).map(teamId => {
                                                  const team = filteredTeams.find(t => t.id === teamId);
                                                  const stats = getTeamProgress(activity, teamId);
                                                  const isSelected = drillDownTeamId === teamId;

                                                  return (
                                                    <div 
                                                      key={teamId}
                                                      onClick={() => setDrillDownTeamId(isSelected ? null : teamId)}
                                                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                                        isSelected ? 'bg-white border-blue-200 shadow-md ring-2 ring-blue-50' : 'bg-white border-slate-100 hover:border-blue-100'
                                                      }`}
                                                    >
                                                      <div className="flex justify-between items-start mb-3">
                                                        <div className="flex items-center gap-2">
                                                          <div className={`w-2 h-2 rounded-full ${
                                                            stats.status === 'concluido' ? 'bg-green-500' :
                                                            stats.status === 'em_andamento' ? 'bg-blue-500' : 'bg-slate-300'
                                                          }`} />
                                                          <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase text-[#003366] truncate max-w-[120px]">
                                                              {team?.name || teamId}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                              {isTeamAuthorized(teamId) && (
                                                                <span className="text-[7px] font-black text-green-600 uppercase bg-green-50 px-1 rounded">EM CAMPO</span>
                                                              )}
                                                              {isTeamWaitingAuthorization(teamId) && (
                                                                <span className="text-[7px] font-black text-orange-600 uppercase bg-orange-50 px-1 rounded">AGUARDANDO AUTORIZAÇÃO</span>
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400">
                                                          {stats.completed}/{stats.total}
                                                        </span>
                                                      </div>
                                                      
                                                      {showEvolutionBars && (
                                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                                                          <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${stats.progress}%` }}
                                                            className={`h-full transition-all ${
                                                              stats.status === 'concluido' ? 'bg-green-500' :
                                                              stats.status === 'em_andamento' ? 'bg-blue-500' : 'bg-slate-300'
                                                            }`}
                                                          />
                                                        </div>
                                                      )}

                                                      {/* SANEAMENTO RADICAL */}
                                                      <div className="mt-3 pt-3 border-t border-slate-50">
                                                        {isTeamAuthorized(teamId) ? (
                                                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100">
                                                            <ShieldCheck size={12} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">AUTORIZADO</span>
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100">
                                                            <Lock size={12} />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">BLOQUEADO</span>
                                                          </div>
                                                        )}
                                                      </div>
                                                      {showEvolutionBars && (
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[8px] font-bold text-slate-400 uppercase">Progresso</span>
                                                          <span className={`text-[10px] font-black ${
                                                            stats.status === 'concluido' ? 'text-green-600' :
                                                            stats.status === 'em_andamento' ? 'text-blue-600' : 'text-slate-400'
                                                          }`}>
                                                            {Math.round(stats.progress)}%
                                                          </span>
                                                        </div>
                                                      )}

                                                      {/* Drill-down: Equipment Tags */}
                                                      <AnimatePresence>
                                                        {isSelected && (
                                                          <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="mt-4 pt-4 border-t border-slate-50 space-y-2"
                                                          >
                                                            {stats.tasks.map(task => (
                                                              <div key={task.id} className="flex items-center justify-between text-[9px] font-bold">
                                                                <span className="text-slate-600">{task.assetTag}</span>
                                                                <span className={`uppercase ${
                                                                  task.status === 'concluido' ? 'text-green-600' :
                                                                  task.status === 'em_execucao' ? 'text-blue-600' : 'text-slate-400'
                                                                }`}>
                                                                  {task.status.replace('_', ' ')}
                                                                </span>
                                                              </div>
                                                            ))}
                                                          </motion.div>
                                                        )}
                                                      </AnimatePresence>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                              )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      {/* SANEAMENTO RADICAL: Barra de Bloqueios Removida conforme pedido */}
                                      {activity.type === 'manutencao' && (() => {
                                        const currentTeamId = user.teamId || '';
                                        const teamAuthorized = currentTeamId ? isTeamAuthorized(currentTeamId) : false;
                                        
                                        return (
                                          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between transition-all relative ${
                                            teamAuthorized ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                                          }`}>
                                            <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                teamAuthorized ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                              }`}>
                                                <Shield size={20} />
                                              </div>
                                              <div>
                                                <h5 className="text-[10px] font-black uppercase text-[#003366] tracking-tight">
                                                  Status de Liberação Técnica {currentTeamId && `- ${currentTeamId.replace(/EQUIPE_/i, 'EQ ')}`}
                                                </h5>
                                                <p className="text-[8px] font-bold text-slate-500 uppercase">
                                                  {teamAuthorized 
                                                    ? 'STATUS: LIBERADO PELO ENGENHEIRO' 
                                                    : 'STATUS: BLOQUEADO - AGUARDANDO LIBERAÇÃO TÉCNICA'}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                              {teamAuthorized && (
                                                <div className="flex items-center gap-2 text-green-600 bg-white px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                                                  <CheckCircle2 size={16} />
                                                  <span className="text-[10px] font-black uppercase tracking-widest">Liberado</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {visibleTasks.map((task) => {
                                          const pmoKey = task.pmo.replace(' ', '-');
                                          const pmoTemplate = PMO_TEMPLATES[pmoKey];
                                          const taskLocked = isMilestoneLocked(activity, task.teamId);
                                          return (
                                            <motion.div
                                              key={task.id}
                                              whileHover={{ y: -4 }}
                                              onClick={() => {
                                                // Display Mode: Se LIBERADO, o cadeado abre e o formulário fica disponível.
                                                if (taskLocked && !isManagement) {
                                                  toast.error('Aguardando Aterramento e Autorização');
                                                  return;
                                                }
                                                setSelectedTask(task);
                                              }}
                                              className={`group relative p-5 rounded-[24px] border transition-all cursor-pointer ${
                                                task.status === 'concluido' ? 'bg-green-50/30 border-green-100' :
                                                task.status === 'em_execucao' ? 'bg-blue-50/30 border-blue-100 shadow-md shadow-blue-100/50' :
                                                'bg-white border-slate-100 hover:border-blue-200 shadow-sm'
                                              }`}
                                            >
                                              <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl ${
                                                  task.status === 'concluido' ? 'bg-green-100 text-green-600' :
                                                  task.status === 'em_execucao' ? 'bg-blue-100 text-blue-600' :
                                                  'bg-slate-100 text-slate-400'
                                                }`}>
                                                  {taskLocked ? <Lock size={20} /> : <Zap size={20} />}
                                                </div>
                                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                  task.status === 'concluido' ? 'bg-green-100 text-green-600' :
                                                  task.status === 'em_execucao' ? 'bg-blue-100 text-blue-600' :
                                                  'bg-slate-100 text-slate-400'
                                                }`}>
                                                  {task.status.replace('_', ' ')}
                                                </div>
                                              </div>

                                              <h4 className="text-lg font-black text-[#003366] uppercase tracking-tighter mb-1">
                                                {task.assetTag}
                                              </h4>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase truncate mb-4">
                                                {task.pmo.replace('-', ' ')} - {pmoTemplate?.title || task.pmo}
                                              </p>

                                              {/* Quick Grounding Confirmation for Technicians - REMOVIDO CONFORME PEDIDO */}
                                              
                                              {/* Mensagem removida para permitir abertura imediata conforme pedido */}
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#001a33]/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-slate-50/50">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 flex items-center gap-2 group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Fechar</span>
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const activity = activities.find(a => a.milestoneId === selectedTask.milestoneId);
                  const isAuthorized = isTeamAuthorized(selectedTask.teamId);
                  
                  const pmoKey = selectedTask.pmo.replace(' ', '-');
                  // REESTRUTURAÇÃO: O preenchimento das PMOs deve ser habilitado APENAS quando o status for 'EM CAMPO'
                  const readOnly = (!isAuthorized && !isDeveloper) || (!isManagement && selectedTask.teamId !== user.teamId);

                  return PMO_TEMPLATES[pmoKey] ? (
                    <PMOForm 
                      task={selectedTask} 
                      userId={user.uid} 
                      onClose={() => setSelectedTask(null)} 
                      readOnly={readOnly}
                      isManagement={isManagement}
                    />
                  ) : (
                    <ChecklistForm 
                      task={selectedTask} 
                      userId={user.uid}
                      groundingPoints={grounding}
                      onUpdateGrounding={onUpdateGrounding}
                      onSubmit={async (data) => {
                        try {
                          await onUpdateTask(selectedTask.id, data);
                          if (data.status === 'concluido') {
                            toast.success('Checklist finalizado com sucesso!');
                            setSelectedTask(null);
                          } else {
                            toast.success('Rascunho salvo com sucesso!');
                          }
                        } catch (error) {
                          toast.error('Erro ao salvar checklist.');
                        }
                      }}
                      readOnly={readOnly}
                      isManagement={isManagement}
                    />
                  );
                })()}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
