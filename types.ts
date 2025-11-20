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
  title: string;
  category: string;
  image: string;
  description: string;
  technologies: string[];
  link?: string;
  featured?: boolean;
  phases?: string[];
}