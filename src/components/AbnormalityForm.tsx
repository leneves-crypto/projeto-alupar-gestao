import React, { useState, useRef } from 'react';
import { Camera, X, Send, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './Button';
import { Card } from './Card';
import { UserProfile } from '../types';
import { resizeImage } from '../utils/imageUtils';

interface AbnormalityFormProps {
  user: UserProfile;
  onSubmit: (data: { 
    description: string; 
    photoUrl?: string; 
    teamId: string; 
    severity: 'baixa' | 'media' | 'alta' | 'critica';
    assetTag?: string;
    reportedByName?: string;
  }) => void;
  onClose: () => void;
}

export const AbnormalityForm: React.FC<AbnormalityFormProps> = ({ user, onSubmit, onClose }) => {
  const [description, setDescription] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [severity, setSeverity] = useState<'baixa' | 'media' | 'alta' | 'critica'>('media');
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const resizedBase64 = await resizeImage(base64);
        setPhoto(resizedBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;
    
    onSubmit({
      description,
      photoUrl: photo || undefined,
      teamId: user.teamId || 'COORDINATION',
      severity,
      assetTag: assetTag || undefined,
      reportedByName: user.name
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#001a33] uppercase tracking-tighter">Reportar Anormalidade</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Segurança em Primeiro Lugar</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Gravidade do Risco</label>
              <div className="grid grid-cols-4 gap-2">
                {(['baixa', 'media', 'alta', 'critica'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-2 ${
                      severity === s 
                        ? s === 'critica' ? 'bg-red-600 border-red-600 text-white' :
                          s === 'alta' ? 'bg-orange-600 border-orange-600 text-white' :
                          s === 'media' ? 'bg-yellow-500 border-yellow-500 text-white' :
                          'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">TAG do Equipamento (Opcional)</label>
              <input
                type="text"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                placeholder="Ex: RNS-TPBII-FB"
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none font-bold text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Descrição da Ocorrência</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva detalhadamente o risco ou anormalidade encontrada..."
                className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-red-500 outline-none min-h-[120px] font-bold text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Evidência Fotográfica</label>
              <div className="flex gap-4 items-center">
                {photo ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500 transition-all bg-gray-50"
                  >
                    <Camera size={32} />
                    <span className="text-[10px] font-black uppercase mt-2">Abrir Câmera</span>
                  </button>
                )}
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-bold italic">
                    "O registro fotográfico é essencial para a análise técnica da engenharia e segurança."
                  </p>
                </div>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 uppercase font-black tracking-widest text-[10px]"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="danger" 
                className="flex-1 gap-2 uppercase font-black tracking-widest text-[10px]"
                disabled={!description}
              >
                <Send size={16} />
                Enviar Reporte
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};
