import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Card } from './Card';

interface TimelineEvent {
  id: string;
  time: string;
  activity: string;
  status: 'concluido' | 'em_andamento' | 'atrasado' | 'pendente';
  team: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getStatusStyles = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'concluido': return 'bg-green-500 border-green-200';
      case 'em_andamento': return 'bg-blue-500 border-blue-200 animate-pulse';
      case 'atrasado': return 'bg-red-500 border-red-200';
      default: return 'bg-gray-300 border-gray-100';
    }
  };

  return (
    <Card title="Cronograma em Tempo Real" subtitle="Janela de Desligamento: 07:00 - 17:00">
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
        {events.map((event) => (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${getStatusStyles(event.status)}`}>
              <Clock size={16} className="text-white" />
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-100 bg-white shadow-sm ml-4 md:ml-0">
              <div className="flex items-center justify-between mb-1">
                <time className="font-black text-[#003366] text-lg">{event.time}</time>
                {event.status === 'atrasado' && (
                  <span className="flex items-center gap-1 text-red-600 text-[10px] font-black uppercase">
                    <AlertCircle size={12} /> Atraso
                  </span>
                )}
              </div>
              <div className="text-gray-800 font-bold">{event.activity}</div>
              <div className="text-xs text-gray-400 uppercase font-bold mt-1">{event.team}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
