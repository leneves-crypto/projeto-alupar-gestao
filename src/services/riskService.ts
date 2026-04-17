import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, setDoc, Timestamp, doc, getDoc } from 'firebase/firestore';

export const checkWeatherRisk = async () => {
  try {
    const weatherRef = doc(db, 'weather', 'current');
    const weatherSnap = await getDoc(weatherRef);
    
    if (weatherSnap.exists()) {
      const weatherData = weatherSnap.data();
      // If rain probability is high or it's already raining
      const isRaining = weatherData.rainProb > 50 || weatherData.humidity > 90;
      
      if (isRaining) {
        // Use a fixed ID for the weather alert to prevent duplicates
        const alertId = 'weather-alert-active';
        await setDoc(doc(db, 'alerts', alertId), {
          id: alertId,
          title: 'ALERTA DE RISCO ALTO: CHUVA',
          message: 'Previsão de chuva detectada. Interromper imediatamente atividades em altura e externas.',
          severity: 'high',
          timestamp: Timestamp.now(),
          category: 'weather'
        });
        return true;
      } else {
        // If it's not raining anymore, remove the active alert
        const alertId = 'weather-alert-active';
        const alertRef = doc(db, 'alerts', alertId);
        const alertSnap = await getDoc(alertRef);
        if (alertSnap.exists()) {
          const { deleteDoc } = await import('firebase/firestore');
          await deleteDoc(alertRef);
        }
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking weather risk:', error);
    return false;
  }
};

export const triggerMechanicalAlert = async (equipmentTag: string, teamId: string) => {
  await addDoc(collection(db, 'alerts'), {
    title: 'ALERTA DE RISCO MÉDIO: EMPERRAMENTO MECÂNICO',
    message: `Equipamento ${equipmentTag} apresenta emperramento mecânico. Equipe de apoio solicitada.`,
    severity: 'medium',
    timestamp: Timestamp.now(),
    category: 'mechanical',
    targetTeamId: teamId
  });
};
