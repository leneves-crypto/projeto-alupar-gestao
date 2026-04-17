import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  deleteDoc,
  WriteBatch,
  getDocsFromServer,
  query,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './maintenanceService';
import { INITIAL_TEAMS, INITIAL_RISKS, INITIAL_USERS, INITIAL_GROUNDING } from '../data/initialData';
import { MASTER_ASSETS_DATA } from '../data/masterData';
import { PMO_TEMPLATES } from '../constants/pmoTemplates';
import { INITIAL_SECTORS, INITIAL_SECTOR_ACTIVITIES } from '../data/sectorData';

/**
 * Helper to commit a batch and create a new one if it exceeds 500 operations.
 */
class BatchHandler {
  private batch: WriteBatch;
  private count: number = 0;
  private readonly limit: number = 450; // Safe margin below 500

  constructor() {
    this.batch = writeBatch(db);
  }

  async set(ref: any, data: any) {
    this.batch.set(ref, data, { merge: true });
    this.count++;
    if (this.count >= this.limit) {
      await this.commit();
    }
  }

  async delete(ref: any) {
    this.batch.delete(ref);
    this.count++;
    if (this.count >= this.limit) {
      await this.commit();
    }
  }

  async commit() {
    if (this.count > 0) {
      try {
        console.log(`Committing batch with ${this.count} operations...`);
        await this.batch.commit();
        this.batch = writeBatch(db);
        this.count = 0;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'batch_commit');
      }
    }
  }
}

