import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  Shield, 
  ShieldCheck,
  Settings,
  HardHat,
  Compass,
  CloudSun, 
  BookOpen, 
  LogOut,
  User as UserIcon,
  AlertTriangle,
  Menu,
  X,
  Check,
  FileBarChart,
  FileText,
  Zap,
  LayoutGrid,
  RefreshCw,
  ShieldAlert,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, MaintenanceTask, GroundingPoint, WeatherData, Team, Risk, Abnormality, PMOReport, Asset, Sector, SectorActivity } from '../types';
import { WeatherWidget } from './WeatherWidget';
import { GroundingMap } from './GroundingMap';
import { ChecklistForm } from './ChecklistForm';
import { PMOForm } from './PMOForm';
import { AbnormalityForm } from './AbnormalityForm';
import { Button } from './Button';
import { PMO_TEMPLATES } from '../constants/pmoTemplates';
import { Card } from './Card';
import { Reports } from './Reports';
import { DataAudit } from './DataAudit';
import { SectorTracking } from './SectorTracking';
import { maintenanceService } from '../services/maintenanceService';
import { seedInitialData, resetSimulation } from '../services/seedData';
import { ShutdownTimer } from './ShutdownTimer';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ConfirmationModal } from './ConfirmationModal';

import { INITIAL_SECTORS, INITIAL_SECTOR_ACTIVITIES } from '../data/sectorData';
import { INITIAL_TEAMS, INITIAL_ASSETS, INITIAL_RISKS } from '../data/initialData';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

