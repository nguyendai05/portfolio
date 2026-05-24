import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../../types';
import { fetchAwards } from './awards';
import { fetchExperiments } from './experiments';
import { fetchAllProjects, fetchProjects, fetchTools } from './projects';
import { fetchSkills } from './skills';
import type { Award, Experiment, Skill } from './types';

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_SKILLS: Skill[] = [];
const EMPTY_AWARDS: Award[] = [];
const EMPTY_EXPERIMENTS: Experiment[] = [];

export interface ApiHookState<T> {
  data: T | null;
  loading: boolean;
  error: unknown | null;
  errors: unknown[];
  refetch: () => Promise<void>;
}

interface HomePortfolioData {
  projects: Project[] | null;
  skills: Skill[] | null;
  awards: Award[] | null;
  experiments: Experiment[] | null;
}

interface WorkPortfolioData {
  projects: Project[] | null;
  tools: Project[] | null;
}

const EMPTY_WORK_DATA: WorkPortfolioData = {
  projects: [],
  tools: [],
};

let workPortfolioCache: WorkPortfolioData | null = null;

export function useProjects(): ApiHookState<Project[]> {
  return useApiResource(fetchProjects, EMPTY_PROJECTS);
}

export function useTools(): ApiHookState<Project[]> {
  return useApiResource(fetchTools, EMPTY_PROJECTS);
}

export function useSkills(): ApiHookState<Skill[]> {
  return useApiResource(fetchSkills, EMPTY_SKILLS);
}

export function useAwards(): ApiHookState<Award[]> {
  return useApiResource(fetchAwards, EMPTY_AWARDS);
}

export function useExperiments(): ApiHookState<Experiment[]> {
  return useApiResource(fetchExperiments, EMPTY_EXPERIMENTS);
}

export function useHomePortfolioData(): ApiHookState<HomePortfolioData> {
  const load = useCallback(async () => {
    const [projects, skills, awards, experiments] = await Promise.allSettled([
      fetchProjects(),
      fetchSkills(),
      fetchAwards(),
      fetchExperiments(),
    ]);

    const results = [projects, skills, awards, experiments];
    const errors = collectErrors(results);
    return {
      value: {
        projects: getSettledValue(projects, []),
        skills: getSettledValue(skills, []),
        awards: getSettledValue(awards, []),
        experiments: getSettledValue(experiments, []),
      },
      errors,
    };
  }, []);

  return useSettledResource<HomePortfolioData>(load, {
    projects: null,
    skills: null,
    awards: null,
    experiments: null,
  });
}

export function useWorkPortfolioData(): ApiHookState<WorkPortfolioData> {
  const load = useCallback(async () => {
    try {
      const value = splitWorkProjects(await fetchAllProjects());
      workPortfolioCache = value;
      return { value, errors: [] };
    } catch (error) {
      return { value: workPortfolioCache ?? EMPTY_WORK_DATA, errors: [error] };
    }
  }, []);

  return useSettledResource<WorkPortfolioData>(load, workPortfolioCache);
}

function useApiResource<T>(loader: () => Promise<T>, fallback: T): ApiHookState<T> {
  const load = useCallback(async () => {
    try {
      return { value: await loader(), errors: [] };
    } catch (error) {
      return { value: fallback, errors: [error] };
    }
  }, [fallback, loader]);

  return useSettledResource<T>(load, null);
}

function useSettledResource<T>(
  loader: () => Promise<{ value: T; errors: unknown[] }>,
  initialData: T | null,
): ApiHookState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<unknown[]>([]);

  const refetch = useCallback(async () => {
    setLoading(true);
    const result = await loader();
    setData(result.value);
    setErrors(result.errors);
    setLoading(false);
  }, [loader]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const result = await loader();
      if (cancelled) return;
      setData(result.value);
      setErrors(result.errors);
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [loader]);

  return {
    data,
    loading,
    error: errors[0] ?? null,
    errors,
    refetch,
  };
}

function collectErrors(results: PromiseSettledResult<unknown>[]): unknown[] {
  return results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map((result) => result.reason);
}

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

function splitWorkProjects(projects: Project[]): WorkPortfolioData {
  return projects.reduce<WorkPortfolioData>(
    (acc, project) => {
      if (project.projectType === 'tool') {
        acc.tools?.push(project);
      } else {
        acc.projects?.push(project);
      }
      return acc;
    },
    { projects: [], tools: [] },
  );
}