export async function seedInitialData(force = false) {
  const version = 'v47_iam_check'; // Increment this to force re-seed
  console.log(`[Seeding] Starting version ${version}...`);
  try {
    const metaRef = doc(db, 'metadata', `seeding_${version}`);
    let metaSnap;
    try {
      metaSnap = await getDoc(metaRef);
    } catch (error) {
      console.warn("Could not check metadata, proceeding with seed check...");
    }

    if (metaSnap?.exists() && !force) {
      console.log(`Database already seeded (version ${version}). Skipping cleanup and seed.`);
      return;
    }

    console.log(`Starting Phase 1: Deep Cleanup (Force: ${force})...`);
    const handler = new BatchHandler();
    
    // If forcing, explicitly remove the seeding metadata first
    if (force) {
      await handler.delete(metaRef);
    }

    // DEEP CLEAN: Delete all assets, tasks, grounding points, sectors, and sector_activities
    console.log('Deleting all existing assets, tasks, grounding points, sectors, and sector_activities...');
    
    const collectionsToClean = ['assets', 'tasks', 'grounding', 'sectors', 'sector_activities', 'pmo_reports', 'abnormalities', 'teams', 'system_logs'];
    
    for (const colName of collectionsToClean) {
      const snap = await getDocsFromServer(collection(db, colName));
      console.log(`Cleaning collection: ${colName} (${snap.size} docs)`);
      for (const d of snap.docs) {
        await handler.delete(d.ref);
      }
    }
    await handler.commit();

    console.log('Starting Phase 2: Seeding Data...');

    // Seed Teams
    console.log(`Seeding ${INITIAL_TEAMS.length} teams...`);
    for (const team of INITIAL_TEAMS) {
      await handler.set(doc(db, 'teams', team.id), {
        ...team,
        Status_Liberação: 'BLOQUEADO'
      });
    }

    // Seed Assets from MASTER_ASSETS_DATA
    // Filter unique tags for the assets collection
    const uniqueAssets = Array.from(new Map(MASTER_ASSETS_DATA.map(item => [item.tag, item])).values());
    console.log(`Seeding ${uniqueAssets.length} unique assets from master table...`);
    for (const asset of uniqueAssets) {
      await handler.set(doc(db, 'assets', asset.tag), {
        tag: asset.tag,
        type: asset.type,
        pmo: asset.pmo,
        sector: asset.sector,
        manufacturer: asset.manufacturer,
        model: asset.model,
        franquia20h: asset.franquia20h,
        isActive: true
      });
    }

    // Seed Risks
    console.log(`Seeding ${INITIAL_RISKS.length} risks...`);
    for (const risk of INITIAL_RISKS) {
      await handler.set(doc(db, 'risks', risk.id), risk);
    }

    // Seed Grounding Points
    console.log(`Seeding ${INITIAL_GROUNDING.length} grounding points...`);
    for (const point of INITIAL_GROUNDING) {
      // Reset all grounding points to pendente
      await handler.set(doc(db, 'grounding', point.id), {
        ...point,
        status: 'pendente',
        confirmedBy: null,
        confirmedAt: null
      });
    }

    // Seed Sectors (Only if empty or force)
    const sectorsSnap = await getDocsFromServer(query(collection(db, 'sectors'), limit(1)));
    if (sectorsSnap.empty || force) {
      console.log(`Seeding ${INITIAL_SECTORS.length} sectors...`);
      for (const sector of INITIAL_SECTORS) {
        await handler.set(doc(db, 'sectors', sector.id), {
          ...sector,
          isValidated: false,
          day1Validated: false,
          day2Validated: false,
          validatedBy: null,
          validatedAt: null
        });
      }
    }
    await handler.commit();

    // Seed Sector Activities (Only if empty or force)
    const activitiesSnap = await getDocsFromServer(query(collection(db, 'sector_activities'), limit(1)));
    if (activitiesSnap.empty || force) {
      console.log(`Seeding ${INITIAL_SECTOR_ACTIVITIES.length} sector activities...`);
      for (const activity of INITIAL_SECTOR_ACTIVITIES) {
        const activityData: any = {
          ...activity,
          status: 'pendente',
          authorizedStart: false,
          macroFinalized: false,
          updatedAt: new Date().toISOString()
        };
        
        // REESTRUTURAÇÃO: Reset de Estado Inicial (Bloqueio Total)
        // Ao iniciar, todas as equipes devem estar BLOQUEADAS.
        for (let i = 1; i <= 5; i++) {
          activityData[`CHAVE_MESTRA_EQ${i}`] = 'BLOQUEADO';
          activityData[`Status_Liberação_EQ${i}`] = 'BLOQUEADO';
        }
        
        await handler.set(doc(db, 'sector_activities', activity.id), activityData);
      }
    }
    await handler.commit();

    // Seed Users - ONLY on initial setup, not during manual sync
    if (!force) {
      console.log(`Seeding ${INITIAL_USERS.length} users...`);
      for (const user of INITIAL_USERS) {
        if (user.email) {
          const id = user.email.replace(/[@.]/g, '_');
          await handler.set(doc(db, 'users', id), { ...user, uid: id });
        }
      }
      await handler.commit();
    }

    // Seed Tasks from MASTER_ASSETS_DATA
    console.log(`Seeding ${MASTER_ASSETS_DATA.length} tasks from master table...`);
    
    // MASTER_ASSETS_DATA is already aligned, sorted and indexed in masterData.ts
    const sortedAssets = [...MASTER_ASSETS_DATA];

    let tasksCreated = 0;

    for (let i = 0; i < sortedAssets.length; i++) {
      const item = sortedAssets[i];
      const displayIndex = item.displayIndex || (i + 1);

      // Find matching activities for this date and team
      let matchingActivities = INITIAL_SECTOR_ACTIVITIES.filter(a => 
        a.date === item.date && 
        a.assignedTeams.includes(item.teamId) &&
        a.type === 'manutencao'
      );

      if (matchingActivities.length === 0) {
        // Create a virtual activity for this date/team to ensure 100% sync with Auditoria
        const virtualActivityId = `VA-${item.date}-${item.teamId}`.replace(/-/g, '_');
        const virtualActivity = {
          id: virtualActivityId,
          sectorId: 'SEC-01', // Default to first sector
          dayNumber: 1,
          date: item.date,
          milestoneId: `VMS-${item.date}-${item.teamId}`.replace(/-/g, '_'),
          type: 'manutencao',
          description: `Manutenção Preventiva - ${item.teamId}`,
          equipment: [item.tag],
          foreman: item.leader,
          assignedTeams: [item.teamId],
          status: 'pendente',
          timeline: []
        };
        
        await handler.set(doc(db, 'sector_activities', virtualActivityId), virtualActivity);
        matchingActivities = [virtualActivity as any];
      }

      for (const activity of matchingActivities) {
        // Create a stable ID for the task
        const id = `TASK-${activity.id}-${item.tag}`.replace(/[^a-zA-Z0-9-]/g, '_');
        
        const pmoKey = item.pmo.replace(' ', '-');
        const template = PMO_TEMPLATES[pmoKey];
        const activities = template ? template.sections.flatMap(s => 
          s.items.filter(item => item.type !== 'measurement').map(item => ({
            id: item.id,
            description: item.description,
            completed: false
          }))) : [];

        const taskData = {
          id,
          assetTag: item.tag,
          teamId: item.teamId,
          status: 'pendente',
          pmo: item.pmo,
          pmo_name: template ? `${item.pmo.replace('-', ' ')} - ${template.title}` : `Checklist ${item.pmo}`,
          sectorId: activity.sectorId,
          dayNumber: activity.dayNumber,
          milestoneId: activity.milestoneId,
          activities,
          photos: [],
          measurements: {},
          groundingConfirmed: false,
          isActive: true,
          updatedAt: new Date().toISOString(),
          updatedBy: 'system',
          date: item.date,
          leader: item.leader,
          assignedTo: item.leader,
          displayIndex
        };

        await handler.set(doc(db, 'tasks', id), taskData);
        tasksCreated++;
      }
    }

    console.log(`Tasks: ${tasksCreated} created from master table.`);

    await handler.set(doc(db, 'weather', 'current'), {
      temperature: 28,
      humidity: 52,
      windSpeed: 15,
      rainProb: 5,
      timestamp: new Date().toISOString()
    });

    await handler.set(metaRef, { completed: true, timestamp: new Date().toISOString() });

    await handler.commit();
    console.log('Seeding completed successfully!');
    console.log(`Carreguei com sucesso as ${MASTER_ASSETS_DATA.length} linhas da tabela`);
    const last5 = MASTER_ASSETS_DATA.slice(-5);
    console.log('Últimas 5 tags:', last5.map(a => a.tag).join(', '));
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error; // Re-throw to handle in UI
  }
}

