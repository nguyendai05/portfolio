// Portfolio API Service - Fetch data from database
import { Project } from '../types';

const API_BASE = '/api';

// --- Types ---
export interface Award {
    id?: number;
    year: string;
    org: string;
    project: string;
    award: string;
    projectId?: number;
}

export interface Experiment {
    id: string;
    name: string;
    desc: string;
    projectId?: number;
}

export interface Skill {
    name: string;
    type: string;
}

// --- Projects ---
export async function fetchProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects?type=project`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch projects');
    return json.data;
}

export async function fetchTools(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects?type=tool`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch tools');
    return json.data;
}

export async function fetchAllProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch projects');
    return json.data;
}

export async function fetchProjectBySlug(slug: string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects?slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch project');
    return json.data;
}

// --- Skills ---
export async function fetchSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/skills`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch skills');
    return json.data.skills;
}

export async function fetchSkillNames(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/skills`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch skills');
    return json.data.names;
}

// --- Awards ---
export async function fetchAwards(): Promise<Award[]> {
    const res = await fetch(`${API_BASE}/awards`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch awards');
    return json.data;
}

// --- Experiments ---
export async function fetchExperiments(): Promise<Experiment[]> {
    const res = await fetch(`${API_BASE}/experiments`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch experiments');
    return json.data;
}
