export interface SiteInfo {
  name: string;
  englishName: string;
  registrationInfo: string;
  purpose: string;
  lineConsultUrl: string;
  calendarUrl: string;
  recentActivitiesUrl: string;
  routesUrl: string;
}

export type DisplayMode = 'auto' | 'content' | 'link';

export interface SectionConfig {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  externalUrl?: string;
  enabled: boolean;
  sortOrder: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location: string;
  category: string;
  url: string;
  status: 'open' | 'full' | 'closed';
  sortOrder: number;
  enabled: boolean;
}

export interface HikingArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url?: string;
  displayMode: DisplayMode;
  category: string;
  sortOrder: number;
  enabled: boolean;
  updatedAt: string;
}

export interface HighlightVideo {
  id: string;
  youtubeUrl: string;
  videoId: string;
  title?: string;
  sortOrder: number;
  enabled: boolean;
  addedAt: string;
}

export interface SurveyItem {
  id: string;
  title: string;
  description: string;
  googleFormsUrl: string;
  sortOrder: number;
  enabled: boolean;
}

export interface PolicyItem {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
  enabled: boolean;
  updatedAt: string;
}

export interface SiteDatabase {
  siteInfo: SiteInfo;
  sections: SectionConfig[];
  calendarEvents: CalendarEvent[];
  hikingBasics: HikingArticle[];
  hikingTools: HikingArticle[];
  highlights: HighlightVideo[];
  surveys: SurveyItem[];
  policies: PolicyItem[];
  lastUpdated: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: string;
  error?: string;
}
