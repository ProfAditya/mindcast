'use client';
import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Lock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { journalApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import type { JournalEntry } from '@/lib/api/types';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Modal,
  Notice,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { fmtDateTime } from '@/lib/utils';

const PROMPTS = [
  'What took most of my energy today?',
  'One thing I’m grateful for, and why.',
  'What would I tell a friend who felt like I do now?',
  'When did I feel most like myself this week?',
  'What am I avoiding, and what’s one small step towards it?',
];

export default function JournalPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['journal', 'list'], queryFn: () => journalApi.list() });
  const [edit, setEdit] = useState<Partial<JournalEntry> | null>(null);
  const [del, setDel] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const save = useMutation({
    mutationFn: (e: Partial<JournalEntry>) => {
      const body = {
        title: e.title?.trim() || null,
        prompt: e.prompt || null,
        entry_text: (e.entry_text ?? '').trim(),
      };
      return e.id ? journalApi.update(e.id, body) : journalApi.create(body);
    },
    onSuccess: () => {
      toast.success('Entry saved');
      setEdit(null);
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: number) => journalApi.remove(id),
    onSuccess: () => {
      toast.success('Entry deleted');
      setDel(null);
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const list = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (q.data?.items ?? []).filter(
      (j) => !s || `${j.title ?? ''} ${j.entry_text}`.toLowerCase().includes(s)
    );
  }, [q.data, search]);

  return (
    <>
      <PageHeader
        eyebrow="Daily life"
        title="Journal"
        subtitle="Write freely. Your journal is private by design."
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setEdit({ entry_text: '' })}>
            New entry
          </Button>
        }
      />
      <Notice
        tone="sage"
        icon={<Lock className="h-4 w-4 text-sage" />}
        title="Only you can read this"
      >
        Journal entries can never be shared with doctors. SOUL only reads them if you switch on
        journal access in the Privacy centre and choose to include them in a message.
      </Notice>

      <div className="relative mt-5">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your entries"
          className="pl-10"
          aria-label="Search journal"
        />
      </div>

      <div className="mt-5">
        {q.isLoading ? (
          <LoadingBlock rows={4} />
        ) : q.error ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : !list.length ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" />}
            title={search ? 'No entries match your search' : 'Your journal is empty'}
            body={search ? undefined : 'Start with a prompt, or just write what’s on your mind.'}
            action={
              !search && (
                <Button onClick={() => setEdit({ entry_text: '' })}>Write your first entry</Button>
              )
            }
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((j) => (
              <li key={j.id}>
                <Card as="article" className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{j.title || 'Untitled entry'}</h2>
                      <p className="text-xs text-stone">
                        {fmtDateTime(j.created_at)}
                        {j.updated_at !== j.created_at ? ' · edited' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setEdit(j)}
                        className="rounded-lg p-1.5 text-stone hover:bg-white/5 hover:text-ivory"
                        aria-label="Edit entry"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDel(j)}
                        className="rounded-lg p-1.5 text-stone hover:bg-rose/10 hover:text-rose"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {j.prompt && (
                    <p className="mt-3 border-l-2 border-gold-line pl-3 text-xs italic text-stone">
                      {j.prompt}
                    </p>
                  )}
                  <p className="mt-3 line-clamp-6 whitespace-pre-wrap text-sm text-stone">
                    {j.entry_text}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Edit entry' : 'New entry'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>
              Cancel
            </Button>
            <Button
              loading={save.isPending}
              disabled={!edit?.entry_text?.trim()}
              onClick={() => edit && save.mutate(edit)}
            >
              Save entry
            </Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <Input
              value={edit.title ?? ''}
              maxLength={200}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              placeholder="Title (optional)"
              aria-label="Title"
            />
            <div>
              <p className="mb-2 text-xs text-stone">Need a prompt?</p>
              <div className="flex flex-wrap gap-1.5">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEdit({ ...edit, prompt: edit.prompt === p ? null : p })}
                    aria-pressed={edit.prompt === p}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${edit.prompt === p ? 'border-gold bg-gold/10 text-gold-pale' : 'border-divider text-stone hover:text-ivory'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {edit.prompt && (
              <p className="border-l-2 border-gold pl-3 text-sm italic text-gold-pale">
                {edit.prompt}
              </p>
            )}
            <Textarea
              value={edit.entry_text ?? ''}
              onChange={(e) => setEdit({ ...edit, entry_text: e.target.value })}
              className="min-h-[260px]"
              placeholder="Start writing…"
              aria-label="Entry"
            />
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del.id)}
        loading={remove.isPending}
        title="Delete this entry?"
        body="This permanently removes the entry. It cannot be recovered."
      />
    </>
  );
}