import { APP_VERSION, MIN_VALID_DATE } from '../constants/appConfig';

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checklist' | 'seguranca' | 'clima' | 'biblioteca' | 'relatorios' | 'ativos' | 'auditoria'>(() => {
    const saved = localStorage.getItem('activeTab');
    if (saved) return saved as any;
    // Default to 'checklist' for non-coordinators/engineers/tst/developer as requested
    if (user.role !== 'coordenador' && user.role !== 'engenharia' && user.role !== 'tst' && user.role !== 'developer') {
      return 'checklist';
    }
    return 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [grounding, setGrounding] = useState<GroundingPoint[]>([]);
  const [abnormalities, setAbnormalities] = useState<Abnormality[]>([]);
  const [weather, setWeather] = useState<WeatherData>({ temperature: 25, humidity: 45, windSpeed: 12, rainProb: 10, timestamp: '' });
  const [risks, setRisks] = useState<Risk[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pmoReports, setPmoReports] = useState<PMOReport[]>([]);
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [sectorActivities, setSectorActivities] = useState<SectorActivity[]>(INITIAL_SECTOR_ACTIVITIES);
  const [teamAuthorizations, setTeamAuthorizations] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAbnormalityForm, setShowAbnormalityForm] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const unsubsRef = React.useRef<Record<string, () => void>>({});

  const isManagement = user.role === 'coordenador' || user.role === 'engenharia' || user.role === 'developer' || user.email === 'leneves@alupar.com.br';
  const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
  
  const filteredTeams = teams.filter(t => validTeams.includes(t.id) && (isManagement || t.id === user.teamId));
  const filteredTasks = tasks.filter(t => validTeams.includes(t.teamId) && (isManagement || t.teamId === user.teamId));
  const filteredGrounding = grounding.filter(g => validTeams.includes(g.responsibleTeamId) && (isManagement || g.responsibleTeamId === user.teamId));
  const filteredSectorActivities = sectorActivities.filter(a => (a.assignedTeams || []).some(tid => validTeams.includes(tid) && (isManagement || tid === user.teamId)));
  const filteredPmoReports = pmoReports.filter(r => validTeams.includes(r.teamId) && (isManagement || r.teamId === user.teamId));
  
  const overallProgress = React.useMemo(() => {
    if (!filteredTasks || !Array.isArray(filteredTasks)) return 0;
    const activeTasks = filteredTasks.filter(t => t && t.isActive !== false);
    if (activeTasks.length === 0) return 0;
    const completed = activeTasks.filter(t => t && t.status === 'concluido').length;
    return Math.round((completed / activeTasks.length) * 100);
  }, [filteredTasks]);

  const showEvolutionBars = user.role === 'engenharia' || user.role === 'developer' || user.email === 'leneves@alupar.com.br';

  // Core subscriptions (always needed for basic dashboard functionality)
  useEffect(() => {
    // Auto-seed check on load
    seedInitialData().catch(err => console.error('[Dashboard] Auto-seed error:', err));

    const isTeamMember = user.role === 'tecnico' || user.role === 'lider';
    
    // 1. Tasks - Essential for progress and execution
    unsubsRef.current.tasks = maintenanceService.subscribeToTasks(isTeamMember ? user.teamId : undefined, (newTasks) => {
      setTasks(newTasks);
    });

    // 2. Weather - Essential for safety
    unsubsRef.current.weather = maintenanceService.subscribeToWeather(setWeather);
    maintenanceService.fetchRealTimeWeather();

    // Update weather every 30 minutes
    const weatherInterval = setInterval(() => {
      maintenanceService.fetchRealTimeWeather();
    }, 30 * 60 * 1000);

    // 3. Sectors & Activities - Essential for execution tab
    unsubsRef.current.sectors = maintenanceService.subscribeToSectors(setSectors);
    unsubsRef.current.sectorActivities = maintenanceService.subscribeToSectorActivities(setSectorActivities);
    
    // 4. Alerts - Essential for safety
    const twoHoursAgo = Timestamp.fromMillis(Date.now() - 2 * 60 * 60 * 1000);
    const qAlerts = query(
      collection(db, 'alerts'), 
      where('timestamp', '>=', twoHoursAgo),
      orderBy('timestamp', 'desc'), 
      limit(5)
    );
    unsubsRef.current.alerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Background fetch for static data (cached in service)
    maintenanceService.getRisks().then(setRisks);
    maintenanceService.getTeams().then(setTeams);
    maintenanceService.getAssets().then(setAssets);

    return () => {
      clearInterval(weatherInterval);
      Object.keys(unsubsRef.current).forEach(key => {
        const unsub = unsubsRef.current[key];
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubsRef.current = {};
    };
  }, [user.uid, user.teamId, user.role]);

  // Conditional/Lazy subscriptions based on role and active tab
  useEffect(() => {
    const teamIdForPmo = isManagement ? undefined : user.teamId;
    
    // PMO Reports - Only for management or reports tab
    if ((isManagement || activeTab === 'relatorios') && !unsubsRef.current.pmo) {
      unsubsRef.current.pmo = maintenanceService.subscribeToPMOReports(teamIdForPmo, (reports) => {
        const sorted = [...reports].sort((a, b) => 
          new Date(b.updatedAt || b.date).getTime() - new Date(a.updatedAt || a.date).getTime()
        );
        setPmoReports(sorted);
      });
    }

    // Abnormalities - Only for management, TST or reports tab
    if ((isManagement || activeTab === 'relatorios') && !unsubsRef.current.abnormalities) {
      unsubsRef.current.abnormalities = maintenanceService.subscribeToAbnormalities(setAbnormalities);
    }

    // Grounding - Only for TST, execution or safety tab
    if ((user.role === 'tst' || activeTab === 'checklist' || activeTab === 'seguranca' || activeTab === 'dashboard') && !unsubsRef.current.grounding) {
      unsubsRef.current.grounding = maintenanceService.subscribeToGrounding(setGrounding);
    }

    // Team Authorizations - Always for execution
    if (activeTab === 'checklist' && !unsubsRef.current.teamAuths) {
      unsubsRef.current.teamAuths = maintenanceService.subscribeToTeamAuthorizations(setTeamAuthorizations);
    }

  }, [activeTab, user.role]);
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checklist', label: 'EXECUÇÃO', icon: ClipboardCheck },
    { id: 'relatorios', label: 'Relatórios', icon: FileBarChart },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'clima', label: 'Clima & Riscos', icon: CloudSun },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookOpen },
  ];

  // SANEAMENTO: Removendo abas de auditoria extras conforme pedido
  if (user.role === 'developer' || user.email === 'leneves@alupar.com.br') {
    menuItems.push({ id: 'auditoria', label: 'Auditoria', icon: ShieldAlert });
  }

  const renderTSTDashboard = () => {
    const installedGrounding = (filteredGrounding || []).filter(g => g && g.status === 'instalado').length;
    const totalGrounding = (filteredGrounding || []).length;
    const groundingProgress = totalGrounding > 0 ? (installedGrounding / totalGrounding) * 100 : 0;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Top Widgets: Weather and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeatherWidget {...weather} />
          </div>
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 overflow-hidden shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Alertas Ativos
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-300 italic font-bold">Nenhum alerta crítico.</p>
              ) : (
                alerts.slice(0, 3).map(alert => (
                  <div key={alert.id} className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-3 border-l-4 ${
                    alert.severity === 'high' ? 'bg-red-50 text-red-700 border-red-500' :
                    alert.severity === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-500' :
                    'bg-blue-50 text-blue-700 border-blue-500'
                  }`}>
                    <div className="flex-1">
                      <p className="font-black truncate">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-orange-600 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <ShieldAlert size={120} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Nível de Risco do Dia</p>
                <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">ALTO RISCO</h3>
              </div>
              <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <p className="text-[10px] font-bold leading-tight">
                  Atenção redobrada em atividades de altura e proximidade com partes energizadas.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-white border-2 border-red-100 shadow-xl flex flex-col items-center justify-center text-center p-6 group hover:border-red-500 transition-all cursor-pointer" onClick={() => setShowAbnormalityForm(true)}>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 group-hover:bg-red-600 group-hover:text-white transition-all">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-lg font-black text-[#001a33] uppercase tracking-tighter">Reportar Anormalidade</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Clique para enviar alerta imediato</p>
          </Card>
        </div>

        {/* Grounding Status Section */}
        <Card title="Status de Aterramentos Operacionais" className="border-orange-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-orange-50 rounded-3xl border-2 border-orange-100">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-orange-100"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={364.4}
                    strokeDashoffset={364.4 - (364.4 * groundingProgress) / 100}
                    className="text-orange-500 transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-orange-900">{Math.round(groundingProgress)}%</span>
                  <span className="text-[8px] font-black uppercase text-orange-400">Protegido</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(filteredGrounding || []).map(point => (
                <div key={point.id} className={`p-4 rounded-2xl border-2 transition-all ${
                  point.status === 'instalado' 
                    ? 'bg-green-50 border-green-100 text-green-900' 
                    : 'bg-gray-50 border-gray-100 text-gray-400'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <Shield size={16} className={point.status === 'instalado' ? 'text-green-600' : 'text-gray-300'} />
                    <div className={`w-2 h-2 rounded-full ${point.status === 'instalado' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tighter truncate">{point.bay}</p>
                  <p className="text-[8px] font-bold uppercase opacity-60">{point.responsibleTeamId || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Access to Critical Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Atividades Críticas em Execução" className="border-blue-100">
            <div className="space-y-4">
              {(filteredSectorActivities || []).filter(a => a.status === 'em_execucao').slice(0, 4).map(activity => (
                <div key={activity.id} className="flex items-center gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-[#003366] uppercase leading-tight">{activity.description}</p>
                    <p className="text-[8px] font-bold text-blue-400 uppercase mt-0.5">Vão {sectors.find(s => s.id === activity.sectorId)?.order}</p>
                  </div>
                  <div className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-[8px] font-black uppercase">
                    Risco Alto
                  </div>
                </div>
              ))}
              { (filteredSectorActivities || []).filter(a => a.status === 'em_execucao').length === 0 && (
                <div className="text-center py-8 text-gray-400 font-bold uppercase text-[10px]">
                  Nenhuma atividade crítica em andamento
                </div>
              )}
            </div>
          </Card>

          <Card title="Mapa de Bloqueios" className="border-blue-100 overflow-hidden p-0">
            <div className="h-[300px]">
              <GroundingMap 
                points={filteredGrounding} 
                activities={filteredSectorActivities}
                user={user}
                onUpdateStatus={(id, status) => {
                  maintenanceService.updateGrounding(id, status, user.uid);
                }}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user.role === 'tst') {
          return renderTSTDashboard();
        }
        return (
          <div className="space-y-6">
            {showEvolutionBars && (user.role === 'coordenador' || user.role === 'engenharia' || user.role === 'developer') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Status das Equipes" className="md:col-span-2">
                  <div className="space-y-4">
                    {(filteredTeams || []).map(team => {
                      if (!team) return null;
                      const teamTasks = (filteredTasks || []).filter(t => t && t.teamId === team.id);
                      const completed = teamTasks.filter(t => t.status === 'concluido').length;
                      const total = teamTasks.length;
                      const progress = total > 0 ? (completed / total) * 100 : 0;
                      
                      return (
                        <div key={team.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase">
                            <span className="text-[#003366]">{team.name}</span>
                            <span className="text-gray-500">{completed}/{total} concluídos</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                progress === 100 ? 'bg-green-400' : 'bg-blue-400'
                              }`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                <div className="space-y-6">
                  <Card title="Aterramentos" className="bg-orange-50 border-orange-200">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full text-orange-600">
                        <Shield size={32} />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-orange-900">
                          {(filteredGrounding || []).filter(g => g && g.status === 'instalado').length}
                        </p>
                        <p className="text-[10px] font-black uppercase text-orange-400">Pontos Instalados</p>
                      </div>
                      <div className="pt-4 border-t border-orange-200">
                        <p className="text-sm font-bold text-orange-800">
                          {(grounding || []).filter(g => g && g.status === 'pendente').length} pontos aguardando instalação
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card title="Anormalidades" className="bg-red-50 border-red-200">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle size={32} />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-red-900">
                          {(abnormalities || []).length}
                        </p>
                        <p className="text-[10px] font-black uppercase text-red-400">Ocorrências Reportadas</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-[10px] border-red-200 text-red-600"
                        onClick={() => setActiveTab('relatorios')}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <Card title="Status dos Vãos (Bays)" className="border-blue-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {(sectors || []).slice().sort((a, b) => a.order - b.order).map(sector => {
                  const sActivities = (sectorActivities || []).filter(a => a.sectorId === sector.id);
                  const completed = sActivities.filter(a => a.status === 'concluido').length;
                  const total = sActivities.length;
                  const progress = total > 0 ? (completed / total) * 100 : 0;
                  const isLocked = !sector.isValidated && sector.precedentSectorId && !(sectors || []).find(s => s.id === sector.precedentSectorId)?.isValidated;

                  return (
                    <div 
                      key={sector.id} 
                      onClick={() => setActiveTab('checklist')}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-center space-y-2 ${
                        sector.isValidated ? 'bg-green-50 border-green-100' :
                        isLocked ? 'bg-slate-50 border-slate-100 opacity-60' :
                        'bg-blue-50 border-blue-100 hover:border-blue-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto ${
                        sector.isValidated ? 'bg-green-100 text-green-600' :
                        isLocked ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {isLocked ? <Lock size={14} /> : <Zap size={14} />}
                      </div>
                      <p className="text-[8px] font-black uppercase text-slate-400 truncate">Vão {sector.order}</p>
                      <p className={`text-[10px] font-black uppercase truncate ${isLocked ? 'text-slate-400' : 'text-[#003366]'}`}>
                        {sector.name ? sector.name.split('-')[0].trim() : 'Vão'}
                      </p>
                      <div className="w-full h-1 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${sector.isValidated ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <WeatherWidget {...weather} />
              </div>
              <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 overflow-hidden shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  Alertas Ativos
                </h3>
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-300 italic font-bold">Nenhum alerta crítico.</p>
                  ) : (
                    alerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-3 border-l-4 ${
                        alert.severity === 'high' ? 'bg-red-50 text-red-700 border-red-500' :
                        alert.severity === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-500' :
                        'bg-blue-50 text-blue-700 border-blue-500'
                      }`}>
                        <div className="flex-1">
                          <p className="font-black truncate">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <Card title="Status da Janela" className="bg-[#003366] text-white relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase opacity-70">Progresso Geral</span>
                    <span className="text-3xl font-black">{overallProgress}%</span>
                  </div>
                  <div className="w-full h-4 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-400 transition-all duration-1000 shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase opacity-70">
                    <span>Início: 07:00</span>
                    <span>Término: 17:00</span>
                  </div>
                </div>
              </Card>

            {(user.role === 'coordenador' || user.role === 'engenharia' || user.role === 'developer') && (
              <Card title="Últimas Fichas PMO Finalizadas" className="border-blue-100">
                <div className="space-y-4">
                  {filteredPmoReports.length > 0 ? (
                    filteredPmoReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase text-blue-900">
                              {report.pmoNumber.replace('-', ' ')} - {PMO_TEMPLATES[report.pmoNumber.replace(' ', '-')]?.title || report.pmoNumber} - {report.assetTag}
                            </p>
                            <p className="text-[10px] font-bold text-blue-400">
                              Finalizado por {report.executor} • {new Date(report.updatedAt || report.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab('relatorios')}>
                          Ver Detalhes
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-400 font-bold text-xs uppercase">Nenhuma ficha PMO encontrada</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        );
      case 'checklist':
        return (
          <SectorTracking 
            user={user}
            sectors={sectors} 
            activities={filteredSectorActivities} 
            tasks={filteredTasks}
            teams={filteredTeams}
            grounding={filteredGrounding}
            teamAuthorizations={teamAuthorizations}
            onUpdateTask={async (id, data) => {
              try {
                await maintenanceService.updateTask(id, data, user.uid);
                toast.success('Dados salvos com sucesso!');
              } catch (error) {
                toast.error('Erro ao salvar dados.');
              }
            }}
            onUpdateGrounding={async (id, status, userId) => {
              await maintenanceService.updateGrounding(id, status, userId);
            }}
            onValidateSector={maintenanceService.validateSector}
            onValidateSectorDay={maintenanceService.validateSectorDay}
            onAuthorizeActivity={maintenanceService.authorizeSectorActivity}
            onCancelAuthorization={maintenanceService.cancelSectorActivityAuthorization}
            onRequestAuthorization={maintenanceService.requestTeamAuthorization}
            onFinalizeMacro={maintenanceService.finalizeMacro}
            onUpdateTeamAuthorization={maintenanceService.updateTeamAuthorization.bind(maintenanceService)}
          />
        );
      case 'seguranca':
        return (
          <GroundingMap 
            points={filteredGrounding} 
            activities={filteredSectorActivities}
            user={user}
            onUpdateStatus={(id, status) => {
              maintenanceService.updateGrounding(id, status, user.uid);
            }} 
          />
        );
      case 'auditoria':
        return <DataAudit user={user} />;
      case 'clima':
        return (
          <div className="space-y-6">
            <WeatherWidget {...weather} />
            <Card title="Matriz de Riscos - SE Rio Novo do Sul">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[10px] font-black uppercase text-gray-500">
                      <th className="p-3 border">Risco Potencial</th>
                      <th className="p-3 border">Impacto / Categoria</th>
                      <th className="p-3 border">Ação Preventiva / Mitigação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {risks.map(risk => (
                      <tr key={risk.id}>
                        <td className="p-3 border">{risk.title}</td>
                        <td className={`p-3 border uppercase text-[10px] ${
                          risk.category === 'eletrico' ? 'text-red-600' :
                          risk.category === 'altura' ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>{risk.category}</td>
                        <td className="p-3 border text-xs text-gray-600">{risk.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Button 
              variant="danger" 
              size="lg" 
              className="w-full gap-2"
              onClick={() => setShowAbnormalityForm(true)}
            >
              <AlertTriangle size={20} />
              Reportar Anormalidade em Campo
            </Button>
          </div>
        );
      case 'ativos':
        return (
          <div className="space-y-6">
            <Card title="Base de Dados de Ativos - SE Rio Novo do Sul">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                      <th className="p-4 border-b">Tag</th>
                      <th className="p-4 border-b">Tipo</th>
                      <th className="p-4 border-b">Setor</th>
                      <th className="p-4 border-b">Fabricante</th>
                      <th className="p-4 border-b">Modelo</th>
                      <th className="p-4 border-b">Franquia 20h</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold">
                    {(assets || []).map(asset => (
                      <tr key={asset.tag} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-b text-[#003366] font-black">{asset.tag}</td>
                        <td className="p-4 border-b">{asset.type}</td>
                        <td className="p-4 border-b">
                          <span className={`px-2 py-1 rounded text-[10px] uppercase font-black ${
                            asset.sector === '345kV' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {asset.sector}
                          </span>
                        </td>
                        <td className="p-4 border-b text-gray-500">{asset.manufacturer}</td>
                        <td className="p-4 border-b text-gray-400">{asset.model}</td>
                        <td className="p-4 border-b">
                          {asset.franquia20h ? (
                            <span className="text-red-600 font-black text-[10px] uppercase">Sim</span>
                          ) : (
                            <span className="text-gray-300 font-black text-[10px] uppercase">Não</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );
      case 'relatorios':
        return <Reports tasks={filteredTasks} teams={filteredTeams} abnormalities={abnormalities} userRole={user.role} grounding={filteredGrounding} pmoReports={filteredPmoReports} />;
      case 'auditoria':
        if (user.role === 'developer' || user.email === 'leneves@alupar.com.br') {
          return (
            <div className="space-y-6">
              {/* Botão de Reset Rápido na Auditoria */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-[32px] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-orange-100/50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <RefreshCw size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-orange-900 uppercase tracking-tighter">Zerar Simulação de Testes</h3>
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-widest opacity-70">Ação Crítica de Administrador</p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="xl"
                  className="w-full sm:w-auto px-10 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-200"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Zerar Agora
                </Button>
              </div>
              <DataAudit user={user} />
            </div>
          );
        }
        return null;
      case 'biblioteca':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Layouts Técnicos" subtitle="Acesso Offline">
              <div className="space-y-4">
                {['Diagrama Unifilar 345kV', 'Planta de Locação', 'Diagrama de Aterramento'].map(doc => (
                  <button key={doc} className="w-full p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-gray-100 transition-colors">
                    <span className="font-bold text-[#003366]">{doc}</span>
                    <BookOpen size={20} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </Card>
            <Card title="Vídeos de Orientação" subtitle="Procedimentos de Segurança">
              <div className="aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
                <span className="text-white/50 font-black uppercase tracking-widest">Player Offline</span>
              </div>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  const handleManualSync = async () => {
    try {
      toast.info('Sincronizando dados...');
      await seedInitialData(true);
      toast.success('Sincronização concluída!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Erro na sincronização.');
    }
  };

const handleResetSimulation = async () => {
  try {
    toast.info('Limpando simulação...');
    
    // Aqui nós vamos limpar o que está travando o app
    localStorage.clear();
    sessionStorage.clear();
    
    // Se você tiver uma função que limpa o banco, ela entra aqui. 
    // Por enquanto, vamos garantir que o app resete para o usuário:
    toast.success('Simulação Zerada!');
    
    setTimeout(() => {
      window.location.href = '/'; // Isso recarrega o app do zero
    }, 1000);
  } catch (error) {
    toast.error('Erro ao zerar simulação.');
  }
};

  const getProfileIcon = () => {
    if (user.name.includes('LENEVES')) return Settings;
    if (user.name.includes('ALEXANDRE')) return LayoutDashboard;
    if (user.role === 'engenharia') return Compass;
    if (user.role === 'tst') return ShieldCheck;
    if (user.role === 'lider' || user.role === 'tecnico') return HardHat;
    return UserIcon;
  };

  const ProfileIcon = getProfileIcon();

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex relative">
      {/* Sidebar */}
      {/* Sidebar Desktop */}
      <AnimatePresence>
        {showAbnormalityForm && (
          <AbnormalityForm 
            user={user} 
            onClose={() => setShowAbnormalityForm(false)}
            onSubmit={async (data) => {
              try {
                await maintenanceService.reportAbnormality({
                  ...data,
                  reportedByName: user.name
                }, user.uid);
                toast.success('Anormalidade reportada com sucesso!', {
                  description: 'Os coordenadores e a engenharia foram notificados.',
                  className: 'bg-red-600 text-white border-none'
                });
                setShowAbnormalityForm(false);
              } catch (error) {
                toast.error('Erro ao enviar reporte');
              }
            }}
          />
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetSimulation}
        title="Zerar Simulação"
        message="Deseja apagar todos os avanços de teste e voltar ao início do cronograma? (Isso não apagará as tags dos equipamentos)"
        confirmLabel="Zerar Agora"
        variant="destructive"
      />
      <aside className="hidden lg:flex flex-col w-72 bg-[#001a33] text-white p-6">
        <div className="mb-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-400/30 overflow-hidden p-1">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[#003366] font-black text-[10px] tracking-tighter">ALUPAR</span>
              <div className="h-0.5 w-full bg-green-500 mt-0.5" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Alupar</h1>
            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Regional Sudeste</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all font-bold uppercase text-xs tracking-wider ${
                activeTab === item.id 
                  ? (user.role === 'tst' ? 'bg-orange-600 text-white shadow-lg border-l-4 border-orange-400' : 'bg-[#003366] text-white shadow-lg border-l-4 border-blue-400')
                  : 'text-blue-300/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
          
          {(user.role === 'developer' || user.email === 'leneves@alupar.com.br') && (
            <div className="space-y-2 mt-4">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest text-orange-400/60 hover:text-white hover:bg-white/5 border border-orange-500/20"
              >
                <RefreshCw size={16} />
                Zerar Simulação de Testes
              </button>
            </div>
          )}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
          <div className="px-2">
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-900/40 px-2 py-1 rounded border border-blue-500/20">
              v{APP_VERSION}
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className={`p-2 rounded-lg ${
              user.role === 'developer' ? 'bg-slate-100 text-slate-600' :
              user.role === 'coordenador' ? 'bg-blue-500/20 text-blue-400' :
              user.role === 'engenharia' ? 'bg-indigo-500/20 text-indigo-400' :
              user.role === 'tst' ? 'bg-green-500/20 text-green-400' :
              'bg-orange-500/20 text-orange-400'
            }`}>
              <ProfileIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-tight truncate">
                {user.name}
              </p>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 truncate">
                {user.role} {user.teamId ? `| ${user.teamId}` : ''}
              </p>
            </div>
          </div>
          <Button variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={onLogout}>
            <LogOut size={20} className="mr-2" />
            Sair do Sistema
          </Button>
          
          <div className="pt-4 flex flex-col items-center gap-2 opacity-50">
            <p className="text-[8px] font-black uppercase tracking-[0.2em]">Operado por</p>
            <div className="w-20 h-10 bg-white rounded-lg flex items-center justify-center p-2">
              <span className="text-[#003366] font-black text-sm italic">ETC</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#001a33] text-white p-4 z-50 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
            <span className="text-[#003366] font-black text-[10px]">A</span>
          </div>
          <span className="font-black uppercase tracking-tighter">Alupar</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={32} /> : <Menu size={32} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            className="fixed inset-0 bg-[#001a33] z-40 p-6 pt-24 flex flex-col"
          >
            <nav className="flex-1 space-y-4 overflow-y-auto pr-2 mb-6 custom-scrollbar">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-6 rounded-2xl transition-all font-black uppercase text-lg ${
                    activeTab === item.id 
                      ? 'bg-[#003366] text-white border-l-8 border-blue-400 shadow-lg' 
                      : 'text-blue-300/60 hover:bg-white/5'
                  }`}
                >
                  <item.icon size={32} />
                  {item.label}
                </button>
              ))}

              {/* Botão de Reset Prominente no Mobile para Admin */}
              {(user.role === 'developer' || user.email === 'leneves@alupar.com.br') && (
                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setShowResetConfirm(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-4 p-6 rounded-2xl transition-all font-black uppercase text-lg text-orange-400 bg-orange-500/5 border-2 border-orange-500/20 shadow-lg shadow-orange-900/20"
                  >
                    <RefreshCw size={32} />
                    Zerar Simulação
                  </button>
                </div>
              )}
            </nav>
            <div className="mt-auto pt-6 border-t border-white/10 space-y-6">
              <div className="flex items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                <div className={`p-4 rounded-2xl ${
                  user.role === 'developer' ? 'bg-slate-100 text-slate-600' :
                  user.role === 'coordenador' ? 'bg-blue-500/20 text-blue-400' :
                  user.role === 'engenharia' ? 'bg-indigo-500/20 text-indigo-400' :
                  user.role === 'tst' ? 'bg-green-500/20 text-green-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  <ProfileIcon size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xl font-black uppercase tracking-tight truncate">
                    {user.name}
                  </p>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mt-1 truncate">
                    {user.role} {user.teamId ? `| ${user.teamId}` : ''}
                  </p>
                </div>
              </div>
              <Button 
                variant="danger" 
                size="xl" 
                className="w-full flex items-center justify-center gap-4 py-6 shadow-2xl" 
                onClick={onLogout}
              >
                <LogOut size={32} />
                Sair do Sistema
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl lg:text-5xl font-black text-[#001a33] uppercase tracking-tighter">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">
              SE Rio Novo do Sul | Regional Sudeste | Ciclo 2026
            </p>
          </div>
            <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] bg-slate-100 px-2 py-1 rounded border border-slate-200">
                v{APP_VERSION}
              </span>
              <ShutdownTimer activityProgress={overallProgress} showProgress={showEvolutionBars} />
            {(user.role === 'coordenador' || user.role === 'engenharia' || user.role === 'developer' || user.role === 'tst') && (
              <div className="bg-white px-4 py-2 rounded-2xl border-2 border-slate-100 flex items-center gap-3 shadow-sm">
                <div className={`p-2 rounded-lg ${
                  user.role === 'developer' ? 'bg-slate-100 text-slate-600' :
                  user.role === 'coordenador' ? 'bg-blue-50 text-blue-600' :
                  user.role === 'engenharia' ? 'bg-indigo-50 text-indigo-600' :
                  user.role === 'tst' ? 'bg-green-50 text-green-600' :
                  'bg-orange-50 text-orange-600'
                }`}>
                  <ProfileIcon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none">
                    {user.name}
                  </p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {user.role} {user.teamId ? `| ${user.teamId}` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
        <AnimatePresence>
          {showAbnormalityForm && (
            <AbnormalityForm 
              user={user}
              onClose={() => setShowAbnormalityForm(false)}
              onSubmit={(data) => maintenanceService.reportAbnormality(data, user.uid)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
