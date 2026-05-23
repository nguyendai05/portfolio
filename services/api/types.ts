export interface Award {
  id?: number;
  year: string;
  org: string;
  project: string;
  award: string;
  projectId?: number | null;
}

export interface Experiment {
  id: string;
  dbId?: number;
  code?: string;
  name: string;
  desc: string;
  projectId?: number | null;
}

export interface Skill {
  id?: number;
  name: string;
  type: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  topic: 'collaboration' | 'mentorship' | 'freelance' | 'other';
  message: string;
  status: 'new' | 'replied' | 'archived';
  userAgent: string | null;
  createdAt: string;
}

export interface AdminStats {
  projects: number;
  tools: number;
  skills: number;
  milestones: number;
  experiments: number;
  messages: number;
  newMessages: number;
  ideas: number;
}
