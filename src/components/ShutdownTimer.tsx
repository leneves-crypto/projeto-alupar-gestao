import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ShutdownTimerProps {
  activityProgress: number;
  showProgress?: boolean;
}

export const ShutdownTimer: React.FC<ShutdownTimerProps> = ({ activityProgress, showProgress = true }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getWindowTimes = () => {
    const start = new Date(now);
    start.setHours(7, 0, 0, 0);
    
    const end = new Date(now);
    end.setHours(17, 0, 0, 0);
    
    return { start, end };
  };

  const { start, end } = getWindowTimes();
  const isBefore = now < start;
  const isDuring = now >= start && now <= end;
  const isAfter = now > end;

  const timeProgress = React.useMemo(() => {
    if (now < start) return 0;
    if (now > end) return 100;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [now, start, end]);

  // Performance calculation: compare activity progress vs time elapsed
  const performance = React.useMemo(() => {
    if (!isDuring) return null;
    const diff = activityProgress - timeProgress;
    if (diff > 5) return { label: 'Adiantado', icon: <TrendingUp size={12} />, color: 'text-emerald-500' };
    if (diff < -5) return { label: 'Atrasado', icon: <TrendingDown size={12} />, color: 'text-red-500' };
    return { label: 'No Prazo', icon: <Minus size={12} />, color: 'text-blue-500' };
  }, [activityProgress, timeProgress, isDuring]);

  const formatTime = (ms: number) => {
    const absMs = Math.abs(ms);
    const seconds = Math.floor((absMs / 1000) % 60);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor((absMs / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerContent = () => {
    if (isBefore) {
      return {
        label: "Aguardando Abertura",
        time: "Janela inicia às 07:00",
        colorClass: "bg-slate-50 border-slate-200 text-slate-500",
        icon: <Clock className="w-5 h-5" />,
        badge: null
      };
    }
    
    if (isDuring) {
      const remainingMs = end.getTime() - now.getTime();
      const currentHour = now.getHours();
      
      // 15h (2 hours remaining) -> Orange
      if (currentHour === 15) {
        return {
          label: "Falta menos de 2 horas",
          time: `Restam: ${formatTime(remainingMs)}`,
          colorClass: "bg-orange-50 border-orange-500 text-orange-700 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
          icon: <Clock className="w-5 h-5 animate-pulse" />,
          badge: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
              <AlertTriangle size={10} />
              Atenção
            </div>
          )
        };
      }
      
      // 16h (1 hour remaining) -> Red
      if (currentHour === 16) {
        return {
          label: "Falta menos de 1 hora",
          time: `Restam: ${formatTime(remainingMs)}`,
          colorClass: "bg-red-50 border-red-500 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
          icon: <Clock className="w-5 h-5 animate-pulse" />,
          badge: (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
              <AlertTriangle size={10} />
              Crítico
            </div>
          )
        };
      }

      // Default During (07:00 - 15:00) -> Green
      return {
        label: "Dentro do prazo",
        time: `Restam: ${formatTime(remainingMs)}`,
        colorClass: "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
        icon: <Clock className="w-5 h-5 animate-pulse" />,
        badge: (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
            <CheckCircle2 size={10} />
            Operação Segura
          </div>
        )
      };
    }
    
    // isAfter (17:00+)
    const exceededMs = now.getTime() - end.getTime();
    return {
      label: "Janela Encerrada",
      time: `Excedido: ${formatTime(exceededMs)}`,
      colorClass: "bg-red-50 border-red-500 text-red-700 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
      icon: <AlertTriangle className="w-5 h-5 animate-bounce" />,
      badge: (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
          <AlertTriangle size={10} />
          Tempo Excedido
        </div>
      )
    };
  };

  const content = getTimerContent();

  return (
    <div className={`p-4 rounded-3xl border-2 flex flex-col gap-3 transition-all duration-500 ${content.colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-2xl bg-white shadow-sm`}>
            {content.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{content.label}</p>
              {content.badge}
            </div>
            <p className="text-2xl font-mono font-black tracking-tighter">{content.time}</p>
          </div>
        </div>
        
        <div className="hidden sm:block text-right">
          <p className="text-[8px] font-black uppercase opacity-40 leading-none">Status da Janela</p>
          <p className="text-[10px] font-bold uppercase tracking-tighter">07:00 - 17:00</p>
          {performance && (
            <div className={`flex items-center justify-end gap-1 mt-1 font-black text-[9px] uppercase ${performance.color}`}>
              {performance.icon}
              {performance.label}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar Section */}
      {isDuring && showProgress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-50">
            <span>Progresso da Atividade: {activityProgress}%</span>
            <span>Tempo Decorrido: {Math.round(timeProgress)}%</span>
          </div>
          <div className="relative h-2 bg-white/50 rounded-full overflow-hidden border border-black/5">
            {/* Time Elapsed Bar (Background) */}
            <div 
              className="absolute top-0 left-0 h-full bg-slate-300/50 transition-all duration-1000" 
              style={{ width: `${timeProgress}%` }}
            />
            {/* Activity Progress Bar (Foreground) */}
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                activityProgress >= timeProgress ? 'bg-emerald-500' : 'bg-orange-500'
              }`} 
              style={{ width: `${activityProgress}%` }}
            />
          </div>
          <p className="text-[7px] font-bold italic opacity-40 text-center">
            Barra colorida indica progresso real vs. tempo planejado
          </p>
        </div>
      )}
    </div>
  );
};

