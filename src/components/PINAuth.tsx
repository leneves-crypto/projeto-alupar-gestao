import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  LayoutDashboard, 
  HardHat, 
  ShieldCheck, 
  Compass, 
  Lock, 
  ChevronRight, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { UserProfile } from '../types';
import { auth } from '../firebase';
import { signInAnonymously } from 'firebase/auth';

interface Profile {
  id: string;
  name: string;
  role: 'tecnico' | 'lider' | 'coordenador' | 'engenharia' | 'tst' | 'developer';
  teamId?: string;
  pin: string;
  icon: React.ElementType;
  color?: string;
}

const PROFILES: Profile[] = [
  { id: 'leneves', name: 'LENEVES (Admin)', role: 'developer', pin: '2428', icon: Settings, color: 'text-slate-600' },
  { id: 'alexandre', name: 'ALEXANDRE LIRIO (Coordenador)', role: 'coordenador', pin: '0000', icon: LayoutDashboard, color: 'text-blue-600' },
  { id: 'engenharia', name: 'Engenharia', role: 'engenharia', pin: '2204', icon: Compass, color: 'text-indigo-600' },
  { id: 'tst', name: 'TST', role: 'tst', pin: '2112', icon: ShieldCheck, color: 'text-green-600' },
  { id: 'equipe1', name: 'Equipe 1', role: 'lider', teamId: 'EQUIPE_01', pin: '1010', icon: HardHat, color: 'text-orange-500' },
  { id: 'equipe2', name: 'Equipe 2', role: 'lider', teamId: 'EQUIPE_02', pin: '2020', icon: HardHat, color: 'text-orange-500' },
  { id: 'equipe3', name: 'Equipe 3', role: 'lider', teamId: 'EQUIPE_03', pin: '3030', icon: HardHat, color: 'text-orange-500' },
  { id: 'equipe4', name: 'Equipe 4', role: 'lider', teamId: 'EQUIPE_04', pin: '4040', icon: HardHat, color: 'text-orange-500' },
  { id: 'equipe5', name: 'Equipe 5', role: 'lider', teamId: 'EQUIPE_05', pin: '5050', icon: HardHat, color: 'text-orange-500' },
];

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

interface PINAuthProps {
  onSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  children: React.ReactNode;
}

export const PINAuth: React.FC<PINAuthProps> = ({ onSuccess, onLogout, isAuthenticated, children }) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = localStorage.getItem('alupar_session');
      if (session) {
        try {
          const { user, timestamp } = JSON.parse(session);
          if (Date.now() - timestamp < SESSION_DURATION) {
            // Ensure we are signed in anonymously for Firestore access
            if (!auth.currentUser) {
              await signInAnonymously(auth).catch(console.error);
            }
            onSuccess(user);
          } else {
            localStorage.removeItem('alupar_session');
            onLogout();
          }
        } catch (e) {
          localStorage.removeItem('alupar_session');
          onLogout();
        }
      }
      setIsVerifying(false);
    };

    checkSession();
  }, []);

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setPin('');
    setError(null);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProfile && pin === selectedProfile.pin) {
      try {
        // Ensure we are signed in anonymously for Firestore access
        let uid = `pin_${selectedProfile.id}`;
        if (!auth.currentUser) {
          const { user: anonUser } = await signInAnonymously(auth);
          uid = anonUser.uid;
        } else {
          uid = auth.currentUser.uid;
        }

        const userData: UserProfile = {
          uid: uid,
          name: selectedProfile.name,
          role: selectedProfile.role,
          teamId: selectedProfile.teamId,
          email: `${selectedProfile.id}@alupar.com.br`
        };
        
        const sessionData = {
          user: userData,
          timestamp: Date.now()
        };
        
        localStorage.setItem('alupar_session', JSON.stringify(sessionData));
        onSuccess(userData);
      } catch (err) {
        console.error("Auth error:", err);
        setError('Erro ao validar acesso. Verifique sua conexão.');
      }
    } else {
      setError('PIN Inválido. Tente novamente ou contate a Coordenação.');
      setPin('');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#001a33]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070&auto=format&fit=crop" 
          alt="Alupar Background" 
          className="w-full h-full object-cover opacity-30"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001a33]/80 to-[#001a33]" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl mb-6 shadow-2xl border-4 border-blue-400/30 overflow-hidden p-3">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[#003366] font-black text-xl tracking-tighter">ALUPAR</span>
              <div className="h-1 w-full bg-green-500 mt-1" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Bem-vindo</h1>
          <p className="text-blue-300 font-bold uppercase tracking-widest text-[10px] mt-2">Regional Sudeste | SE Rio Novo do Sul</p>
        </div>

        <Card className="border-t-8 border-t-[#003366] shadow-2xl">
          {!selectedProfile ? (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Selecione seu Perfil</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Acesso restrito a colaboradores</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleProfileSelect(profile)}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-2xl transition-all group text-center"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform ${profile.color || 'text-slate-600'}`}>
                      <profile.icon size={20} />
                    </div>
                    <p className="font-black text-gray-800 text-[10px] uppercase leading-tight">
                      {profile.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={() => setSelectedProfile(null)}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center hover:underline"
              >
                ← Voltar para perfis
              </button>

              <div className="text-center space-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-2">
                  <Lock className="text-blue-600" size={24} />
                </div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-tight">Digite seu PIN</h2>
                <p className="text-[10px] text-blue-600 font-bold uppercase">{selectedProfile.name}</p>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div className="flex justify-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPin(val);
                      if (error) setError(null);
                    }}
                    placeholder="••••"
                    className="w-full h-16 text-center text-3xl font-black tracking-[1em] border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-0 transition-all bg-gray-50"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={14} />
                    <p className="text-[10px] font-bold text-red-800 leading-tight">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit"
                  disabled={pin.length !== 4}
                  className="w-full h-14 bg-[#003366] hover:bg-[#004080] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center"
                >
                  <ChevronRight className="mr-2" size={18} />
                  Validar Acesso
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
