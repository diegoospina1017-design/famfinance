import type { AnalysisResult } from '../types';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Capture: undefined;
  Identification: { photoUrl: string; analysis: AnalysisResult };
  Diagnosis: { photoUrl: string; analysis: AnalysisResult };
  CarePlan: { photoUrl: string; analysis: AnalysisResult };
  PlantDetail: { plantId: string };
};

export type MainTabsParamList = {
  Home: undefined;
  MyPlants: undefined;
  Calendar: undefined;
  Settings: undefined;
};
