'use client';
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellOff, Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { reminderApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import type { Reminder } from '@/lib/api/types';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Modal,
  Notice,
  Select,
} from '@/components/ui';
import { cn, fmtDate, fmtDateTime, titleCase } from '@/lib/utils';

const tz = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const RECURRENCE = ['none', 'daily', 'weekdays', 'weekly', 'monthly'] as const;
export const REMINDER_TYPES = [
  ['checkin', 'Mood check-in'],
  ['journal', 'Journal'],
  ['medication', 'Medication'],
  ['hydration', 'Hydration'],
  ['movement', 'Movement'],
  ['sleep', 'Wind-down / sleep'],
  ['appointment', 'Appointment'],
  ['custom', 'Other'],
] as const;

export function RemindersManager({ mode }: { mode: 'reminders' | 'goals' }) {
  const goals = mode === 'goals';
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['reminders'], queryFn: () => reminderApi.list() });
  const [edit, setEdit] = useState<Partial<Reminder> | null>(null);
  const [del, setDel] = useState<Reminder | null>(null);
  const inval = () => {
    qc.invalidateQueries({ queryKey: ['reminders'] });
  };
  const save = useMutation({
    mutationFn: (r: Partial<Reminder>) => {
      const body = {
        title: r.title?.trim(),
        reminder_type: goals ? 'goal' : r.reminder_type || 'custom',
        scheduled_at: r.scheduled_at || null,
        timezone: r.timezone || tz(),
        recurrence: r.recurrence || 'none',
        is_enabled: r.is_enabled ?? true,
      };
      return r.id ? reminderApi.update(r.id, body) : reminderApi.create(body);
    },
    onSuccess: () => {
      toast.success(goals ? 'Goal saved' : 'Reminder saved');
      setEdit(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const toggle = useMutation({
    mutationFn: (r: Reminder) => reminderApi.update(r.id, { is_enabled: !r.is_enabled }),
    onSuccess: inval,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => reminderApi.remove(id),
    onSuccess: () => {
      toast.success('Deleted');
      setDel(null);
      inval();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const items = (q.data?.items ?? []).filter((r) =>
    goals ? r.reminder_type === 'goal' : r.reminder_type !== 'goal'
  );
  const active = items.filter((r) => r.is_enabled),
    inactive = items.filter((r) => !r.is_enabled);
  const typeLabel = (t: string) => REMINDER_TYPES.find(([k]) => k === t)?.[1] ?? titleCase(t);

  const row = (r: Reminder) => (
    <li
      key={r.id}
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center',
        r.is_enabled ? 'border-bronze bg-graphite' : 'border-divider bg-graphite-deep'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p
            className={cn(
              'font-medium',
              r.is_enabled ? 'text-ivory' : 'text-stone line-through decoration-stone/50'
            )}
          >
            {r.title}
          </p>
          {!goals && <Badge>{typeLabel(r.reminder_type)}</Badge>}
          {r.recurrence !== 'none' && <Badge tone="blue">{titleCase(r.recurrence)}</Badge>}
          {goals && !r.is_enabled && (
            <Badge tone="sage">
              <Check className="h-3 w-3" />
              Achieved
            </Badge>
          )}
          {!goals && !r.is_enabled && <Badge>Paused</Badge>}
        </div>
        <p className="mt-1 text-xs text-stone">
          {r.scheduled_at
            ? `${goals ? 'Target' : 'Next'}: ${goals ? fmtDate(r.scheduled_at) : fmtDateTime(r.scheduled_at)}`
            : goals
              ? 'No target date'
              : 'No time set'}{' '}
          · {r.timezone}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => toggle.mutate(r)}
          disabled={toggle.isPending}
        >
          {goals ? (r.is_enabled ? 'Mark achieved' : 'Reopen') : r.is_enabled ? 'Pause' : 'Resume'}
        </Button>
        <button
          onClick={() => setEdit(r)}
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
    </li>
  );

  return (
    <>
      <Notice
        tone="gold"
        icon={<BellOff className="h-4 w-4 text-gold" />}
        title={goals ? 'Goals live inside NEURIX' : 'In-app reminders only'}
      >
        {goals
          ? 'Goals are shown on your dashboard. NEURIX doesn’t track progress automatically yet — mark a goal achieved when you’re ready.'
          : 'NEURIX shows your reminders here and on your dashboard. It does not send push notifications, emails or texts.'}
      </Notice>
      <div className="my-5 flex justify-end">
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() =>
            setEdit({
              recurrence: goals ? 'weekly' : 'daily',
              reminder_type: goals ? 'goal' : 'checkin',
              is_enabled: true,
            })
          }
        >
          {goals ? 'New goal' : 'New reminder'}
        </Button>
      </div>
      {q.isLoading ? (
        <LoadingBlock rows={3} />
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !items.length ? (
        <EmptyState
          title={goals ? 'No goals yet' : 'No reminders yet'}
          body={
            goals
              ? 'Small, specific goals work best — for example “Walk 20 minutes, 3 times a week”.'
              : 'Set a gentle reminder for a check-in, journalling or medication.'
          }
        />
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="label-eyebrow mb-2">
                {goals ? 'Active' : 'On'} · {active.length}
              </h2>
              <ul className="space-y-2">{active.map(row)}</ul>
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <h2 className="label-eyebrow mb-2">
                {goals ? 'Achieved' : 'Paused'} · {inactive.length}
              </h2>
              <ul className="space-y-2">{inactive.map(row)}</ul>
            </section>
          )}
        </div>
      )}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={
          edit?.id ? (goals ? 'Edit goal' : 'Edit reminder') : goals ? 'New goal' : 'New reminder'
        }
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
            <Field label={goals ? 'Goal' : 'Title'} required>
              {(id) => (
                <Input
                  id={id}
                  value={edit.title ?? ''}
                  maxLength={200}
                  placeholder={
                    goals ? 'e.g. In bed by 11pm on weeknights' : 'e.g. Evening check-in'
                  }
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              )}
            </Field>
            {!goals && (
              <Field label="Type">
                {(id) => (
                  <Select
                    id={id}
                    value={edit.reminder_type}
                    onChange={(e) => setEdit({ ...edit, reminder_type: e.target.value })}
                    options={REMINDER_TYPES.map(([v, l]) => ({ value: v, label: l }))}
                  />
                )}
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={goals ? 'Target date' : 'Date and time'}>
                {(id) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={toLocalInput(edit.scheduled_at ?? null)}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        scheduled_at: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                )}
              </Field>
              <Field label={goals ? 'Review' : 'Repeats'}>
                {(id) => (
                  <Select
                    id={id}
                    value={edit.recurrence}
                    onChange={(e) =>
                      setEdit({ ...edit, recurrence: e.target.value as Reminder['recurrence'] })
                    }
                    options={RECURRENCE.map((r) => ({
                      value: r,
                      label:
                        r === 'none' ? (goals ? 'No review' : 'Does not repeat') : titleCase(r),
                    }))}
                  />
                )}
              </Field>
            </div>
            <p className="text-xs text-stone">Time zone: {edit.timezone || tz()}</p>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del.id)}
        loading={remove.isPending}
        title={`Delete “${del?.title}”?`}
        body="This cannot be undone."
      />
    </>
  );
}
