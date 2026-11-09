'use client';
import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, FileText, Paperclip, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { historyApi, recordsApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import {
  HISTORY_TYPES,
  RECORD_TYPES,
  type HealthRecord,
  type HistoryEntry,
  type HistoryType,
} from '@/lib/api/types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import { fmtDate, titleCase } from '@/lib/utils';

const MAX_MB = 20;
const ACCEPT = 'application/pdf,image/jpeg,image/png';

export async function openSignedUrl(get: () => Promise<{ url: string }>) {
  // Open the tab synchronously so pop-up blockers allow it, then point it at the short-lived signed URL.
  const w = window.open('', '_blank');
  if (w) w.opener = null;
  try {
    const { url } = await get();
    if (w) w.location.href = url;
    else window.location.assign(url);
  } catch (e) {
    w?.close();
    toast.error(errorMessage(e));
  }
}

// ─── Health records ──────────────────────────────────────────────────────────
export function RecordsManager({ onlyWithDocuments }: { onlyWithDocuments?: boolean }) {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const q = useQuery({
    queryKey: ['records', type],
    queryFn: () =>
      recordsApi.list(type ? { record_type: type as HealthRecord['record_type'] } : {}),
  });
  const [edit, setEdit] = useState<Partial<HealthRecord> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [del, setDel] = useState<HealthRecord | null>(null);
  const [delDoc, setDelDoc] = useState<HealthRecord | null>(null);
  const uploadFor = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const inval = () => qc.invalidateQueries({ queryKey: ['records'] });

  const checkFile = (f: File | null) => {
    if (!f) return null;
    if (!ACCEPT.split(',').includes(f.type)) {
      toast.error('Only PDF, JPEG and PNG files are supported.');
      return null;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`The file is larger than ${MAX_MB} MB.`);
      return null;
    }
    return f;
  };

  const save = useMutation({
    mutationFn: async (r: Partial<HealthRecord>) => {
      const body = {
        record_type: r.record_type,
        title: r.title?.trim(),
        description: r.description?.trim() || null,
        record_date: r.record_date || null,
        provider_name: r.provider_name?.trim() || null,
      };
      const saved = r.id ? await recordsApi.update(r.id, body) : await recordsApi.create(body);
      if (file) {
        try {
          await recordsApi.upload(saved.id, file);
        } catch (e) {
          throw new Error(`Record saved, but the document upload failed: ${errorMessage(e)}`);
        }
      }
      return saved;
    },
    onSuccess: () => {
      toast.success('Record saved');
      setEdit(null);
      setFile(null);
      inval();
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      inval();
    },
  });
  const upload = useMutation({
    mutationFn: ({ id, f }: { id: string; f: File }) => recordsApi.upload(id, f),
    onSuccess: () => {
      toast.success('Document uploaded');
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => recordsApi.remove(id),
    onSuccess: () => {
      toast.success('Record deleted');
      setDel(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const removeDoc = useMutation({
    mutationFn: (id: string) => recordsApi.removeDocument(id),
    onSuccess: () => {
      toast.success('Document removed');
      setDelDoc(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const items = (q.data?.items ?? []).filter((r) => !onlyWithDocuments || r.has_document);
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          aria-label="Filter by type"
          className="sm:max-w-[240px]"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="All record types"
          options={RECORD_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
        />
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setFile(null);
            setEdit({ record_type: 'lab_result' });
          }}
        >
          {onlyWithDocuments ? 'Add document' : 'Add record'}
        </Button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = checkFile(e.target.files?.[0] ?? null);
          if (f && uploadFor.current) upload.mutate({ id: uploadFor.current, f });
          e.target.value = '';
        }}
      />
      {q.isLoading ? (
        <LoadingBlock rows={4} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !items.length ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={onlyWithDocuments ? 'No documents uploaded' : 'No records yet'}
          body="Add lab results, prescriptions, imaging reports and more. Attach a PDF or photo if you have one."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id}>
              <Card as="article" className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{r.title}</h3>
                      <Badge>{titleCase(r.record_type)}</Badge>
                      {r.has_document && (
                        <Badge tone="gold">
                          <Paperclip className="h-3 w-3" />
                          {r.mime_type === 'application/pdf' ? 'PDF' : 'Image'}
                          {r.file_size_bytes
                            ? ` · ${(r.file_size_bytes / 1024 / 1024).toFixed(1)} MB`
                            : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-stone">
                      {r.record_date ? fmtDate(r.record_date) : 'No date'}
                      {r.provider_name ? ` · ${r.provider_name}` : ''}
                    </p>
                    {r.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-stone">{r.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.has_document ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => openSignedUrl(() => recordsApi.documentUrl(r.id))}
                        >
                          Open
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDelDoc(r)}>
                          Remove file
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Upload className="h-3.5 w-3.5" />}
                        loading={upload.isPending && uploadFor.current === r.id}
                        onClick={() => {
                          uploadFor.current = r.id;
                          fileInput.current?.click();
                        }}
                      >
                        Attach
                      </Button>
                    )}
                    <button
                      onClick={() => {
                        setFile(null);
                        setEdit(r);
                      }}
                      className="rounded-lg p-2 text-stone hover:bg-white/5 hover:text-ivory"
                      aria-label={`Edit ${r.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDel(r)}
                      className="rounded-lg p-2 text-stone hover:bg-rose/10 hover:text-rose"
                      aria-label={`Delete ${r.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit record' : 'New record'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!edit?.title?.trim()}
              onClick={() => edit && save.mutate(edit)}
            >
              Save
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Field label="Type" required>
              {(id) => (
                <Select
                  id={id}
                  value={edit.record_type}
                  onChange={(e) =>
                    setEdit({ ...edit, record_type: e.target.value as HealthRecord['record_type'] })
                  }
                  options={RECORD_TYPES.map((t) => ({ value: t, label: titleCase(t) }))}
                />
              )}
            </Field>
            <Field label="Title" required>
              {(id) => (
                <Input
                  id={id}
                  value={edit.title ?? ''}
                  maxLength={200}
                  placeholder="e.g. Full blood count"
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={edit.record_date ?? ''}
                    onChange={(e) => setEdit({ ...edit, record_date: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Provider / clinic">
                {(id) => (
                  <Input
                    id={id}
                    value={edit.provider_name ?? ''}
                    maxLength={200}
                    onChange={(e) => setEdit({ ...edit, provider_name: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <Field label="Notes">
              {(id) => (
                <Textarea
                  id={id}
                  value={edit.description ?? ''}
                  maxLength={10000}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                />
              )}
            </Field>
            {!edit.has_document && (
              <Field
                label="Attach document (optional)"
                hint={`PDF, JPEG or PNG, up to ${MAX_MB} MB. Stored privately.`}
              >
                {(id) => (
                  <input
                    id={id}
                    type="file"
                    accept={ACCEPT}
                    onChange={(e) => setFile(checkFile(e.target.files?.[0] ?? null))}
                    className="block w-full text-sm text-stone file:mr-3 file:rounded-lg file:border file:border-gold-line file:bg-graphite file:px-3 file:py-2 file:text-sm file:text-ivory"
                  />
                )}
              </Field>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del.id)}
        loading={remove.isPending}
        title="Delete this record?"
        body="The record and any attached document will be permanently deleted."
      />
      <ConfirmDialog
        open={!!delDoc}
        onClose={() => setDelDoc(null)}
        onConfirm={() => delDoc && removeDoc.mutate(delDoc.id)}
        loading={removeDoc.isPending}
        title="Remove the attached file?"
        body="The record stays; only the document is deleted."
        confirmLabel="Remove file"
      />
    </>
  );
}

// ─── Medical history ─────────────────────────────────────────────────────────
const TYPE_LABEL: Record<HistoryType, string> = {
  condition: 'Condition',
  allergy: 'Allergy',
  medication: 'Medication',
  surgery: 'Surgery',
  procedure: 'Procedure',
  family_history: 'Family history',
  immunization: 'Immunisation',
  other: 'Other',
};

export function HistoryManager({ type, noun }: { type?: HistoryType; noun?: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['history', type ?? 'all'],
    queryFn: () => historyApi.list(type ? { entry_type: type } : {}),
  });
  const [edit, setEdit] = useState<Partial<HistoryEntry> | null>(null);
  const [del, setDel] = useState<HistoryEntry | null>(null);
  const inval = () => qc.invalidateQueries({ queryKey: ['history'] });
  const save = useMutation({
    mutationFn: (e: Partial<HistoryEntry>) => {
      const body = {
        entry_type: e.entry_type,
        name: e.name?.trim(),
        status: e.status,
        severity: e.severity || null,
        onset_date: e.onset_date || null,
        resolved_date: e.resolved_date || null,
        notes: e.notes?.trim() || null,
      };
      return e.id ? historyApi.update(e.id, body) : historyApi.create(body);
    },
    onSuccess: () => {
      toast.success('Saved');
      setEdit(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => historyApi.remove(id),
    onSuccess: () => {
      toast.success('Deleted');
      setDel(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const label = noun ?? 'entry';
  const tone = (s: string) =>
    (s === 'active' ? 'gold' : s === 'resolved' ? 'sage' : 'neutral') as
      'gold' | 'sage' | 'neutral';
  const dateLabels =
    type === 'medication'
      ? ['Started', 'Stopped']
      : type === 'surgery'
        ? ['Date', 'Recovered']
        : ['Onset', 'Resolved'];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setEdit({ entry_type: type ?? 'condition', status: 'active' })}
        >
          Add {label}
        </Button>
      </div>
      {q.isLoading ? (
        <LoadingBlock rows={3} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.items.length ? (
        <EmptyState
          title={`No ${label === 'entry' ? 'history entries' : `${label}s`} recorded`}
          body="Keeping this list up to date makes conversations with clinicians easier."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-bronze">
          <ul className="divide-y divide-divider bg-graphite">
            {q.data.items.map((h) => (
              <li key={h.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ivory">{h.name}</p>
                    {!type && <Badge>{TYPE_LABEL[h.entry_type]}</Badge>}
                    <Badge tone={tone(h.status)}>{titleCase(h.status)}</Badge>
                    {h.severity && (
                      <Badge tone={h.severity === 'severe' ? 'rose' : 'neutral'}>
                        {titleCase(h.severity)}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone">
                    {[
                      h.onset_date && `${dateLabels[0]} ${fmtDate(h.onset_date)}`,
                      h.resolved_date && `${dateLabels[1]} ${fmtDate(h.resolved_date)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'No dates'}
                  </p>
                  {h.notes && <p className="mt-1.5 text-sm text-stone">{h.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEdit(h)}
                    className="rounded-lg p-2 text-stone hover:bg-white/5 hover:text-ivory"
                    aria-label={`Edit ${h.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDel(h)}
                    className="rounded-lg p-2 text-stone hover:bg-rose/10 hover:text-rose"
                    aria-label={`Delete ${h.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? `Edit ${label}` : `Add ${label}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!edit?.name?.trim()}
              onClick={() => edit && save.mutate(edit)}
            >
              Save
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            {!type && (
              <Field label="Type" required>
                {(id) => (
                  <Select
                    id={id}
                    value={edit.entry_type}
                    onChange={(e) =>
                      setEdit({ ...edit, entry_type: e.target.value as HistoryType })
                    }
                    options={HISTORY_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))}
                  />
                )}
              </Field>
            )}
            <Field label={type === 'medication' ? 'Medication and dose' : 'Name'} required>
              {(id) => (
                <Input
                  id={id}
                  value={edit.name ?? ''}
                  maxLength={200}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  placeholder={
                    type === 'medication'
                      ? 'e.g. Sertraline 50 mg once daily'
                      : type === 'allergy'
                        ? 'e.g. Penicillin'
                        : ''
                  }
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status">
                {(id) => (
                  <Select
                    id={id}
                    value={edit.status}
                    onChange={(e) =>
                      setEdit({ ...edit, status: e.target.value as HistoryEntry['status'] })
                    }
                    options={['active', 'resolved', 'inactive'].map((s) => ({
                      value: s,
                      label: titleCase(s),
                    }))}
                  />
                )}
              </Field>
              <Field label="Severity">
                {(id) => (
                  <Select
                    id={id}
                    value={edit.severity ?? ''}
                    placeholder="Not specified"
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        severity: (e.target.value || null) as HistoryEntry['severity'],
                      })
                    }
                    options={['mild', 'moderate', 'severe'].map((s) => ({
                      value: s,
                      label: titleCase(s),
                    }))}
                  />
                )}
              </Field>
              <Field label={dateLabels[0]}>
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={edit.onset_date ?? ''}
                    onChange={(e) => setEdit({ ...edit, onset_date: e.target.value })}
                  />
                )}
              </Field>
              <Field label={dateLabels[1]}>
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={edit.resolved_date ?? ''}
                    min={edit.onset_date ?? undefined}
                    onChange={(e) => setEdit({ ...edit, resolved_date: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <Field label="Notes">
              {(id) => (
                <Textarea
                  id={id}
                  value={edit.notes ?? ''}
                  maxLength={10000}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                />
              )}
            </Field>
            {type === 'medication' && (
              <p className="text-xs text-stone">
                NEURIX only keeps a record. Never start, stop or change medication without your
                prescriber.
              </p>
            )}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del.id)}
        loading={remove.isPending}
        title={`Delete this ${label}?`}
        body="This cannot be undone."
      />
    </>
  );
}
