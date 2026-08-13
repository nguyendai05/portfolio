import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Image as ImageIcon,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  Card,
  ConfirmModal,
  Field,
  Input,
  Select,
  StatusBanner,
  TagChip,
  Textarea,
} from '../../components/admin/AdminUi';
import {
  ProjectFormPayload,
  createProject,
  deleteProject,
  fetchProjectById,
  updateProject,
} from '../../services/portfolioService';
import { Project } from '../../types';

interface Props {
  mode: 'create' | 'edit';
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

interface FormState {
  title: string;
  slug: string;
  slugLocked: boolean;
  summary: string;
  description: string;
  category: string;
  projectType: 'project' | 'tool';
  imageUrl: string;
  link: string;
  featured: boolean;
  technologies: string[];
  phases: string[];
  techInput: string;
  phaseInput: string;
}

const EMPTY_STATE: FormState = {
  title: '',
  slug: '',
  slugLocked: false,
  summary: '',
  description: '',
  category: '',
  projectType: 'project',
  imageUrl: '',
  link: '',
  featured: false,
  technologies: [],
  phases: [],
  techInput: '',
  phaseInput: '',
};

function fromProject(project: Project): FormState {
  return {
    title: project.title,
    slug: project.slug || '',
    slugLocked: true,
    summary: '',
    description: project.description,
    category: project.category,
    projectType:
      (project as { projectType?: 'project' | 'tool' }).projectType || 'project',
    imageUrl: project.image,
    link: project.link || '',
    featured: Boolean(project.featured),
    technologies: project.technologies || [],
    phases: project.phases || [],
    techInput: '',
    phaseInput: '',
  };
}

export const AdminProjectForm: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'tool' ? 'tool' : 'project';

