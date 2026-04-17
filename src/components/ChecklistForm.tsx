import React, { useState } from 'react';
import { Camera, Save, CheckCircle2, CheckSquare, Square, ShieldCheck, X, Map as MapIcon, ShieldAlert, ShieldX, Check, Lock } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { MaintenanceTask, GroundingPoint, GroundingStatus } from '../types';
import { resizeImage } from '../utils/imageUtils';

interface ChecklistFormProps {
  task: MaintenanceTask;
  userId: string;
  groundingPoints: GroundingPoint[];
  onUpdateGrounding: (id: string, status: GroundingStatus, userId: string) => void;
  onSubmit: (data: Partial<MaintenanceTask>) => void;
  readOnly?: boolean;
  isManagement?: boolean;
}

export const ChecklistForm: React.FC<ChecklistFormProps> = ({ task, userId, groundingPoints, onUpdateGrounding, onSubmit, readOnly, isManagement }) => {
  const [activities, setActivities] = useState(task?.activities || []);
  const [resistance, setResistance] = useState(task?.measurements?.contactResistance?.toString() || '');
  const [opening, setOpening] = useState(task?.measurements?.openingTime?.toString() || '');
  const [closing, setClosing] = useState(task?.measurements?.closingTime?.toString() || '');
  const [confirming, setConfirming] = useState<{ id: string; status: GroundingStatus; description: string } | null>(null);

  // If management, they can edit even if finished
  const canEdit = !readOnly && (task?.status !== 'concluido' || isManagement);

  // Filter grounding points for the current bay (based on asset tag)
  // Example: task.assetTag = "RNDJ6-01", p.bay = "DJ6-01"
  const relevantGrounding = (groundingPoints || []).filter(p => {
    if (!task?.assetTag) return false;
    const normalizedTag = task.assetTag.replace(/^RN/, ''); // Remove "RN" prefix
    return normalizedTag.includes(p.bay) || p.bay.includes(normalizedTag);
  });

  const toggleActivity = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if ((task.photos || []).length >= 5) {
        alert('Limite de 5 fotos por atividade atingido para garantir a performance do sistema.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const resizedBase64 = await resizeImage(base64);
        onSubmit({
          photos: [...(task.photos || []), {
            url: resizedBase64,
            caption: 'Foto da Atividade',
            timestamp: new Date().toISOString()
          }],
          updatedAt: new Date().toISOString(),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...(task.photos || [])];
    newPhotos.splice(index, 1);
    onSubmit({
      photos: newPhotos,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = (status: 'em_execucao' | 'concluido') => {
    onSubmit({
      activities,
      measurements: {
        contactResistance: parseFloat(resistance) || 0,
        openingTime: parseFloat(opening) || 0,
        closingTime: parseFloat(closing) || 0,
      },
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  const allActivitiesDone = (activities || []).length > 0 && (activities || []).every(a => a && a.completed);
  const allGroundingInstalled = relevantGrounding.length > 0 ? relevantGrounding.every(p => p && p.status === 'instalado') : true;

  return (
    <Card title={`Execução: ${task?.assetTag || '...'}`} subtitle={`Baseado no documento ${task?.pmo || '...'}`}>
      <div className="space-y-8">
        {/* Area Map & Grounding */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
            <MapIcon size={16} />
            <h3>Área de Atuação & Aterramentos</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Substation Map Placeholder */}
            <div className="bg-gray-900 rounded-2xl p-6 relative overflow-hidden min-h-[240px] border-4 border-gray-800">
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" viewBox="0 0 400 300">
                  <rect x="50" y="50" width="300" height="200" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                  <line x1="100" y1="50" x2="100" y2="250" stroke="white" strokeWidth="1" />
                  <line x1="200" y1="50" x2="200" y2="250" stroke="white" strokeWidth="1" />
                  <line x1="300" y1="50" x2="300" y2="250" stroke="white" strokeWidth="1" />
                  <text x="60" y="40" fill="white" fontSize="10" fontWeight="bold">SETOR 345kV</text>
                  <text x="260" y="270" fill="white" fontSize="10" fontWeight="bold">SETOR 138kV</text>
                </svg>
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-black text-blue-400 uppercase">Sua Área Hoje</p>
                  <p className="text-sm font-bold text-white uppercase">{task.assetTag}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {relevantGrounding.map(p => (
                    <div 
                      key={p.id}
                      className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 ${
                        p.status === 'instalado' ? 'bg-green-500/20 border-green-500 text-green-400' : 
                        p.status === 'retirado' ? 'bg-gray-500/20 border-gray-500 text-gray-400' :
                        'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        p.status === 'instalado' ? 'bg-green-500' : 
                        p.status === 'retirado' ? 'bg-gray-500' :
                        'bg-yellow-500'
                      }`} />
                      {p.bay}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Grounding Controls */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase">Controle de Aterramento Local</p>
              {relevantGrounding.length > 0 ? (
                relevantGrounding.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        p.status === 'instalado' ? 'bg-green-100 text-green-600' : 
                        p.status === 'retirado' ? 'bg-gray-100 text-gray-400' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {p.status === 'instalado' ? <ShieldCheck size={18} /> : 
                         p.status === 'retirado' ? <ShieldX size={18} /> : 
                         <ShieldAlert size={18} />}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-[#003366]">Vão {p.bay}</p>
                        {p.description && <p className="text-[9px] font-bold text-gray-500 uppercase">{p.description}</p>}
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{p.status}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => canEdit && setConfirming({ id: p.id, status: 'instalado', description: p.description || `Vão ${p.bay}` })}
                        disabled={!canEdit}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-2 ${
                          p.status === 'instalado' 
                            ? 'bg-green-600 border-green-600 text-white shadow-md' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-green-200 hover:text-green-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Marcar como Inserido"
                      >
                        <Check size={20} className={p.status === 'instalado' ? 'stroke-[3px]' : ''} />
                      </button>
                      <button 
                        onClick={() => canEdit && setConfirming({ id: p.id, status: 'retirado', description: p.description || `Vão ${p.bay}` })}
                        disabled={!canEdit}
                        className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all border-2 ${
                          p.status === 'retirado' 
                            ? 'bg-red-600 border-red-600 text-white shadow-md' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-600'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        title="Marcar como Retirado"
                      >
                        <X size={20} className={p.status === 'retirado' ? 'stroke-[3px]' : ''} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Nenhum ponto de aterramento específico para este ativo.</p>
                </div>
              )}
            </div>
          </div>
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
                    onUpdateGrounding(confirming.id, confirming.status, userId);
                    setConfirming(null);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Grounding Confirmation - REMOVIDO CONFORME PEDIDO */}
        
        {/* Activities Checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Atividades do PMO</h3>
          <div className="grid grid-cols-1 gap-2">
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => canEdit && toggleActivity(activity.id)}
                disabled={!canEdit}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  activity.completed ? 'bg-blue-50 border-blue-100 text-[#003366]' : 'bg-white border-gray-100 text-gray-500'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {activity.completed ? <CheckSquare className="text-blue-600" /> : <Square />}
                <span className="font-bold text-sm">{activity.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Measurements */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Medições Técnicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Resistência de Contato (µΩ)</label>
              <input
                type="number"
                value={resistance}
                onChange={(e) => setResistance(e.target.value)}
                disabled={!canEdit}
                placeholder="0.0"
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#003366] outline-none text-xl font-bold disabled:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Tempo de Abertura (ms)</label>
              <input
                type="number"
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                disabled={!canEdit}
                placeholder="0.0"
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#003366] outline-none text-xl font-bold disabled:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400">Tempo de Fechamento (ms)</label>
              <input
                type="number"
                value={closing}
                onChange={(e) => setClosing(e.target.value)}
                disabled={!canEdit}
                placeholder="0.0"
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#003366] outline-none text-xl font-bold disabled:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest">Evidências Fotográficas</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <button 
              onClick={() => canEdit && fileInputRef.current?.click()}
              disabled={!canEdit}
              className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 hover:text-[#003366] hover:border-[#003366] transition-colors bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={32} />
              <span className="text-[10px] font-bold uppercase mt-2">Anexar Foto</span>
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={!canEdit}
              className="hidden"
            />
            {task.photos?.map((photo, i) => (
              <div key={i} className="relative flex-shrink-0 w-32 h-32 bg-gray-200 rounded-2xl overflow-hidden border-2 border-white shadow-md group">
                <img 
                  src={typeof photo === 'string' ? photo : photo.url} 
                  alt="Evidência" 
                  className="w-full h-full object-cover" 
                />
                <button 
                  onClick={() => canEdit && removePhoto(i)}
                  disabled={!canEdit}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:hidden"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-4">
            <Button variant="secondary" size="lg" onClick={() => handleSave('em_execucao')}>
              Salvar Rascunho
            </Button>
            <Button 
              variant="success" 
              size="lg" 
              onClick={() => handleSave('concluido')} 
              className="gap-2"
              disabled={!allActivitiesDone || !allGroundingInstalled || !resistance || !opening || !closing || !task.photos || task.photos.length === 0}
            >
              <CheckCircle2 size={20} />
              Finalizar Checklist
            </Button>
          </div>
        )}
        
        {!canEdit && (
          <div className="p-6 bg-slate-100 border-2 border-slate-300 rounded-3xl flex items-center justify-center gap-4 text-slate-500 shadow-lg">
            <Lock className="w-8 h-8 shrink-0" />
            <p className="font-black uppercase text-sm tracking-widest">Modo de Visualização (Apenas Equipe Responsável pode editar)</p>
          </div>
        )}
        
        {canEdit && (!allActivitiesDone || !allGroundingInstalled || !resistance || !opening || !closing || !task.photos || task.photos.length === 0) && (
          <p className="text-[10px] font-bold text-red-500 uppercase text-right">
            * Complete todas as atividades, aterramentos, medições técnicas e anexe fotos para finalizar
          </p>
        )}
      </div>
    </Card>
  );
};