/**
 * Reset Simulation: Clears progress while preserving structure (Assets, Teams, Dates).
 */
export async function resetSimulation() {
  console.log('[Reset] Starting simulation reset with parallel fetching and batching...');
  const handler = new BatchHandler();

  try {
    // 1. Fetch all snapshots in parallel
    console.log('[Reset] Fetching all collections in parallel...');
    const [tasksSnap, groundingSnap, sectorsSnap, activitiesSnap, pmoReportsSnap, abnormalitiesSnap, teamsSnap] = await Promise.all([
      getDocsFromServer(collection(db, 'tasks')),
      getDocsFromServer(collection(db, 'grounding')),
      getDocsFromServer(collection(db, 'sectors')),
      getDocsFromServer(collection(db, 'sector_activities')),
      getDocsFromServer(collection(db, 'pmo_reports')),
      getDocsFromServer(collection(db, 'abnormalities')),
      getDocsFromServer(collection(db, 'teams'))
    ]);

    console.log(`[Reset] Fetched: ${tasksSnap.size} tasks, ${groundingSnap.size} grounding, ${sectorsSnap.size} sectors, ${activitiesSnap.size} activities, ${pmoReportsSnap.size} reports, ${abnormalitiesSnap.size} abnormalities, ${teamsSnap.size} teams.`);

    // 2. Clear PMO Reports, Abnormalities
    for (const d of pmoReportsSnap.docs) {
      await handler.delete(d.ref);
    }
    for (const d of abnormalitiesSnap.docs) {
      await handler.delete(d.ref);
    }
    
    // Reset team authorizations in teams collection
    for (const d of teamsSnap.docs) {
      await handler.set(d.ref, {
        Status_Liberação: 'BLOQUEADO',
        updatedBy: 'system_reset',
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Prepare all updates (these are CPU-bound and fast)
    // We don't need await here for handler.set because it only awaits when committing a full batch
    
    // Reset Tasks
    for (const d of tasksSnap.docs) {
      try {
        const data = d.data();
        const template = PMO_TEMPLATES[data.pmo];
        const resetActivities = (data.activities || []).map((a: any) => ({
          ...a,
          completed: false
        }));

        await handler.set(d.ref, {
          status: 'pendente',
          pmo_name: `${data.pmo.replace('-', ' ')} - ${template?.title || data.pmo}`,
          activities: resetActivities,
          photos: [],
          measurements: {},
          groundingConfirmed: false,
          ESTAGIO_OPERACIONAL: 'PENDENTE',
          reportId: null,
          // Fields requested by the user
          data_inicio: null,
          data_fim: null,
          responsavel: null,
          data_conclusao: null,
          responsavel_pmo: null,
          respostas_pmo: [],
          updatedAt: new Date().toISOString(),
          updatedBy: 'system_reset'
        });
      } catch (err) {
        console.error(`[Reset] Error resetting task ${d.id}:`, err);
      }
    }

    // Reset Grounding
    for (const d of groundingSnap.docs) {
      try {
        await handler.set(d.ref, {
          status: 'pendente',
          confirmedBy: null,
          confirmedAt: null
        });
      } catch (err) {
        console.error(`[Reset] Error resetting grounding ${d.id}:`, err);
      }
    }

    // Reset Sectors
    for (const d of sectorsSnap.docs) {
      try {
        await handler.set(d.ref, {
          isValidated: false,
          day1Validated: false,
          day2Validated: false,
          validatedBy: null,
          validatedAt: null
        });
      } catch (err) {
        console.error(`[Reset] Error resetting sector ${d.id}:`, err);
      }
    }

    // Reset Sector Activities
    for (const d of activitiesSnap.docs) {
      try {
        const resetData: any = {
          status: 'pendente',
          authorizedStart: false,
          macroFinalized: false,
          updatedAt: new Date().toISOString()
        };
        
        // REESTRUTURAÇÃO: Reset de Estado Inicial (Bloqueio Total)
        // Ao 'Zerar Simulação', o status de autorização de TODAS as equipes deve ser obrigatoriamente 'BLOQUEADO'.
        // Nenhuma equipe pode iniciar o dia liberada.
        for (let i = 1; i <= 5; i++) {
          resetData[`CHAVE_MESTRA_EQ${i}`] = 'BLOQUEADO';
          resetData[`Status_Liberação_EQ${i}`] = 'BLOQUEADO';
        }
        
        await handler.set(d.ref, resetData);
      } catch (err) {
        console.error(`[Reset] Error resetting activity ${d.id}:`, err);
      }
    }

    // 3. Final Commit
    console.log('[Reset] Committing final batch...');
    await handler.commit();
    console.log('[Reset] Simulation reset completed successfully!');
  } catch (error) {
    console.error('[Reset] Error resetting simulation:', error);
    throw error;
  }
}
