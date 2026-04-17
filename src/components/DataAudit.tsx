import React, { useState } from 'react';
import { MASTER_ASSETS_DATA } from '../data/masterData';
import { INITIAL_TEAMS } from '../data/initialData';
import { PMOForm } from './PMOForm';
import { UserProfile } from '../types';
import { Search, ClipboardCheck, X, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataAuditProps {
  user: UserProfile;
}

export const DataAudit: React.FC<DataAuditProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [testingAsset, setTestingAsset] = useState<any | null>(null);

  // Use MASTER_ASSETS_DATA as the exclusive source of truth
  const auditData = React.useMemo(() => {
    const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
    // No filters for team or date as requested
    const data = [...MASTER_ASSETS_DATA]
      .filter(item => validTeams.includes(item.teamId))
      .sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return a.tag.localeCompare(b.tag);
      });

    return data;
  }, []);

  const filteredData = auditData.filter(item => 
    item.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.date.includes(searchTerm) ||
    item.teamId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.pmo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-orange-500" />
            <h2 className="text-2xl font-black text-[#001a33] uppercase tracking-tighter">Auditoria de Dados</h2>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Visualização de Inventário Completo | {auditData.length} Ativos Mapeados
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por TAG, Data, Equipe ou PMO..."
            className="w-full pl-10 pr-4 py-2 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-500">
                <th className="p-4 border-b">Data</th>
                <th className="p-4 border-b">TAG do Ativo</th>
                <th className="p-4 border-b">Setor</th>
                <th className="p-4 border-b">Fabricante</th>
                <th className="p-4 border-b">Modelo</th>
                <th className="p-4 border-b">Franquia 20h</th>
                <th className="p-4 border-b">Equipe Responsável</th>
                <th className="p-4 border-b">Tipo de PMO</th>
                <th className="p-4 border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold">
              {filteredData.length > 0 ? (
                filteredData.map((item, index) => {
                  const team = INITIAL_TEAMS.find(t => t.id === item.teamId);
                  return (
                    <tr key={`${item.tag}-${item.date}-${index}`} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                      <td className="p-4 text-gray-400 text-xs font-mono">
                        {item.date.split('-').reverse().join('/')}
                      </td>
                      <td className="p-4 text-[#003366] font-black tracking-tight">{item.tag}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-gray-600">{item.sector}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-500">{item.manufacturer}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-gray-500">{item.model}</span>
                      </td>
                      <td className="p-4 text-center">
                        {item.franquia20h ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black">SIM</span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-black">NÃO</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] uppercase font-black border border-blue-100">
                          {team?.name || item.teamId}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-500 text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {item.pmo}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setTestingAsset(item)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95"
                        >
                          <ClipboardCheck size={14} />
                          Testar Ficha
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <AlertCircle size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold">Nenhum ativo encontrado para os critérios de busca.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {testingAsset && (
        <div className="fixed inset-0 bg-[#001a33]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border-4 border-orange-500/20">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#001a33] uppercase tracking-tighter flex items-center gap-2">
                    Modo de Auditoria <span className="text-[10px] bg-green-200 text-green-700 px-2 py-0.5 rounded-full">BYPASS ATIVO</span>
                  </h3>
                  <p className="text-xs font-bold text-orange-600/60 uppercase tracking-widest">
                    Validando: {testingAsset.tag} | {testingAsset.pmo} | Equipe: {testingAsset.teamId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setTestingAsset(null)}
                className="p-2 hover:bg-orange-200 text-orange-600 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="max-w-4xl mx-auto">
                <PMOForm
                  userId={user.uid}
                  task={{
                    id: `audit-${testingAsset.tag}-${testingAsset.date}`,
                    teamId: testingAsset.teamId,
                    assetTag: testingAsset.tag,
                    pmo: testingAsset.pmo,
                    leader: testingAsset.leader,
                    status: 'pendente',
                    date: testingAsset.date,
                    isActive: true,
                    sectorId: 'SEC-01',
                    milestoneId: 'AUDIT',
                    groundingConfirmed: false,
                    updatedAt: new Date().toISOString(),
                    updatedBy: user.uid
                  }}
                  onClose={() => setTestingAsset(null)}
                  isAudit={false}
                  isManagement={true}
                />
              </div>
            </div>
            <div className="p-4 bg-orange-100 border-t border-orange-200 text-center">
              <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest flex items-center justify-center gap-2">
                <AlertCircle size={12} />
                Atenção: Você está em modo BYPASS. Suas alterações serão salvas diretamente no banco de dados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Shield = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>
);
