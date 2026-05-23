import React, { useEffect, useState } from 'react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  Select,
  StatusBanner,
} from '../../components/admin/AdminUi';
import {
  createSkill,
  deleteSkill,
  fetchSkills,
  Skill,
  updateSkill,
} from '../../services/portfolioService';

const SKILL_TYPES = [
  'language',
  'frontend',
  'backend',
  'database',
  'tool',
  'design',
  'other',
];

export const AdminSkills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('frontend');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('frontend');

  const refresh = () => {
    setLoading(true);
    fetchSkills()
      .then((list) => {
        setSkills(list);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load skills'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      await createSkill({ name: name.trim(), type });
      setName('');
      setSuccess('Skill added.');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add skill');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (skill: Skill) => {
    if (!skill.id) return;
    setEditing(skill.id);
    setEditName(skill.name);
    setEditType(skill.type);
  };

  const saveEdit = async (skillId: number) => {
    try {
      await updateSkill(skillId, { name: editName.trim(), type: editType });
      setSuccess('Skill updated.');
      setEditing(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update skill');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) return;
    setDeleting(true);
    try {
      await deleteSkill(pendingDelete.id);
      setSuccess('Skill deleted.');
      setPendingDelete(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete skill');
    } finally {
      setDeleting(false);
    }
  };

  const grouped = SKILL_TYPES.map((t) => ({
    type: t,
    items: skills.filter((s) => s.type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <AdminShell
      title="Skills"
      description="Tags that power the skills marquee on the public home page."
    >
      {error ? (
        <div className="mb-4">
          <StatusBanner tone="error" message={error} onClose={() => setError(null)} />
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <StatusBanner
            tone="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        </div>
      ) : null}

      <Card className="mb-6">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/60 mb-4">
          Add a skill
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 sm:grid-cols-[1fr_180px_auto]"
        >
          <Field label="Name" required>
            <Input
              placeholder="e.g. React"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Group">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {SKILL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" variant="primary" loading={saving}>
              <Plus size={14} />
              <span>Add</span>
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="text-sm font-mono text-theme-text/60">Loading…</div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="No skills yet"
          description="Add your stack and the public marquee will update instantly."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.type}>
              <h3 className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-accent mb-2">
                {group.type}
                <span className="ml-2 text-theme-text/40 normal-case">
                  ({group.items.length})
                </span>
              </h3>
              <div className="grid gap-2 md:grid-cols-2">
                {group.items.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 bg-theme-panel/40 border border-theme-border/30 rounded-md px-3 py-2"
                  >
                    {editing === skill.id ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                        >
                          {SKILL_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </Select>
                        <Button
                          variant="primary"
                          onClick={() => skill.id && saveEdit(skill.id)}
                        >
                          Save
                        </Button>
                        <Button variant="ghost" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-semibold">
                          {skill.name}
                        </span>
                        <Button variant="ghost" onClick={() => startEdit(skill)}>
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setPendingDelete(skill)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Delete “${pendingDelete?.name || ''}”?`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminSkills;
