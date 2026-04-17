import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Camera, Save, CheckCircle2, X, Plus, Trash2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { MaintenanceTask, PMOReport, PMOSection, PMOItem } from '../types';
import { PMO_TEMPLATES } from '../constants/pmoTemplates';
import { resizeImage } from '../utils/imageUtils';
import { maintenanceService } from '../services/maintenanceService';
import { checkWeatherRisk } from '../services/riskService';
import { AlertTriangle } from 'lucide-react';

interface PMOFormProps {
  task: MaintenanceTask;
  userId: string;
  onClose?: () => void;
  readOnly?: boolean;
  isAudit?: boolean;
  isManagement?: boolean;
}

export const PMOForm: React.FC<PMOFormProps> = ({ task, userId, onClose, readOnly, isAudit, isManagement }) => {
  const pmoKey = task.pmo.replace(' ', '-');
  const template = PMO_TEMPLATES[pmoKey];
  const [report, setReport] = useState<PMOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [weatherWarning, setWeatherWarning] = useState(false);
  const [signed, setSigned] = useState(false);

  // If management, they can edit even if finished or read-only
  const canEdit = isManagement || (!readOnly && report?.status !== 'finalizado');
  const isFinished = report?.status === 'finalizado';

  const weatherChecked = React.useRef(false);

  useEffect(() => {
    const initReport = async () => {
      if (task.reportId) {
        const existingReport = await maintenanceService.getPMOReport(task.reportId);
        if (existingReport) {
          setReport({
            ...existingReport,
            technicalData: existingReport.technicalData || {}
          });
          setLoading(false);
          return;
        }
      }

      // Create new report from template
      const newReport: PMOReport = {
        id: crypto.randomUUID(),
        taskId: task.id,
        pmoNumber: task.pmo,
        teamId: task.teamId,
        substation: 'SE Rio Novo do Sul - RNS',
        date: task.date || new Date().toISOString().split('T')[0],
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: '',
        assetTag: task.assetTag,
        executor: task.leader || '',
        sections: (template?.sections || []).map(s => ({
          ...s,
          items: (s.items || []).map(i => ({ ...i, status: undefined }))
        })),
        technicalData: (template?.technicalFields || []).reduce((acc, field) => ({ ...acc, [field]: '' }), {}),
        measurements: {},
        observations: '',
        photos: [],
        status: 'rascunho'
      };
      setReport(newReport);
      
      // Expand first section by default
      if (template?.sections?.[0]) {
        setExpandedSections({ [template.sections[0].title]: true });
      }
      
      setLoading(false);
    };

    initReport();
    
    const checkWeather = async () => {
      if (weatherChecked.current) return;
      weatherChecked.current = true;
      const isRaining = await checkWeatherRisk();
      setWeatherWarning(isRaining);
    };
    checkWeather();
  }, [task, template]);

  const updateItemStatus = (sectionTitle: string, itemId: string, status: 'C' | 'NC' | 'NA') => {
    if (!report) return;
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => 
          s.title === sectionTitle 
            ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, status } : i) }
            : s
        )
      };
    });
  };

  const updateItemMeasurement = (sectionTitle: string, itemId: string, measurement: string) => {
    if (!report) return;
    setReport(prev => {
      if (!prev) return null;
      return {
        ...prev,
        sections: prev.sections.map(s => 
          s.title === sectionTitle 
            ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, measurement } : i) }
            : s
        )
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && report) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const resizedBase64 = await resizeImage(base64);
        const caption = prompt('Descrição da foto:') || '';
        setReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            photos: [...prev.photos, {
              url: resizedBase64,
              caption,
              timestamp: new Date().toISOString()
            }]
          };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveReport = async (finalStatus: 'rascunho' | 'finalizado') => {
    if (!report) return;
    const updatedReport = { 
      ...report, 
      status: finalStatus,
      endTime: finalStatus === 'finalizado' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : report.endTime
    };
    
    if (isAudit) {
      toast.info('Modo de Auditoria: Os dados não foram salvos no banco.', {
        icon: <Lock size={16} />,
        className: 'bg-[#001a33] text-white border-none'
      });
      if (onClose) onClose();
      return;
    }
    
    try {
      await maintenanceService.savePMOReport(updatedReport);
      
      if (finalStatus === 'finalizado') {
        await maintenanceService.updateTask(task.id, { 
          status: 'concluido',
          reportId: updatedReport.id 
        }, userId);
        toast.success('Ficha finalizada com sucesso!');
        onClose?.();
      } else {
        await maintenanceService.updateTask(task.id, { 
          reportId: updatedReport.id 
        }, userId);
        toast.success('Rascunho salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar ficha:', error);
      toast.error('Erro ao salvar ficha. Verifique sua conexão.');
    }
  };

  if (!template && !loading) {
    return (
      <div className="p-12 text-center bg-white rounded-[32px]">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h3 className="text-xl font-black text-[#003366] uppercase tracking-tighter mb-2">Template Não Encontrado</h3>
        <p className="text-sm font-bold text-slate-400 uppercase max-w-xs mx-auto leading-relaxed mb-8">
          O template <span className="text-red-500">{task.pmo}</span> não foi localizado no sistema ou ainda não foi implementado.
        </p>
        <Button variant="secondary" onClick={onClose} className="w-full max-w-xs">
          Voltar ao Controle de Vãos
        </Button>
      </div>
    );
  }

  if (loading || !report) return <div className="p-8 text-center font-black uppercase text-gray-400">Carregando Ficha...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#001a33] text-white p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">{task.pmo.replace('-', ' ')}</h2>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{template?.title} | {task.assetTag}</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-black uppercase opacity-50">Data de Execução</p>
          <p className="font-bold">{report.date.split('-').reverse().join('/')}</p>
        </div>
      </div>

      {weatherWarning && (
        <div className="bg-red-50 border-2 border-red-500 p-6 rounded-3xl flex items-center gap-4 text-red-700 animate-pulse shadow-lg">
          <AlertTriangle className="w-8 h-8 shrink-0" />
          <div>
            <p className="font-black uppercase text-sm tracking-widest">Alerta de Risco Crítico: Chuva</p>
            <p className="text-xs font-bold opacity-80 uppercase">Interromper atividades externas e em altura imediatamente conforme protocolo ONS.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400">Executor / Líder</label>
          <input 
            type="text" 
            value={report.executor}
            onChange={e => setReport({...report, executor: e.target.value})}
            disabled={!canEdit}
            className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="Nome do responsável"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Hora Início</label>
            <input 
              type="time" 
              value={report.startTime}
              onChange={e => setReport({...report, startTime: e.target.value})}
              disabled={!canEdit}
              className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400">Hora Término</label>
            <input 
              type="time" 
              value={report.endTime}
              onChange={e => setReport({...report, endTime: e.target.value})}
              disabled={!canEdit}
              className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl font-bold outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
        </div>
      </div>

      {template?.technicalFields && template.technicalFields.length > 0 && (
        <Card title="Dados Técnicos do Equipamento">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {template?.technicalFields?.map(field => (
              <div key={field} className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">{field}</label>
                <input 
                  type="text"
                  value={(report.technicalData && report.technicalData[field]) || ''}
                  onChange={e => setReport({
                    ...report,
                    technicalData: { ...(report.technicalData || {}), [field]: e.target.value }
                  })}
                  disabled={!canEdit}
                  className="w-full p-2 bg-gray-50 border-2 border-gray-100 rounded-lg font-bold text-sm outline-none focus:border-blue-400 disabled:text-gray-400"
                  placeholder="..."
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {report.sections?.map((section) => (
        <Card 
          key={section.title} 
          title={section.title}
          className="overflow-hidden"
        >
          <div className="divide-y divide-gray-50">
            {section.items?.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-sm font-bold text-gray-700 flex-1">{item.description}</span>
                {item.type === 'measurement' ? (
                  <div className="flex items-center gap-2 w-full sm:w-48">
                    <input 
                      type="text"
                      value={item.measurement || ''}
                      onChange={(e) => updateItemMeasurement(section.title, item.id, e.target.value)}
                      disabled={!canEdit}
                      className="w-full p-2 bg-gray-50 border-2 border-gray-100 rounded-lg font-bold text-sm outline-none focus:border-blue-400 disabled:text-gray-400"
                      placeholder="Valor..."
                    />
                    {item.unit && <span className="text-[10px] font-black text-gray-400">{item.unit}</span>}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(['C', 'NC', 'NA'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateItemStatus(section.title, item.id, status)}
                        disabled={!canEdit}
                        className={`w-12 h-10 rounded-lg font-black text-xs transition-all border-2 ${
                          item.status === status 
                            ? status === 'C' ? 'bg-green-500 border-green-600 text-white shadow-md' :
                              status === 'NC' ? 'bg-red-500 border-red-600 text-white shadow-md' :
                              'bg-gray-500 border-gray-600 text-white shadow-md'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card title="Observações Adicionais">
        <textarea 
          value={report.observations}
          onChange={e => setReport({...report, observations: e.target.value})}
          disabled={!canEdit}
          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-medium outline-none focus:border-blue-400 min-h-[120px] disabled:text-gray-400"
          placeholder="Descreva aqui qualquer detalhe relevante ou anormalidade encontrada..."
        />
      </Card>

      <Card title="Evidências Fotográficas">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-all cursor-pointer bg-gray-50 ${(!canEdit) ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Camera size={32} />
            <span className="text-[10px] font-black uppercase mt-2">Adicionar Foto</span>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handlePhotoUpload} 
              disabled={!canEdit} 
            />
          </label>
          {(report.photos || []).map((photo, index) => (
            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-lg group">
              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                <p className="text-[10px] text-white font-bold leading-tight">{photo.caption}</p>
                <button 
                  onClick={() => setReport({...report, photos: (report.photos || []).filter((_, i) => i !== index)})}
                  disabled={!canEdit}
                  className="mt-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
        <label className={`flex items-center gap-4 cursor-pointer group ${(!canEdit) ? 'cursor-not-allowed' : ''}`}>
          <div 
            onClick={() => canEdit && setSigned(!signed)}
            className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
              signed ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' : 'bg-white border-slate-300 group-hover:border-blue-400'
            } ${(!canEdit) ? 'opacity-50' : ''}`}
          >
            {signed && <CheckCircle2 className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase text-slate-700 tracking-tight">
              Assinatura Digital e Confirmação de Execução
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Confirmo que todas as atividades foram executadas conforme normas técnicas e de segurança.
            </p>
          </div>
        </label>
      </div>

      {canEdit && (
        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6">
          <Button variant="secondary" size="lg" onClick={() => saveReport('rascunho')}>
            <Save size={20} className="mr-2" />
            Salvar Rascunho
          </Button>
          <Button 
            variant="success" 
            size="lg" 
            onClick={() => saveReport('finalizado')}
            disabled={
              !report.executor || 
              !report.startTime ||
              !signed || 
              !report.photos || report.photos.length === 0 ||
              (report.sections || []).some(s => (s.items || []).some(i => i.type === 'measurement' ? !i.measurement : !i.status)) ||
              (template?.technicalFields?.some(f => !report.technicalData || !report.technicalData[f]))
            }
          >
            <CheckCircle2 size={20} className="mr-2" />
            Finalizar e Gerar Relatório
          </Button>
        </div>
      )}
      {report.status === 'finalizado' && (
        <div className="p-6 bg-green-50 border-2 border-green-500 rounded-3xl flex items-center justify-center gap-4 text-green-700 shadow-lg">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
          <p className="font-black uppercase text-sm tracking-widest">Atividade Concluída e Relatório Gerado</p>
        </div>
      )}
      {!canEdit && (
        <div className="p-6 bg-slate-100 border-2 border-slate-300 rounded-3xl flex items-center justify-center gap-4 text-slate-500 shadow-lg">
          <Lock className="w-8 h-8 shrink-0" />
          <p className="font-black uppercase text-sm tracking-widest">Modo de Visualização (Apenas Equipe Responsável pode editar)</p>
        </div>
      )}
      {canEdit && ((report.sections || []).some(s => (s.items || []).some(i => i.type === 'measurement' ? !i.measurement : !i.status)) || (template?.technicalFields?.some(f => !report.technicalData || !report.technicalData[f])) || !report.executor || !report.startTime || !signed || !report.photos || report.photos.length === 0) && (
        <p className="text-[10px] font-black text-red-500 uppercase text-right">
          * Preencha todos os itens da ficha, dados técnicos, executor, horários, anexe fotos e assine para finalizar
        </p>
      )}
    </div>
  );
};
