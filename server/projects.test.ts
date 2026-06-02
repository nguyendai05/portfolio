import { describe, expect, it } from 'vitest';
import { listProjects, type ProjectRow } from './projects';

type QueryResult = [unknown[], unknown];

class FakeConnection {
  calls: Array<{ query: string; params?: unknown[] }> = [];

  constructor(private readonly results: QueryResult[]) {}

  async execute(query: string, params?: unknown[]): Promise<QueryResult> {
    this.calls.push({ query, params });
    const next = this.results.shift();
    if (!next) throw new Error(`Unexpected query: ${query}`);
    return next;
  }
}

const projectRows: ProjectRow[] = [
  {
    id: 1,
    slug: 'flagship',
    title: 'Flagship',
    summary: 'Short summary',
    description: 'Main project',
    category: 'Full-Stack Platform',
    project_type: 'project',
    image_url: 'https://example.com/flagship.jpg',
    link: 'https://example.com',
    featured: 1,
    created_at: '2026-01-01 00:00:00',
    updated_at: '2026-01-02 00:00:00',
  },
  {
    id: 2,
    slug: 'toolkit',
    title: 'Toolkit',
    summary: null,
    description: 'Useful tool',
    category: 'Tooling',
    project_type: 'tool',
    image_url: 'https://example.com/tool.jpg',
    link: null,
    featured: 0,
    created_at: '2026-01-02 00:00:00',
  },
];

describe('listProjects', () => {
  it('loads project extras in batched queries without changing DTO shape', async () => {
    const conn = new FakeConnection([
      [projectRows, []],
      [
        [
          { project_id: 1, name: 'React' },
          { project_id: 1, name: 'TypeScript' },
          { project_id: 2, name: 'Vite' },
        ],
        [],
      ],
      [
        [
          { project_id: 1, name: 'Architecture' },
          { project_id: 1, name: 'Deployment' },
        ],
        [],
      ],
    ]);

    const projects = await listProjects(conn as never);

    expect(projects).toEqual([
      {
        id: 1,
        slug: 'flagship',
        title: 'Flagship',
        summary: 'Short summary',
        category: 'Full-Stack Platform',
        image: 'https://example.com/flagship.jpg',
        description: 'Main project',
        technologies: ['React', 'TypeScript'],
        link: 'https://example.com',
        featured: true,
        phases: ['Architecture', 'Deployment'],
        projectType: 'project',
        createdAt: '2026-01-01 00:00:00',
        updatedAt: '2026-01-02 00:00:00',
      },
      {
        id: 2,
        slug: 'toolkit',
        title: 'Toolkit',
        category: 'Tooling',
        image: 'https://example.com/tool.jpg',
        description: 'Useful tool',
        technologies: ['Vite'],
        featured: false,
        projectType: 'tool',
        createdAt: '2026-01-02 00:00:00',
      },
    ]);
    expect(conn.calls).toHaveLength(3);
  });

  it('keeps the project type filter in the primary query', async () => {
    const conn = new FakeConnection([
      [[projectRows[0]], []],
      [[{ project_id: 1, name: 'React' }], []],
      [[], []],
    ]);

    await listProjects(conn as never, 'project');

    expect(conn.calls[0]).toMatchObject({ params: ['project'] });
    expect(conn.calls[0].query).toContain('WHERE project_type = ?');
  });
});