  const [form, setForm] = useState<FormState>({
    ...EMPTY_STATE,
    projectType: initialType,
  });
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let active = true;
    setLoading(true);
    fetchProjectById(Number(id))
      .then((project) => {
        if (!active) return;
        setForm(fromProject(project));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load project');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, id]);

  // Auto-slug while user types (unless they have manually edited it).
  useEffect(() => {
    if (form.slugLocked) return;
    setForm((prev) => ({ ...prev, slug: slugify(prev.title) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addChip = (kind: 'technologies' | 'phases', raw: string) => {
    const parts = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setForm((prev) => {
      const current = prev[kind];
      const next = [...current];
      for (const part of parts) {
        if (!next.some((x) => x.toLowerCase() === part.toLowerCase())) {
          next.push(part);
        }
      }
      return { ...prev, [kind]: next };
    });
  };

  const removeChip = (kind: 'technologies' | 'phases', index: number) =>
    setForm((prev) => ({
      ...prev,
      [kind]: prev[kind].filter((_, i) => i !== index),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim()) return setError('Title is required.');
    if (!form.description.trim()) return setError('Description is required.');
    if (!form.category.trim()) return setError('Category is required.');
    if (!form.imageUrl.trim()) return setError('Image URL is required.');

    const payload: ProjectFormPayload = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      summary: form.summary.trim() || null,
      description: form.description.trim(),
      category: form.category.trim(),
      projectType: form.projectType,
      imageUrl: form.imageUrl.trim(),
      link: form.link.trim() || null,
      featured: form.featured,
      technologies: form.technologies,
      phases: form.phases,
    };

    setSubmitting(true);
    try {
      if (mode === 'create') {
        const created = await createProject(payload);
        setSuccess(`Created “${created.title}”.`);
        navigate(`/admin/projects/${created.id}/edit`, { replace: true });
      } else if (id) {
        const updated = await updateProject(Number(id), payload);
        setForm(fromProject(updated));
        setSuccess('Changes saved.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteProject(Number(id));
      navigate(form.projectType === 'tool' ? '/admin/tools' : '/admin/projects', {
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const title = mode === 'create' ? 'New project' : `Edit project`;
  const previewSlug = useMemo(
    () => form.slug || slugify(form.title) || 'untitled',
    [form.slug, form.title],
  );

  return (
    <AdminShell
      title={title}
      description={
        mode === 'create'
          ? 'Add a new entry to the database. It will show up on the public site immediately after save.'
          : `Update project “${form.title || ''}”.`
      }
      actions={
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} />
          <span>Back</span>
        </Button>
      }
    >
      {loading ? (
        <div className="text-sm font-mono text-theme-text/60">Loading…</div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {error ? (
              <StatusBanner tone="error" message={error} onClose={() => setError(null)} />
            ) : null}
            {success ? (
              <StatusBanner
                tone="success"
                message={success}
                onClose={() => setSuccess(null)}
              />
            ) : null}

            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-4">
                Basics
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Title" required>
                    <Input
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                      placeholder="e.g. Xuni Dizan Resource Hub"
                    />
                  </Field>
                </div>
                <Field label="Slug" hint="Auto-generated from title. You can override.">
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      update('slug', slugify(e.target.value));
                      update('slugLocked', true);
                    }}
                    placeholder="xuni-dizan-resource-hub"
                  />
                </Field>
                <Field label="Category" required>
                  <Input
                    value={form.category}
                    onChange={(e) => update('category', e.target.value)}
                    placeholder="Full-Stack Platform"
                  />
                </Field>
                <Field label="Type" required>
                  <Select
                    value={form.projectType}
                    onChange={(e) =>
                      update(
                        'projectType',
                        e.target.value === 'tool' ? 'tool' : 'project',
                      )
                    }
                  >
                    <option value="project">Project</option>
                    <option value="tool">Tool</option>
                  </Select>
                </Field>
                <Field label="External link" hint="Optional. Live URL or GitHub repo.">
                  <Input
                    type="url"
                    value={form.link}
                    onChange={(e) => update('link', e.target.value)}
                    placeholder="https://…"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Summary" hint="Optional one-liner shown in some compact views.">
                    <Input
                      value={form.summary}
                      onChange={(e) => update('summary', e.target.value)}
                      placeholder="A short, scannable description"
                      maxLength={255}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Description" required>
                    <Textarea
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="Tell the story: problem, design, implementation, results."
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm text-theme-text/80">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => update('featured', e.target.checked)}
                      className="w-4 h-4 accent-theme-accent"
                    />
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} className="text-theme-accent" />
                      Featured — surfaces first on the public Work page
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-4">
                Cover image
              </h2>
              <Field label="Image URL" required hint="Cloudinary or any public HTTPS URL.">
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => update('imageUrl', e.target.value)}
                  placeholder="https://res.cloudinary.com/…"
                />
              </Field>
              <div className="mt-4 aspect-[16/9] bg-theme-bg/60 border border-theme-border/30 rounded-md overflow-hidden flex items-center justify-center">
                {form.imageUrl ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img
                    src={form.imageUrl}
                    alt="Cover preview"
                    className="w-full h-full object-contain p-2 sm:p-3"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-theme-text/40">
                    <ImageIcon size={20} />
                    <span className="text-xs font-mono">image preview</span>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-4">
                Technologies
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.technologies.map((tech, i) => (
                  <TagChip
                    key={`${tech}-${i}`}
                    label={tech}
                    onRemove={() => removeChip('technologies', i)}
                  />
                ))}
                {form.technologies.length === 0 ? (
                  <span className="text-[11px] font-mono text-theme-text/40">
                    No technologies yet — add some below.
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.techInput}
                  onChange={(e) => update('techInput', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addChip('technologies', form.techInput);
                      update('techInput', '');
                    }
                  }}
                  placeholder="React, Tailwind CSS, MySQL…"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    addChip('technologies', form.techInput);
                    update('techInput', '');
                  }}
                >
                  Add
                </Button>
              </div>
            </Card>

            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-4">
                Phases
                <span className="ml-2 text-theme-text/40 normal-case">(ordered)</span>
              </h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.phases.map((phase, i) => (
                  <TagChip
                    key={`${phase}-${i}`}
                    label={`${i + 1}. ${phase}`}
                    tone="accent"
                    onRemove={() => removeChip('phases', i)}
                  />
                ))}
                {form.phases.length === 0 ? (
                  <span className="text-[11px] font-mono text-theme-text/40">
                    Concept → Design → Development → Deployment…
                  </span>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.phaseInput}
                  onChange={(e) => update('phaseInput', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addChip('phases', form.phaseInput);
                      update('phaseInput', '');
                    }
                  }}
                  placeholder="Concept, Design, Development…"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    addChip('phases', form.phaseInput);
                    update('phaseInput', '');
                  }}
                >
                  Add
                </Button>
              </div>
            </Card>
          </div>

          <aside className="lg:col-span-1 space-y-4 lg:sticky lg:top-6 self-start">
            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60">
                Live preview
              </h2>
              <div className="mt-3 border border-theme-border/30 rounded-md overflow-hidden bg-theme-bg/40">
                <div className="aspect-[16/10] rounded-md bg-theme-panel/70">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="preview"
                      className="w-full h-full object-contain p-2 sm:p-3"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-theme-text/30 text-xs font-mono">
                      no image
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-theme-text/50">
                      {form.category || 'Category'}
                    </span>
                    {form.featured ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-theme-accent/50 text-theme-accent rounded-md">
                        <Star size={10} fill="currentColor" /> featured
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-base font-bold leading-tight">
                    {form.title || 'Untitled project'}
                  </h3>
                  <p className="text-xs text-theme-text/60 line-clamp-3">
                    {form.description || 'Description will appear here.'}
                  </p>
                  {form.technologies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {form.technologies.slice(0, 6).map((t, i) => (
                        <TagChip key={i} label={t} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card>
              <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-3">
                Meta
              </h2>
              <ul className="text-xs font-mono space-y-1.5">
                <li className="flex justify-between gap-2">
                  <span className="text-theme-text/50">slug</span>
                  <span className="text-theme-text/80 truncate">{previewSlug}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-theme-text/50">type</span>
                  <span className="text-theme-text/80">{form.projectType}</span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-theme-text/50">tech</span>
                  <span className="text-theme-text/80">
                    {form.technologies.length}
                  </span>
                </li>
                <li className="flex justify-between gap-2">
                  <span className="text-theme-text/50">phases</span>
                  <span className="text-theme-text/80">{form.phases.length}</span>
                </li>
              </ul>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" variant="primary" loading={submitting}>
                <Save size={14} />
                <span>{mode === 'create' ? 'Create' : 'Save changes'}</span>
              </Button>
              {mode === 'edit' ? (
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={14} />
                  <span>Delete project</span>
                </Button>
              ) : null}
            </div>
          </aside>
        </form>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Delete this project?"
        description="This will permanently remove the entry from the database."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminProjectForm;