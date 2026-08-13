import { useCallback, useEffect, useRef, useState } from 'react';
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

export type ResourceStatus = 'loading' | 'success' | 'error';

export interface ApiHookState<T> {
  data: T | null;
  status: ResourceStatus;
  loading: boolean;
  isStale: boolean;
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

type LoaderResult<T> = { value: T; errors: unknown[] };
type SignalLoader<T> = (signal: AbortSignal) => Promise<T>;

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
  const load = useCallback(async (signal: AbortSignal) => {
    const [projects, skills, awards, experiments] = await Promise.allSettled([
      fetchProjects(signal),
      fetchSkills(signal),
      fetchAwards(signal),
      fetchExperiments(signal),
    ]);
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const results = [projects, skills, awards, experiments];
    return {
      value: {
        projects: getSettledValue(projects, []),
        skills: getSettledValue(skills, []),
        awards: getSettledValue(awards, []),
        experiments: getSettledValue(experiments, []),
      },
      errors: collectErrors(results),
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
  const load = useCallback(async (signal: AbortSignal) => ({
    value: splitWorkProjects(await fetchAllProjects(signal)),
    errors: [],
  }), []);
  return useSettledResource(load, { projects: [], tools: [] });
}

function useApiResource<T>(loader: SignalLoader<T>, fallback: T): ApiHookState<T> {
  const load = useCallback(async (signal: AbortSignal): Promise<LoaderResult<T>> => {
    try {
      return { value: await loader(signal), errors: [] };
    } catch (error) {
      if (signal.aborted) throw error;
      return { value: fallback, errors: [error] };
    }
  }, [fallback, loader]);
  return useSettledResource(load, null);
}

function useSettledResource<T>(
  loader: (signal: AbortSignal) => Promise<LoaderResult<T>>,
  initialData: T | null,
): ApiHookState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [status, setStatus] = useState<ResourceStatus>('loading');
  const [errors, setErrors] = useState<unknown[]>([]);
  const controllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      const result = await loader(controller.signal);
      if (controller.signal.aborted) return;
      setData(result.value);
      setErrors(result.errors);
      setStatus(result.errors.length > 0 ? 'error' : 'success');
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrors([error]);
      setStatus('error');
    }
  }, [loader]);

  useEffect(() => {
    void execute();
    return () => controllerRef.current?.abort();
  }, [execute]);

  return {
    data,
    status,
    loading: status === 'loading',
    isStale: status === 'error' && data !== null,
    error: errors[0] ?? null,
    errors,
    refetch: execute,
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
      if (project.projectType === 'tool') acc.tools?.push(project);
      else acc.projects?.push(project);
      return acc;
    },
    { projects: [], tools: [] },
  );
}
