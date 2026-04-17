import React from 'react';
import { CloudRain, Wind, Droplets, AlertTriangle, Thermometer } from 'lucide-react';
import { Card } from './Card';

interface WeatherWidgetProps {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProb: number;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ temperature, humidity, windSpeed, rainProb }) => {
  const isRisky = rainProb > 60 || windSpeed > 40 || temperature > 40;

  return (
    <Card title="Condições Climáticas" className={isRisky ? 'border-red-500 ring-2 ring-red-200' : ''}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl">
          <Thermometer className="text-orange-600 mb-2" size={32} />
          <span className="text-2xl font-black text-orange-900">{temperature}°C</span>
          <span className="text-xs uppercase font-bold text-orange-400">Temp</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl">
          <Droplets className="text-blue-600 mb-2" size={32} />
          <span className="text-2xl font-black text-blue-900">{humidity}%</span>
          <span className="text-xs uppercase font-bold text-blue-400">Umidade</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
          <Wind className="text-gray-600 mb-2" size={32} />
          <span className="text-2xl font-black text-gray-900">{windSpeed} <small className="text-sm">km/h</small></span>
          <span className="text-xs uppercase font-bold text-gray-400">Vento</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-xl">
          <CloudRain className="text-indigo-600 mb-2" size={32} />
          <span className="text-2xl font-black text-indigo-900">{rainProb}%</span>
          <span className="text-xs uppercase font-bold text-indigo-400">Chuva</span>
        </div>
      </div>
      
      {isRisky && (
        <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 flex items-center gap-3">
          <AlertTriangle className="text-red-600" />
          <span className="text-red-900 font-bold text-sm uppercase">Alerta: Condições desfavoráveis para intervenção</span>
        </div>
      )}
    </Card>
  );
};
