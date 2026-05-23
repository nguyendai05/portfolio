import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  StatusBanner,
} from '../../components/admin/AdminUi';
import {
  Award,
  createAward,
  deleteAward,
  fetchAwards,
  updateAward,
} from '../../services/portfolioService';

const emptyForm: Award = { year: '', org: '', project: '', award: '' };

export const AdminMilestones: React.FC = () => {
  const [items, setItems] = useState<Award[]>([]);
  const [form, setForm] = useState<Award>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Award | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchAwards()
      .then((list) => {
        setItems(list);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load milestones'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.year || !form.org || !form.project || !form.award) {
      return setError('All fields are required');
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAward(editingId, form);
        setSuccess('Milestone updated.');
      } else {
        await createAward(form);
        setSuccess('Milestone added.');
      }
      setForm(emptyForm);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (award: Award) => {
    setEditingId(award.id ?? null);
    setForm({
      year: award.year,
      org: award.org,
      project: award.project,
      award: award.award,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (!pendingDelete?.id) return;
    setDeleting(true);
    try {
      await deleteAward(pendingDelete.id);
      setSuccess('Milestone deleted.');
      setPendingDelete(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell
      title="Milestones"
      description="Awards, recognitions, and key checkpoints displayed on the home timeline."
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
          {editingId ? 'Edit milestone' : 'Add milestone'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Year" required>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2024"
              min={1900}
              max={2100}
            />
          </Field>
          <Field label="Organization" required>
            <Input
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
              placeholder="ACME University"
            />
          </Field>
          <Field label="Project / Subject" required>
            <Input
              value={form.project}
              onChange={(e) => setForm({ ...form, project: e.target.value })}
              placeholder="Capstone Hack"
            />
          </Field>
          <Field label="Award / Title" required>
            <Input
              value={form.award}
              onChange={(e) => setForm({ ...form, award: e.target.value })}
              placeholder="1st Place"
            />
          </Field>
          <div className="md:col-span-2 lg:col-span-4 flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>
              <Plus size={14} />
              <span>{editingId ? 'Save changes' : 'Add'}</span>
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="text-sm font-mono text-theme-text/60">Loading…</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Trophy size={28} />}
          title="No milestones yet"
          description="Add achievements, certifications, or hackathon wins to populate the home timeline."
        />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="flex items-start gap-4 flex-wrap">
              <div className="text-3xl font-black tabular-nums text-theme-accent w-20 shrink-0">
                {item.year}
              </div>
              <div className="flex-1 min-w-[240px]">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-theme-text/50">
                  {item.org}
                </div>
                <h3 className="text-base font-bold mt-1">{item.award}</h3>
                <p className="text-sm text-theme-text/70">{item.project}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(item)}>
                  <Pencil size={12} />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingDelete(item)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title={`Delete milestone “${pendingDelete?.award || ''}”?`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminMilestones;
