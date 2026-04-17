import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  where,
  orderBy,
  Timestamp,
  getDocsFromServer,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { MIN_VALID_DATE, MAX_VALID_DATE } from '../constants/appConfig';
import { MaintenanceTask, GroundingPoint, WeatherData, Abnormality, UserProfile, Risk, Team, PMOReport, Asset, Sector, SectorActivity, TaskStatus } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  const code = (error as any)?.code || 'unknown';
  
  const errInfo = {
    error: message,
    code: code,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Technical alert for diagnosis as requested by user
  alert(`ERRO FIREBASE [${operationType.toUpperCase()}]:\n\nCode: ${code}\nMessage: ${message}\nPath: ${path}\nUID: ${auth.currentUser?.uid || 'Not Logged In'}`);
  
  throw new Error(JSON.stringify(errInfo));
}

function cleanData(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  }
  const result: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      result[key] = cleanData(value);
    }
  });
  return result;
}

// Cache for static data
const cache: {
  risks: Risk[] | null;
  teams: Team[] | null;
  assets: Asset[] | null;
} = {
  risks: null,
  teams: null,
  assets: null
};

export const maintenanceService = {
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return { uid: querySnapshot.docs[0].id, ...data } as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return null;
    }
  },

  subscribeToTasks(teamId: string | undefined, callback: (tasks: MaintenanceTask[]) => void) {
    const validTeams = ['EQUIPE_01', 'EQUIPE_02', 'EQUIPE_03', 'EQUIPE_04', 'EQUIPE_05'];
    const minDate = MIN_VALID_DATE;
    const maxDate = MAX_VALID_DATE;
    const q = teamId 
      ? query(collection(db, 'tasks'), where('teamId', '==', teamId), where('date', '>=', minDate), where('date', '<=', maxDate))
      : query(collection(db, 'tasks'), where('date', '>=', minDate), where('date', '<=', maxDate));
    
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceTask))
        .filter(t => {
          const isActive = t.isActive !== false;
          const isOfficialTeam = validTeams.includes(t.teamId);
          const isWithinRange = t.date >= minDate && t.date <= maxDate;
          return isActive && isOfficialTeam && isWithinRange;
        });
      console.log(`Fetched ${tasks.length} active tasks for teamId: ${teamId || 'all'} (Range: ${minDate} to ${maxDate})`);
      callback(tasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });
  },

  async updateTask(taskId: string, data: Partial<MaintenanceTask>, userId?: string) {
    try {
      const docRef = doc(db, 'tasks', taskId);
      
      // REESTRUTURAÇÃO: Quando a Equipe marca o aterramento, o ESTAGIO_OPERACIONAL muda para 'ATERRAMENTO_CONCLUIDO'
      if (data.groundingConfirmed === true) {
        data.ESTAGIO_OPERACIONAL = 'ATERRAMENTO_CONCLUIDO';
      } else if (data.groundingConfirmed === false) {
        data.ESTAGIO_OPERACIONAL = 'PENDENTE';
      }

      const updatedData = cleanData({
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: userId || auth.currentUser?.uid || 'system'
      });
      
      await setDoc(docRef, updatedData, { merge: true });

      // Sync with Sector Activity if task is completed
      if (data.status === 'concluido') {
        const taskSnap = await getDoc(docRef);
        const currentTask = taskSnap.exists() ? (taskSnap.data() as MaintenanceTask) : null;
        if (currentTask?.milestoneId) {
          await this.syncTaskToSectorActivity(currentTask.milestoneId, currentTask.teamId, `Conclusão da tarefa: ${currentTask.assetTag}`);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
    }
  },

  async syncTaskToSectorActivity(milestoneId: string, teamId: string, description: string) {
    try {
      // 1. Find the activity
      const q = query(
        collection(db, 'sector_activities'),
        where('milestoneId', '==', milestoneId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const activityDoc = querySnapshot.docs[0];
        const activityData = activityDoc.data() as SectorActivity;
        
        // 2. Add to timeline
        const newTimelineEntry = {
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          description,
          teamId
        };
        const updatedTimeline = [...(activityData.timeline || []), newTimelineEntry];

        // 3. Check if all tasks for this milestone are completed
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('milestoneId', '==', milestoneId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const allTasksCompleted = tasksSnapshot.docs
          .map(doc => doc.data() as MaintenanceTask)
          .filter(t => t.isActive !== false)
          .every(t => t.status === 'concluido');
        
        await updateDoc(doc(db, 'sector_activities', activityDoc.id), {
          timeline: updatedTimeline,
          status: allTasksCompleted ? 'concluido' : 'em_execucao'
        });
      }
    } catch (error) {
      console.error('Error syncing task to sector activity:', error);
    }
  },

  subscribeToGrounding(callback: (points: GroundingPoint[]) => void) {
    return onSnapshot(collection(db, 'grounding'), (snapshot) => {
      const points = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroundingPoint));
      callback(points);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'grounding');
    });
  },

  async updateGrounding(pointId: string, status: string, userId?: string) {
    try {
      const docRef = doc(db, 'grounding', pointId);
      const pointSnap = await getDoc(docRef);
      const pointData = pointSnap.exists() ? (pointSnap.data() as GroundingPoint) : null;
      
      await updateDoc(docRef, {
        status,
        confirmedBy: userId || auth.currentUser?.uid || 'system',
        confirmedAt: new Date().toISOString()
      });

      // Sync with Sector Activity
      if (pointData) {
        const q = query(
          collection(db, 'sector_activities'),
          where('dayNumber', '==', pointData.day),
          where('type', '==', 'operacao')
        );
        const querySnapshot = await getDocs(q);
        
        // Find the activity for the correct bay
        const activityDoc = querySnapshot.docs.find(doc => {
          const data = doc.data() as SectorActivity;
          // Check if sector name matches bay
          // This is a bit loose but should work for the current data
          return data.id.includes(pointData.bay) || pointData.bay.includes(data.id);
        });

        if (activityDoc) {
          const activityData = activityDoc.data() as SectorActivity;
          const newTimelineEntry = {
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            description: `${status === 'instalado' ? 'Instalação' : 'Retirada'} de aterramento: ${pointData.id}`,
            teamId: 'OPERACAO'
          };
          
          await updateDoc(doc(db, 'sector_activities', activityDoc.id), {
            timeline: [...(activityData.timeline || []), newTimelineEntry],
            status: 'em_execucao'
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `grounding/${pointId}`);
    }
  },

  subscribeToAbnormalities(callback: (abnormalities: Abnormality[]) => void) {
    return onSnapshot(collection(db, 'abnormalities'), (snapshot) => {
      const abnormalities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Abnormality));
      callback(abnormalities);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'abnormalities');
    });
  },

  subscribeToWeather(callback: (data: WeatherData) => void) {
    return onSnapshot(doc(db, 'weather', 'current'), (doc) => {
      if (doc.exists()) {
        callback(doc.data() as WeatherData);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'weather/current');
    });
  },

  async fetchRealTimeWeather(): Promise<WeatherData | null> {
    try {
      // Coordinates for Rio Novo do Sul, ES
      const lat = -20.86;
      const lon = -40.93;
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.current) {
        const weatherData: WeatherData = {
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          rainProb: data.current.precipitation > 0 ? 100 : 0, // Open-Meteo current doesn't give prob directly, using precipitation as proxy
          timestamp: new Date().toISOString()
        };

        // Update Firestore so everyone sees the same real-time data
        await setDoc(doc(db, 'weather', 'current'), cleanData(weatherData));
        return weatherData;
      }
      return null;
    } catch (error) {
      console.warn('Weather fetch failed, using fallback data:', error);
      // Fallback data for Rio Novo do Sul
      return {
        temperature: 26,
        humidity: 75,
        windSpeed: 12,
        rainProb: 10,
        timestamp: new Date().toISOString()
      };
    }
  },

  async reportAbnormality(data: Omit<Abnormality, 'id' | 'reportedAt' | 'reportedBy'>, userId?: string) {
    try {
      const id = doc(collection(db, 'abnormalities')).id;
      await setDoc(doc(db, 'abnormalities', id), cleanData({
        ...data,
        id,
        reportedBy: userId || auth.currentUser?.uid || 'system',
        reportedAt: new Date().toISOString()
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'abnormalities');
    }
  },

  async getRisks(): Promise<Risk[]> {
    if (cache.risks) return cache.risks;
    try {
      const querySnapshot = await getDocs(collection(db, 'risks'));
      cache.risks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk));
      return cache.risks;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'risks');
      return [];
    }
  },

  async getTeams(): Promise<Team[]> {
    if (cache.teams) return cache.teams;
    try {
      const querySnapshot = await getDocs(collection(db, 'teams'));
      cache.teams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      return cache.teams;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'teams');
      return [];
    }
  },

  async getAssets(): Promise<Asset[]> {
    if (cache.assets) return cache.assets;
    try {
      const querySnapshot = await getDocs(collection(db, 'assets'));
      cache.assets = querySnapshot.docs.map(doc => doc.data() as Asset);
      return cache.assets;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'assets');
      return [];
    }
  },

  async savePMOReport(report: PMOReport) {
    try {
      await setDoc(doc(db, 'pmo_reports', report.id), cleanData({
        ...report,
        updatedAt: new Date().toISOString()
      }));
      return report.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pmo_reports/${report.id}`);
    }
  },

  async getPMOReport(reportId: string): Promise<PMOReport | null> {
    try {
      const docRef = doc(db, 'pmo_reports', reportId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as PMOReport) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `pmo_reports/${reportId}`);
      return null;
    }
  },

  subscribeToPMOReports(teamId: string | undefined, callback: (reports: PMOReport[]) => void) {
    const q = teamId 
      ? query(collection(db, 'pmo_reports'), where('teamId', '==', teamId))
      : query(collection(db, 'pmo_reports'));
    
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PMOReport));
      console.log(`Fetched ${reports.length} PMO reports for teamId: ${teamId || 'all'}`);
      callback(reports);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pmo_reports');
    });
  },

  subscribeToSectors(callback: (sectors: Sector[]) => void) {
    return onSnapshot(collection(db, 'sectors'), (snapshot) => {
      const sectors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector));
      callback(sectors);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sectors');
    });
  },

  subscribeToSectorActivities(callback: (activities: SectorActivity[]) => void) {
    return onSnapshot(collection(db, 'sector_activities'), (snapshot) => {
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SectorActivity));
      callback(activities);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sector_activities');
    });
  },

  subscribeToTeamAuthorizations(callback: (authorizations: Record<string, string>) => void) {
    return onSnapshot(collection(db, 'teams'), (snapshot) => {
      const auths: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        auths[doc.id] = doc.data().Status_Liberação || 'BLOQUEADO';
      });
      callback(auths);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teams');
    });
  },

  async updateTeamAuthorization(teamId: string, status: 'LIBERADO' | 'BLOQUEADO', userId: string) {
    try {
      const docRef = doc(db, 'teams', teamId);
      await updateDoc(docRef, {
        Status_Liberação: status,
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      });

      // SANEAMENTO: Sincronizar com as atividades do setor para manter compatibilidade
      const teamNum = parseInt(teamId.match(/\d+/)?.[0] || '1', 10);
      const activitiesSnap = await getDocs(collection(db, 'sector_activities'));
      for (const aDoc of activitiesSnap.docs) {
        await updateDoc(aDoc.ref, {
          [`CHAVE_MESTRA_EQ${teamNum}`]: status,
          [`Status_Liberação_EQ${teamNum}`]: status
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `teams/${teamId}`);
    }
  },

  async updateSectorActivity(activityId: string, data: Partial<SectorActivity>, userId?: string) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      await updateDoc(docRef, {
        ...data,
        updatedBy: userId || auth.currentUser?.uid || 'system',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async updateSectorActivityStatus(activityId: string, status: TaskStatus) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      await updateDoc(docRef, { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async validateSector(sectorId: string, userId: string) {
    try {
      const docRef = doc(db, 'sectors', sectorId);
      await updateDoc(docRef, {
        isValidated: true,
        day2Validated: true, // If fully validated, Day 2 is also done
        validatedBy: userId,
        validatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sectors/${sectorId}`);
    }
  },

  async validateSectorDay(sectorId: string, day: number, userId: string) {
    try {
      const docRef = doc(db, 'sectors', sectorId);
      const field = day === 1 ? 'day1Validated' : 'day2Validated';
      await updateDoc(docRef, {
        [field]: true,
        validatedBy: userId,
        validatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sectors/${sectorId}`);
    }
  },

  async authorizeSectorActivity(activityId: string, userId: string, teamId?: string) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      if (teamId) {
        // REESTRUTURAÇÃO: Gravação física de status 'LIBERADO' na CHAVE_MESTRA
        const teamNum = teamId.match(/\d+/)?.[0] || '1';
        await updateDoc(docRef, {
          authorizedTeams: arrayUnion(teamId),
          [`CHAVE_MESTRA_EQ${teamNum}`]: 'LIBERADO',
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        });
      } else {
        await updateDoc(docRef, {
          authorizedStart: true,
          authorizedBy: userId,
          authorizedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async requestTeamAuthorization(activityId: string, userId: string, teamId: string) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      const teamNum = teamId.match(/\d+/)?.[0] || '1';
      await updateDoc(docRef, {
        [`CHAVE_MESTRA_EQ${teamNum}`]: 'PENDENTE',
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async cancelSectorActivityAuthorization(activityId: string, userId: string, teamId: string) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      const teamNum = teamId.match(/\d+/)?.[0] || '1';
      await updateDoc(docRef, {
        authorizedTeams: arrayRemove(teamId),
        [`CHAVE_MESTRA_EQ${teamNum}`]: 'BLOQUEADO',
        updatedBy: userId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async finalizeMacro(activityId: string, userId: string) {
    try {
      const docRef = doc(db, 'sector_activities', activityId);
      await updateDoc(docRef, {
        macroFinalized: true,
        status: 'concluido',
        finalizedBy: userId,
        finalizedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sector_activities/${activityId}`);
    }
  },

  async resetTestData(userId: string) {
    try {
      // 1. Reset Tasks
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      for (const taskDoc of tasksSnap.docs) {
        const data = taskDoc.data();
        const resetActivities = (data.activities || []).map((a: any) => ({
          ...a,
          completed: false
        }));

        await updateDoc(doc(db, 'tasks', taskDoc.id), {
          status: 'pendente',
          reportId: null,
          activities: resetActivities,
          photos: [],
          measurements: {},
          groundingConfirmed: false,
          ESTAGIO_OPERACIONAL: 'PENDENTE',
          // Fields requested by the user
          data_inicio: null,
          data_fim: null,
          responsavel: null,
          data_conclusao: null,
          responsavel_pmo: null,
          respostas_pmo: [],
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        });
      }

      // 2. Clear PMO Reports and Abnormalities
      const reportsSnap = await getDocs(collection(db, 'pmo_reports'));
      for (const reportDoc of reportsSnap.docs) {
        await deleteDoc(doc(db, 'pmo_reports', reportDoc.id));
      }
      const abnormalitiesSnap = await getDocs(collection(db, 'abnormalities'));
      for (const abDoc of abnormalitiesSnap.docs) {
        await deleteDoc(doc(db, 'abnormalities', abDoc.id));
      }

      // 3. Reset Grounding
      const groundingSnap = await getDocs(collection(db, 'grounding'));
      for (const gDoc of groundingSnap.docs) {
        await updateDoc(doc(db, 'grounding', gDoc.id), {
          status: 'pendente',
          confirmedBy: null,
          confirmedAt: null
        });
      }

      // 4. Reset Sectors
      const sectorsSnap = await getDocs(collection(db, 'sectors'));
      for (const sDoc of sectorsSnap.docs) {
        await updateDoc(doc(db, 'sectors', sDoc.id), {
          day1Validated: false,
          day2Validated: false,
          isValidated: false,
          validatedBy: null,
          validatedAt: null
        });
      }

      // 5. Reset Sector Activities
      const activitiesSnap = await getDocs(collection(db, 'sector_activities'));
      for (const aDoc of activitiesSnap.docs) {
        const resetData: any = {
          status: 'pendente',
          timeline: [],
          authorizedStart: false,
          macroFinalized: false,
          authorizedTeams: [],
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        };

        // SANEAMENTO RADICAL: Apenas as novas Chaves Mestras
        for (let i = 1; i <= 5; i++) {
          resetData[`CHAVE_MESTRA_EQ${i}`] = 'BLOQUEADO';
          resetData[`Status_Liberação_EQ${i}`] = 'BLOQUEADO';
        }

        await updateDoc(doc(db, 'sector_activities', aDoc.id), resetData);
      }

      // 6. Reset Team Authorizations
      const teamsSnap = await getDocs(collection(db, 'teams'));
      for (const teamDoc of teamsSnap.docs) {
        await updateDoc(doc(db, 'teams', teamDoc.id), {
          Status_Liberação: 'BLOQUEADO',
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        });
      }

      // 7. Log the reset
      const logId = doc(collection(db, 'system_logs')).id;
      await setDoc(doc(db, 'system_logs', logId), {
        type: 'HARD_RESET',
        userId,
        timestamp: new Date().toISOString(),
        description: 'Limpeza total de dados de teste realizada pelo desenvolvedor.'
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reset_test_data');
    }
  }
};
