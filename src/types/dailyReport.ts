export type WeatherCondition =
  | "Clear"
  | "Cloudy"
  | "Rain"
  | "Snow"
  | "Windy"
  | "Hot"
  | "Cold";

export type GroundCondition =
  | "Dry"
  | "Damp"
  | "Muddy"
  | "Frozen"
  | "Icy";

export interface DailyReportInput {
  date: string; // YYYY-MM-DD
  dayKey: string; // YYYYMMDD for indexing/filters
  siteId: string;
  siteName: string;
  shiftStart: string; // HH:MM (24h)
  shiftEnd: string; // HH:MM (24h)
  totalHours?: number;
  crewCount?: number;
  crewNotes?: string;
  weather?: WeatherCondition[];
  temperatureF?: number;
  ground?: GroundCondition[];
  tasksPerformed: string;
  equipmentUsed?: string;
  hazardsObserved?: string;
  incidentsOrNearMisses?: string;
  materials?: string;
  jsaCompleted?: boolean;
  toolboxTalk?: boolean;
  toolboxTopic?: string;
  notes?: string;
  signatureDataUrl: string; // submitter signature
}

export interface DailyReport extends DailyReportInput {
  id: string;
  createdAt: number;
  createdBy: string; // uid
  createdByName?: string;
}

