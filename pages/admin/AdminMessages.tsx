import React, { useEffect, useMemo, useState } from 'react';
import { Archive, CheckCircle2, Inbox, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { AdminShell } from '../../components/admin/AdminShell';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Select,
  StatusBanner,
} from '../../components/admin/AdminUi';
import {
  ContactMessage,
  deleteContactMessage,
  fetchContactMessages,
  updateContactStatus,
} from '../../services/portfolioService';

type Filter = 'all' | 'new' | 'replied' | 'archived';

const filterLabels: Record<Filter, string> = {
  all: 'All',
  new: 'New',
  replied: 'Replied',
  archived: 'Archived',
};

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

export const AdminMessages: React.FC = () => {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    setLoading(true);
    fetchContactMessages()
      .then((list) => {
        setItems(list);
        setError(null);
        if (list.length > 0 && selectedId === null) {
          setSelectedId(list[0].id);
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load messages'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? items
        : items.filter((m) => m.status === filter),
    [items, filter],
  );

  const selected = useMemo(
    () => items.find((m) => m.id === selectedId) || null,
    [items, selectedId],
  );

  const handleStatus = async (
    msg: ContactMessage,
    status: 'new' | 'replied' | 'archived',
  ) => {
    try {
      await updateContactStatus(msg.id, status);
      setItems((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status } : m)),
      );
      setSuccess(`Marked as ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteContactMessage(pendingDelete.id);
      setSuccess('Message deleted.');
      setPendingDelete(null);
      setItems((prev) => prev.filter((m) => m.id !== pendingDelete.id));
      if (selectedId === pendingDelete.id) setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const newCount = items.filter((m) => m.status === 'new').length;

  return (
    <AdminShell
      title="Messages"
      description="Incoming contact form submissions stored in the database."
      actions={
        <>
          <div className="flex items-center gap-2 px-2 py-1 border border-theme-border/30 rounded-md text-[11px] font-mono text-theme-text/60">
            <Mail size={12} />
            <span>{items.length} total</span>
            {newCount > 0 ? (
              <span className="text-theme-accent">• {newCount} new</span>
            ) : null}
          </div>
          <Button variant="secondary" onClick={refresh}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </Button>
        </>
      }
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

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
          >
            {Object.entries(filterLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          {loading ? (
            <div className="text-sm font-mono text-theme-text/60">Loading…</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Inbox size={28} />}
              title="Inbox empty"
              description={
                filter === 'all'
                  ? 'When someone submits the contact form, the message will appear here.'
                  : 'No messages match this filter.'
              }
            />
          ) : (
            <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map((msg) => {
                const active = msg.id === selectedId;
                return (
                  <li key={msg.id}>
                    <button
                      onClick={() => setSelectedId(msg.id)}
                      className={[
                        'w-full text-left px-3 py-2.5 border rounded-md transition-colors',
                        active
                          ? 'border-theme-accent/60 bg-theme-accent/10'
                          : 'border-theme-border/30 hover:border-theme-accent/40 bg-theme-panel/40',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate">
                          {msg.name}
                        </span>
                        {msg.status === 'new' ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-theme-accent shrink-0" />
                        ) : null}
                      </div>
                      <div className="text-[11px] font-mono text-theme-text/50 truncate">
                        {msg.email}
                      </div>
                      <div className="text-xs text-theme-text/60 line-clamp-2 mt-1">
                        {msg.message}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-theme-text/40">
                        <span>{msg.topic}</span>
                        <span>{formatDate(msg.createdAt)}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          {selected ? (
            <Card>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-theme-text/50">
                    {selected.topic} · {selected.status}
                  </div>
                  <h2 className="mt-1 text-xl font-bold">{selected.name}</h2>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-theme-accent break-all"
                  >
                    {selected.email}
                  </a>
                </div>
                <div className="text-[11px] font-mono text-theme-text/50">
                  {formatDate(selected.createdAt)}
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-theme-text/80 border-l-2 border-theme-accent pl-4">
                {selected.message}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-theme-border/20">
                <Button
                  variant="secondary"
                  onClick={() => handleStatus(selected, 'replied')}
                  disabled={selected.status === 'replied'}
                >
                  <CheckCircle2 size={14} />
                  <span>Mark replied</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleStatus(selected, 'archived')}
                  disabled={selected.status === 'archived'}
                >
                  <Archive size={14} />
                  <span>Archive</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleStatus(selected, 'new')}
                  disabled={selected.status === 'new'}
                >
                  Mark unread
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setPendingDelete(selected)}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </Button>
              </div>

              {selected.userAgent ? (
                <div className="mt-4 text-[11px] font-mono text-theme-text/40 break-all">
                  UA: {selected.userAgent}
                </div>
              ) : null}
            </Card>
          ) : (
            <EmptyState
              icon={<Inbox size={28} />}
              title="Select a message"
              description="Pick a message on the left to read, reply, or archive it."
            />
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(pendingDelete)}
        title="Delete this message?"
        description="The submission will be removed from the database. The original email already sent is unaffected."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={deleting}
      />
    </AdminShell>
  );
};

export default AdminMessages;
