export enum Section {
  HERO = 'hero',
  PHILOSOPHY = 'philosophy',
  SERVICES = 'services',
  ABOUT = 'about',
  CONTACT = 'contact'
}

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
}

export interface Project {
  id: number;
  /**
   * Stable slug used to look up localized copy in `data/projectTranslations.ts`.
   * The DB / API expose the same slug, so frontend can localize regardless of
   * whether the data comes from the API or the local mock fallback.
   */
  slug?: string;
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
  link?: string;
  featured?: boolean;
  phases?: string[];
}