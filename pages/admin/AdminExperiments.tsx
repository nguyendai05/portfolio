import React, { useEffect, useState } from 'react';
import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Input,
  StatusBanner,
  Textarea,
} from '../../components/admin/AdminUi';
import {
  Experiment,
  createExperiment,
  deleteExperiment,
  fetchExperiments,
  updateExperiment,
} from '../../services/portfolioService';

const emptyForm = { code: '', name: '', desc: '' };

export const AdminExperiments: React.FC = () => {
  const [items, setItems] = useState<Experiment[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Experiment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchExperiments()
      .then((list) => {
        setItems(list);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load experiments'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name || !form.desc) {
      return setError('Code, name, and description are required');
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateExperiment(editingId, form);
        setSuccess('Experiment updated.');
      } else {
        await createExperiment(form);
        setSuccess('Experiment added.');
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

  const startEdit = (item: Experiment) => {
    setEditingId(item.dbId ?? null);
    setForm({ code: item.code || item.id, name: item.name, desc: item.desc });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = async () => {
    if (!pendingDelete?.dbId) return;
    setDeleting(true);
    try {
      await deleteExperiment(pendingDelete.dbId);
      setSuccess('Experiment deleted.');
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
      title="Experiments"
      description="Side experiments and lab entries shown on the public home lab section."
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
          {editingId ? 'Edit experiment' : 'Add experiment'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-3">
          <Field label="Code" required hint="Short identifier, e.g. EXP01">
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="EXP01"
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Neural Hand Tracking"
              />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Description" required>
              <Textarea
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
                placeholder="What did you build and what did you learn?"
              />
            </Field>
          </div>
          <div className="md:col-span-3 flex gap-2">
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
          icon={<FlaskConical size={28} />}
          title="No experiments yet"
          description="Capture quick R&D logs that show up on the home lab section."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.dbId} className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-theme-accent">
                {item.code || item.id}
              </span>
              <h3 className="text-base font-bold">{item.name}</h3>
              <p className="text-sm text-theme-text/70 flex-1">{item.desc}</p>
              <div className="flex gap-2 pt-2 border-t border-theme-border/20">
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
        title={`Delete experiment “${pendingDelete?.name || ''}”?`}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminExperiments;
