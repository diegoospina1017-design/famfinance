import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { env } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  MOCK_DIAGNOSES,
  MOCK_NOTES,
  MOCK_PLANTS,
  MOCK_REMINDERS,
} from '../lib/mockData';
import type {
  AnalysisResult,
  Plant,
  PlantDiagnosis,
  PlantNote,
  Reminder,
} from '../types';
import { nextWatering } from '../utils/nextWatering';

interface PlantContextValue {
  plants: Plant[];
  reminders: Reminder[];
  diagnoses: PlantDiagnosis[];
  notes: PlantNote[];
  loading: boolean;
  refresh: () => Promise<void>;
  addPlantFromAnalysis: (input: {
    analysis: AnalysisResult;
    photoUrl: string;
    nickname?: string;
  }) => Promise<Plant>;
  markWatered: (plantId: string) => Promise<void>;
  addNote: (plantId: string, body: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  updateReminderFrequency: (id: string, days: number) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
}

const PlantContext = createContext<PlantContextValue | null>(null);

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [diagnoses, setDiagnoses] = useState<PlantDiagnosis[]>([]);
  const [notes, setNotes] = useState<PlantNote[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    if (env.useMocks) {
      setPlants(MOCK_PLANTS);
      setReminders(MOCK_REMINDERS);
      setDiagnoses(MOCK_DIAGNOSES);
      setNotes(MOCK_NOTES);
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    try {
      const [p, r, d, n] = await Promise.all([
        sb.from('plants').select('*').eq('user_id', user.id),
        sb.from('reminders').select('*').eq('user_id', user.id),
        sb.from('diagnoses').select('*').order('created_at', { ascending: false }).limit(100),
        sb.from('notes').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (p.data) setPlants(p.data.map(rowToPlant));
      if (r.data) setReminders(r.data.map(rowToReminder));
      if (d.data) setDiagnoses(d.data.map(rowToDiagnosis));
      if (n.data)
        setNotes(
          n.data.map((row: any) => ({
            id: row.id,
            plantId: row.plant_id,
            body: row.body,
            createdAt: row.created_at,
          })),
        );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<PlantContextValue>(
    () => ({
      plants,
      reminders,
      diagnoses,
      notes,
      loading,
      refresh,
      addPlantFromAnalysis: async ({ analysis, photoUrl, nickname }) => {
        const now = new Date();
        const next = nextWatering({
          baseDays: analysis.carePlan.wateringFrequencyDays,
          humidityPreference: analysis.carePlan.humidityPreference,
          lastWateredAt: now,
        });
        const newPlant: Plant = {
          id: `local-${Date.now()}`,
          userId: user?.id ?? 'mock-user',
          nickname: nickname ?? null,
          commonName: analysis.identification.commonName,
          scientificName: analysis.identification.scientificName,
          confidence: analysis.identification.confidence,
          description: analysis.identification.description,
          coverPhotoUrl: photoUrl,
          wateringFrequencyDays: analysis.carePlan.wateringFrequencyDays,
          light: analysis.carePlan.light,
          temperatureMinC: analysis.carePlan.temperatureMinC,
          temperatureMaxC: analysis.carePlan.temperatureMaxC,
          humidityPreference: analysis.carePlan.humidityPreference,
          substrate: analysis.carePlan.substrate,
          fertilizer: analysis.carePlan.fertilizer,
          lastWateredAt: now.toISOString(),
          nextWateringAt: next.toISOString(),
          lastHealth: analysis.diagnosis.health,
          createdAt: now.toISOString(),
        };

        const newReminders: Reminder[] = [
          {
            id: `rem-w-${Date.now()}`,
            plantId: newPlant.id,
            type: 'watering',
            frequencyDays: analysis.carePlan.wateringFrequencyDays,
            nextRunAt: next.toISOString(),
            enabled: true,
          },
          {
            id: `rem-f-${Date.now()}`,
            plantId: newPlant.id,
            type: 'fertilizing',
            frequencyDays: 30,
            nextRunAt: addDays(now, 30).toISOString(),
            enabled: true,
          },
          {
            id: `rem-p-${Date.now()}`,
            plantId: newPlant.id,
            type: 'pest-check',
            frequencyDays: 14,
            nextRunAt: addDays(now, 14).toISOString(),
            enabled: true,
          },
        ];

        if (env.useMocks) {
          setPlants(prev => [newPlant, ...prev]);
          setReminders(prev => [...newReminders, ...prev]);
          return newPlant;
        }

        const sb = getSupabase();
        if (!sb || !user) throw new Error('No hay sesión activa');
        const { data: inserted, error } = await sb
          .from('plants')
          .insert({
            user_id: user.id,
            nickname,
            common_name: newPlant.commonName,
            scientific_name: newPlant.scientificName,
            confidence: newPlant.confidence,
            description: newPlant.description,
            cover_photo_url: newPlant.coverPhotoUrl,
            watering_frequency_days: newPlant.wateringFrequencyDays,
            light: newPlant.light,
            temperature_min_c: newPlant.temperatureMinC,
            temperature_max_c: newPlant.temperatureMaxC,
            humidity_preference: newPlant.humidityPreference,
            substrate: newPlant.substrate,
            fertilizer: newPlant.fertilizer,
            last_watered_at: newPlant.lastWateredAt,
            next_watering_at: newPlant.nextWateringAt,
            last_health: newPlant.lastHealth,
          })
          .select('*')
          .single();
        if (error || !inserted) throw error ?? new Error('Insert failed');
        const created = rowToPlant(inserted);
        setPlants(prev => [created, ...prev]);

        const remindersInsert = newReminders.map(rem => ({
          plant_id: created.id,
          user_id: user.id,
          type: rem.type,
          frequency_days: rem.frequencyDays,
          next_run_at: rem.nextRunAt,
          enabled: true,
        }));
        const { data: remRows } = await sb.from('reminders').insert(remindersInsert).select('*');
        if (remRows) setReminders(prev => [...remRows.map(rowToReminder), ...prev]);

        return created;
      },
      markWatered: async plantId => {
        const plant = plants.find(p => p.id === plantId);
        if (!plant) return;
        const now = new Date();
        const next = nextWatering({
          baseDays: plant.wateringFrequencyDays,
          humidityPreference: plant.humidityPreference,
          lastWateredAt: now,
        });
        setPlants(prev =>
          prev.map(p =>
            p.id === plantId
              ? { ...p, lastWateredAt: now.toISOString(), nextWateringAt: next.toISOString() }
              : p,
          ),
        );
        setReminders(prev =>
          prev.map(r =>
            r.plantId === plantId && r.type === 'watering'
              ? { ...r, nextRunAt: next.toISOString() }
              : r,
          ),
        );
        if (env.useMocks) return;
        const sb = getSupabase();
        if (!sb) return;
        await sb
          .from('plants')
          .update({ last_watered_at: now.toISOString(), next_watering_at: next.toISOString() })
          .eq('id', plantId);
        await sb
          .from('reminders')
          .update({ next_run_at: next.toISOString() })
          .eq('plant_id', plantId)
          .eq('type', 'watering');
      },
      addNote: async (plantId, body) => {
        const note: PlantNote = {
          id: `note-${Date.now()}`,
          plantId,
          body,
          createdAt: new Date().toISOString(),
        };
        setNotes(prev => [note, ...prev]);
        if (env.useMocks) return;
        const sb = getSupabase();
        if (!sb) return;
        await sb.from('notes').insert({ plant_id: plantId, body });
      },
      toggleReminder: async id => {
        let target: Reminder | undefined;
        setReminders(prev =>
          prev.map(r => {
            if (r.id !== id) return r;
            target = { ...r, enabled: !r.enabled };
            return target;
          }),
        );
        if (env.useMocks || !target) return;
        const sb = getSupabase();
        await sb?.from('reminders').update({ enabled: target.enabled }).eq('id', id);
      },
      updateReminderFrequency: async (id, days) => {
        setReminders(prev =>
          prev.map(r => (r.id === id ? { ...r, frequencyDays: days } : r)),
        );
        if (env.useMocks) return;
        const sb = getSupabase();
        await sb?.from('reminders').update({ frequency_days: days }).eq('id', id);
      },
      deletePlant: async id => {
        setPlants(prev => prev.filter(p => p.id !== id));
        setReminders(prev => prev.filter(r => r.plantId !== id));
        if (env.useMocks) return;
        const sb = getSupabase();
        await sb?.from('plants').delete().eq('id', id);
      },
    }),
    [plants, reminders, diagnoses, notes, loading, refresh, user],
  );

  return <PlantContext.Provider value={value}>{children}</PlantContext.Provider>;
}

export function usePlants(): PlantContextValue {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlants debe usarse dentro de <PlantProvider>');
  return ctx;
}

// ---------- Mappers ----------
function rowToPlant(row: any): Plant {
  return {
    id: row.id,
    userId: row.user_id,
    nickname: row.nickname,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    confidence: Number(row.confidence ?? 0),
    description: row.description ?? '',
    coverPhotoUrl: row.cover_photo_url,
    wateringFrequencyDays: row.watering_frequency_days,
    light: row.light ?? '',
    temperatureMinC: Number(row.temperature_min_c ?? 0),
    temperatureMaxC: Number(row.temperature_max_c ?? 0),
    humidityPreference: row.humidity_preference ?? 50,
    substrate: row.substrate ?? '',
    fertilizer: row.fertilizer ?? '',
    lastWateredAt: row.last_watered_at,
    nextWateringAt: row.next_watering_at,
    lastHealth: row.last_health ?? 'green',
    createdAt: row.created_at,
  };
}
function rowToReminder(row: any): Reminder {
  return {
    id: row.id,
    plantId: row.plant_id,
    type: row.type,
    frequencyDays: row.frequency_days,
    nextRunAt: row.next_run_at,
    enabled: row.enabled,
  };
}
function rowToDiagnosis(row: any): PlantDiagnosis {
  return {
    id: row.id,
    plantId: row.plant_id,
    photoUrl: row.photo_url,
    severity: row.severity,
    health: row.health,
    issues: row.issues ?? [],
    summary: row.summary ?? '',
    lowConfidenceWarning: row.low_confidence ?? false,
    lowConfidenceReason: null,
    recommendedActions: row.recommended_actions ?? [],
    avoid: row.avoid ?? [],
    createdAt: row.created_at,
  };
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
