export type HealthLevel = 'green' | 'yellow' | 'red';
export type Severity = 'low' | 'medium' | 'high';

export type IssueKey =
  | 'yellow-leaves'
  | 'spots'
  | 'pests'
  | 'overwatering'
  | 'underwatering'
  | 'fungus'
  | 'sunburn'
  | 'nutrient-deficiency'
  | 'general-stress'
  | 'other';

export interface Issue {
  key: IssueKey;
  label: string;
  detail: string;
  severity: Severity;
}

export interface Recommendation {
  id: string;
  label: string;
  dueInDays: number;
}

export interface Identification {
  commonName: string;
  scientificName: string | null;
  confidence: number;
  description: string;
}

export interface Diagnosis {
  severity: Severity;
  health: HealthLevel;
  issues: Issue[];
  summary: string;
  lowConfidenceWarning: boolean;
  lowConfidenceReason: string | null;
}

export interface CarePlan {
  wateringFrequencyDays: number;
  light: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  humidityPreference: number;
  substrate: string;
  fertilizer: string;
  next7Days: Recommendation[];
  avoid: string[];
}

export interface AnalysisResult {
  identification: Identification;
  diagnosis: Diagnosis;
  carePlan: CarePlan;
}

export interface IdentifyResponse {
  analysis: AnalysisResult;
  suggestedNextWateringAt: string;
}

export type ReminderType = 'watering' | 'fertilizing' | 'pest-check';

export interface Reminder {
  id: string;
  plantId: string;
  type: ReminderType;
  frequencyDays: number;
  nextRunAt: string;
  enabled: boolean;
}

export interface Plant {
  id: string;
  userId: string;
  nickname: string | null;
  commonName: string;
  scientificName: string | null;
  confidence: number;
  description: string;
  coverPhotoUrl: string | null;
  wateringFrequencyDays: number;
  light: string;
  temperatureMinC: number;
  temperatureMaxC: number;
  humidityPreference: number;
  substrate: string;
  fertilizer: string;
  lastWateredAt: string | null;
  nextWateringAt: string | null;
  lastHealth: HealthLevel;
  createdAt: string;
}

export interface PlantDiagnosis extends Diagnosis {
  id: string;
  plantId: string;
  photoUrl: string | null;
  recommendedActions: Recommendation[];
  avoid: string[];
  createdAt: string;
}

export interface PlantNote {
  id: string;
  plantId: string;
  body: string;
  createdAt: string;
}
