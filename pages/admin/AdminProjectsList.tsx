import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  ExternalLink,
  FolderKanban,
  Plus,
  Search,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  ConfirmModal,
  EmptyState,
  Input,
  Select,
  StatusBanner,
  TagChip,
} from '../../components/admin/AdminUi';
import {
  deleteProject,
  fetchAllProjects,
} from '../../services/portfolioService';
import { Project } from '../../types';

interface Props {
  mode: 'projects' | 'tools';
}

export const AdminProjectsList: React.FC<Props> = ({ mode }) => {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAllProjects()
      .then((all) => {
        if (!active) return;
        setItems(all);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const scoped = useMemo(
    () =>
      items.filter((p) =>
        mode === 'tools'
          ? p.projectType === 'tool'
          : p.projectType !== 'tool',
      ),
    [items, mode],
  );

  const categories = useMemo(
    () => Array.from(new Set(scoped.map((p) => p.category))).sort(),
    [scoped],
  );

  const filtered = scoped.filter((p) => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      (p.slug || '').toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === 'all' || p.category === category;
    return matchesQuery && matchesCategory;
  });

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProject(pendingDelete.id);
      setSuccess(
        `“${pendingDelete.title}” has been deleted.`,
      );
      setPendingDelete(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const title = mode === 'tools' ? 'Tools' : 'Projects';
  const newHref =
    mode === 'tools' ? '/admin/projects/new?type=tool' : '/admin/projects/new';
  const sectionIcon = mode === 'tools' ? Wrench : FolderKanban;

  return (
    <AdminShell
      title={title}
      description={
        mode === 'tools'
          ? 'Personal utility tools and applications listed on /work.'
          : 'Case studies and portfolio projects published on /work.'
      }
      actions={
        <Link to={newHref}>
          <Button variant="primary">
            <Plus size={14} />
            <span>New {mode === 'tools' ? 'tool' : 'project'}</span>
          </Button>
        </Link>
      }
    >
      {success ? (
        <div className="mb-4">
          <StatusBanner
            tone="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        </div>
      ) : null}
      {error ? (
        <div className="mb-4">
          <StatusBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      ) : null}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text/40"
          />
          <Input
            placeholder={`Search ${title.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-theme-text/60 font-mono">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={React.createElement(sectionIcon, { size: 28 })}
          title={
            scoped.length === 0
              ? `No ${title.toLowerCase()} yet`
              : 'No matches'
          }
          description={
            scoped.length === 0
              ? `Create your first ${mode === 'tools' ? 'tool' : 'project'} to populate the public page.`
              : 'Try a different search or category filter.'
          }
          action={
            scoped.length === 0 ? (
              <Link to={newHref}>
                <Button variant="primary">
                  <Plus size={14} />
                  <span>Create the first one</span>
                </Button>
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <article
              key={project.id}
              className="group bg-theme-panel/40 border border-theme-border/30 rounded-md overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-theme-bg/60 overflow-hidden border-b border-theme-border/20">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-theme-text/30 text-xs font-mono">
                    no image
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-theme-text/50">
                      {project.category}
                    </div>
                    <h3 className="mt-1 text-base font-bold leading-tight line-clamp-2">
                      {project.title}
                    </h3>
                  </div>
                  {project.featured ? (
                    <span
                      title="Featured"
                      className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-theme-accent/50 text-theme-accent rounded-md"
                    >
                      <Star size={10} fill="currentColor" /> featured
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-theme-text/60 line-clamp-3">
                  {project.description}
                </p>
                {project.technologies && project.technologies.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 6).map((t) => (
                      <TagChip key={t} label={t} />
                    ))}
                    {project.technologies.length > 6 ? (
                      <span className="text-[10px] font-mono text-theme-text/40">
                        +{project.technologies.length - 6}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-theme-border/20">
                  <div className="flex gap-2">
                    <Link to={`/admin/projects/${project.id}/edit`}>
                      <Button variant="secondary">
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      onClick={() => setPendingDelete(project)}
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </Button>
                  </div>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-theme-text/60 hover:text-theme-accent"
                    >
                      Open
                      <ExternalLink size={11} />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Delete “${pendingDelete?.title || ''}”?`}
        description="This permanently removes the entry from the database. Linked technologies and phases are kept for reuse."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminProjectsList;
