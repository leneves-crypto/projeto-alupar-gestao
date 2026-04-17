import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, AlertCircle, List, LayoutGrid, Filter, Check, X, Shield, Lock } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { GroundingPoint, GroundingStatus, SectorActivity, UserProfile } from '../types';

interface GroundingMapProps {
  points: GroundingPoint[];
  onUpdateStatus: (id: string, status: GroundingStatus) => void;
  activities?: SectorActivity[];
  user: UserProfile;
}

export const GroundingMap: React.FC<GroundingMapProps> = ({ points, onUpdateStatus, activities = [], user }) => {
  const [selectedBay, setSelectedBay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusFilter, setStatusFilter] = useState<GroundingStatus | 'all'>('all');
  const [confirming, setConfirming] = useState<{ id: string; status: GroundingStatus; description: string } | null>(null);

  if (!user) return null;

  const bays = Array.from(new Set((points || []).map(p => p.bay))).sort();
  
  // Filter points based on user team if they are a leader
  const filteredPoints = (points || []).filter(p => {
    const bayMatch = !selectedBay || p.bay === selectedBay;
    const statusMatch = statusFilter === 'all' || p.status === statusFilter;
    
    // Visibility rule: Leaders only see their assigned points
    if (user.role === 'lider') {
      return bayMatch && statusMatch && p.responsibleTeamId === user.teamId;
    }
    
    return bayMatch && statusMatch;
  });
  
  const activeActivities = (activities || []).filter(a => 
    a && a.status === 'em_execucao' && (selectedBay ? a.equipment.includes(selectedBay) : true)
  );

  // Master Safety Indicator Logic
  const bloqueioPoints = (points || []).filter(p => p.type === 'bloqueio');
  const aterramentoPoints = (points || []).filter(p => p.type === 'aterramento');
  
  const bloqueiosOk = bloqueioPoints.length === 0 || bloqueioPoints.every(p => p.status === 'instalado');
  const aterramentosOk = aterramentoPoints.length === 0 || aterramentoPoints.every(p => p.status === 'instalado');
  const isSafetyGreen = (bloqueioPoints.length > 0 || aterramentoPoints.length > 0) && bloqueiosOk && aterramentosOk;

  // Energization Authorization Logic
  const allPointsRetirado = (points || []).length > 0 && (points || []).every(p => p.status === 'retirado');

  return (
    <div className="space-y-4">
      {/* Master Safety Indicator - Coordinator Only or Global? User said "No dashboard do coordenador" */}
      {(user.role === 'coordenador' || user.role === 'engenharia' || user.role === 'developer') && (
        <Card className={`border-2 transition-all ${isSafetyGreen ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                isSafetyGreen ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}>
                <Shield size={24} className={isSafetyGreen ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 className={`text-lg font-black uppercase ${isSafetyGreen ? 'text-green-900' : 'text-red-900'}`}>
                  Status de Segurança do Vão
                </h3>
                <p className={`text-xs font-bold uppercase ${isSafetyGreen ? 'text-green-700' : 'text-red-700'}`}>
                  {isSafetyGreen ? 'Vão Liberado para Execução' : 'Aguardando Instalação de Aterramentos'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Progresso Total</div>
              <div className="text-2xl font-black text-[#003366]">
                {(points || []).filter(p => p.status === 'instalado').length} / {(points || []).length}
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {bloqueioPoints.length > 0 && (
              <div className={`p-2 rounded-lg border ${bloqueiosOk ? 'bg-green-100 border-green-200' : 'bg-white border-gray-200'}`}>
                <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Bloqueios Operacionais</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{bloqueioPoints.filter(p => p.status === 'instalado').length}/{bloqueioPoints.length}</span>
                  {bloqueiosOk && <Check size={12} className="text-green-600" />}
                </div>
              </div>
            )}
            <div className={`p-2 rounded-lg border ${aterramentosOk ? 'bg-green-100 border-green-200' : 'bg-white border-gray-200'} ${bloqueioPoints.length === 0 ? 'col-span-2' : ''}`}>
              <p className="text-[8px] font-black uppercase text-gray-500 mb-1">Aterramentos Técnicos (Equipes 1 a 5)</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{aterramentoPoints.filter(p => p.status === 'instalado').length}/{aterramentoPoints.length}</span>
                {aterramentosOk && <Check size={12} className="text-green-600" />}
              </div>
            </div>
          </div>

          {(user.role === 'engenharia' || user.role === 'developer') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button 
                variant={allPointsRetirado ? 'success' : 'outline'} 
                className="w-full gap-2"
                disabled={!allPointsRetirado}
              >
                <ShieldCheck size={20} />
                Autorizar Energização do Vão
              </Button>
              {!allPointsRetirado && (
                <p className="text-[8px] text-center mt-2 font-bold text-red-500 uppercase">
                  Aguardando retirada de {(points || []).filter(p => p.status !== 'retirado').length} aterramentos para autorizar
                </p>
              )}
            </div>
          )}
          {user.role === 'coordenador' && (
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <div className="flex items-center justify-center gap-2 text-slate-400 bg-slate-50 py-3 rounded-xl border border-dashed border-slate-200">
                <Lock size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Aguardando Liberação Final (Admin/Eng)</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card title="Controle de Aterramentos" subtitle={user.role === 'lider' ? `Equipe: ${user.teamId}` : "Visão Geral do Vão"}>
        {/* Header Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-blue-700">Tempo Real</span>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#003366]' : 'text-gray-400'}`}
              >
                <List size={16} />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#003366]' : 'text-gray-400'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Filter size={14} className="text-gray-400 shrink-0" />
              <button
                onClick={() => setSelectedBay(null)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
                  selectedBay === null ? 'bg-[#003366] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'
                }`}
              >
                Todos Vãos
              </button>
              {bays.map(bay => (
                <button
                  key={bay}
                  onClick={() => setSelectedBay(bay)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase whitespace-nowrap transition-all ${
                    selectedBay === bay ? 'bg-[#003366] text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'
                  }`}
                >
                  Vão {bay}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['all', 'instalado', 'retirado'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                    statusFilter === status 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Activities - Compact */}
        {activeActivities.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 mb-4">
            <h4 className="text-[9px] font-black uppercase text-orange-800 mb-2 flex items-center gap-2">
              <AlertCircle size={12} />
              Trabalhos em Execução
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {activeActivities.map(a => (
                <div key={a.id} className="text-[8px] font-bold text-orange-700 uppercase bg-white/80 px-2 py-1 rounded border border-orange-200">
                  {a.equipment}: {a.foreman}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Points List/Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2' : 'divide-y divide-gray-50'}>
          {filteredPoints.map(p => {
            const isResponsible = user.role === 'coordenador' || user.role === 'engenharia' || p.responsibleTeamId === user.teamId;
            
            return (
              <div 
                key={p.id} 
                className={`flex items-center justify-between py-2.5 px-1 transition-all ${
                  viewMode === 'grid' ? 'flex-col gap-2 p-3 rounded-xl border border-gray-100 bg-white text-center' : 'bg-transparent'
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${viewMode === 'grid' ? 'flex-col' : ''}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    p.status === 'instalado' ? 'bg-green-100 text-green-600' : 
                    p.status === 'retirado' ? 'bg-gray-100 text-gray-400' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {p.status === 'instalado' ? <ShieldCheck size={16} /> : 
                     p.status === 'retirado' ? <ShieldX size={16} /> : 
                     p.type === 'bloqueio' ? <ShieldAlert size={16} className="text-orange-500" /> : <ShieldAlert size={16} />}
                  </div>
                  <div className={`min-w-0 ${viewMode === 'grid' ? 'text-center' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded shrink-0 ${
                        p.type === 'bloqueio' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.type === 'bloqueio' ? 'BLO' : 'TERRA'}
                      </span>
                      <span className="text-[10px] font-bold text-[#003366] uppercase truncate">{p.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-[8px] font-black uppercase ${
                        p.status === 'instalado' ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {p.status}
                      </p>
                      {p.confirmedBy && (
                        <span className="text-[7px] text-gray-300 uppercase font-bold truncate max-w-[80px]">
                          • {p.confirmedBy.split('@')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className={`flex gap-2 ${viewMode === 'grid' ? 'w-full justify-center' : 'shrink-0'}`}>
                  <button 
                    disabled={!isResponsible}
                    onClick={() => setConfirming({ id: p.id, status: 'instalado', description: p.description || p.id })}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-2 ${
                      !isResponsible ? 'opacity-20 cursor-not-allowed grayscale' :
                      p.status === 'instalado' 
                        ? 'bg-green-600 border-green-600 text-white shadow-md' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:text-green-600'
                    }`}
                    title={isResponsible ? "Marcar como Inserido" : "Sem permissão"}
                  >
                    <Check size={20} className={p.status === 'instalado' ? 'stroke-[3px]' : ''} />
                  </button>
                  <button 
                    disabled={!isResponsible}
                    onClick={() => setConfirming({ id: p.id, status: 'retirado', description: p.description || p.id })}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-2 ${
                      !isResponsible ? 'opacity-20 cursor-not-allowed grayscale' :
                      p.status === 'retirado' 
                        ? 'bg-red-600 border-red-600 text-white shadow-md' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-600'
                    }`}
                    title={isResponsible ? "Marcar como Retirado" : "Sem permissão"}
                  >
                    <X size={20} className={p.status === 'retirado' ? 'stroke-[3px]' : ''} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Modal */}
        {confirming && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl p-6 border border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                confirming.status === 'instalado' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {confirming.status === 'instalado' ? <Check size={24} /> : <X size={24} />}
              </div>
              <h3 className="text-lg font-black text-[#003366] uppercase mb-2">Confirmar Ação</h3>
              <p className="text-sm text-gray-600 mb-6">
                Deseja confirmar a {confirming.status === 'instalado' ? 'inserção' : 'retirada'} do aterramento do <strong>{confirming.description}</strong>?
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setConfirming(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  variant={confirming.status === 'instalado' ? 'success' : 'danger'}
                  className="flex-1"
                  onClick={() => {
                    onUpdateStatus(confirming.id, confirming.status);
                    setConfirming(null);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {filteredPoints.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ShieldAlert size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Nenhum ponto sob sua responsabilidade</p>
          </div>
        )}
      </Card>
    </div>
  );
};
