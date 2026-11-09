'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  LifeBuoy,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { aiApi } from '@/lib/api/services';
import { ApiError, errorMessage } from '@/lib/api/client';
import type { Message } from '@/lib/api/types';
import {
  Badge,
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
import { cn, fmtDateTime, titleCase } from '@/lib/utils';

const ACTIVE_KEY = 'neurix-soul-active';

export default function SoulPage() {
  const consent = useQuery({ queryKey: ['ai', 'consent'], queryFn: aiApi.consent });
  return (
    <>
      <PageHeader
        eyebrow="Understand"
        title="SOUL"
        subtitle="A reflective companion that can look at the data you allow and help you put things into words. It is not a therapist and cannot help in an emergency."
      />
      {consent.isLoading ? (
        <LoadingBlock rows={4} />
      ) : consent.error ? (
        <ErrorState error={consent.error} onRetry={() => consent.refetch()} />
      ) : consent.data && !consent.data.scopes.general ? (
        <ConsentGate texts={consent.data.texts} provider={consent.data.provider} />
      ) : (
        consent.data && (
          <Chat
            journalOk={consent.data.scopes.journal_entries}
            medicalOk={consent.data.scopes.medical}
          />
        )
      )}
      <Support />
    </>
  );
}

function ConsentGate({ texts, provider }: { texts: Record<string, string>; provider?: string }) {
  const qc = useQueryClient();
  const [read, setRead] = useState(false);
  const grant = useMutation({
    mutationFn: () => aiApi.setConsent('general', true),
    onSuccess: (d) => qc.setQueryData(['ai', 'consent'], d),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Card className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-gold" />
        <h2 className="font-semibold">Before you start</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm text-stone">
        <p>
          SOUL uses an AI model{provider ? ` (${provider})` : ''} on the NEURIX server. To reply,
          the server sends your message and a summary of the data covered by your consent to that
          provider. Your browser never talks to the AI provider directly.
        </p>
        <div className="rounded-xl border border-bronze bg-graphite-deep p-4 text-ivory">
          {texts.general}
        </div>
        <ul className="space-y-1.5">
          <li>• SOUL never diagnoses, prescribes, or suggests changing treatment.</li>
          <li>• Replies are AI-generated and can be wrong. Each reply shows what data was used.</li>
          <li>
            • Journal and medical data stay excluded unless you switch them on separately in the
            Privacy centre.
          </li>
          <li>• You can withdraw consent and delete conversations at any time.</li>
        </ul>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={read}
          onChange={(e) => setRead(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-divider bg-graphite-deep text-gold focus:ring-gold"
        />
        <span>I’ve read this and agree to AI processing of my data for SOUL.</span>
      </label>
      <div className="mt-5 flex gap-2">
        <Button disabled={!read} loading={grant.isPending} onClick={() => grant.mutate()}>
          Agree and continue
        </Button>
        <Link href="/privacy" className="self-center text-sm text-stone hover:text-ivory">
          Review privacy settings
        </Link>
      </div>
    </Card>
  );
}

function aiProblem(e: unknown): { title: string; body: string; retry: boolean } {
  if (e instanceof ApiError) {
    if (e.status === 503)
      return {
        title: 'SOUL is not available right now',
        body: 'AI features are not configured on this server yet. No reply was generated and your message was not saved. Everything else in NEURIX works normally.',
        retry: true,
      };
    if (e.status === 429)
      return {
        title: 'Too many messages',
        body: 'Please wait a minute before sending another message.',
        retry: true,
      };
    if (e.status === 403) return { title: 'Consent needed', body: e.message, retry: false };
    if (e.status === 502 || e.status === 504)
      return {
        title: 'The AI service didn’t respond',
        body: 'No reply was generated. Your message was not saved — try again in a moment.',
        retry: true,
      };
  }
  return { title: 'Message not sent', body: errorMessage(e), retry: true };
}

function Chat({ journalOk, medicalOk }: { journalOk: boolean; medicalOk: boolean }) {
  const qc = useQueryClient();
  const convs = useQuery({ queryKey: ['ai', 'conversations'], queryFn: aiApi.conversations });
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [incJournal, setIncJournal] = useState(false);
  const [incMedical, setIncMedical] = useState(false);
  const [failure, setFailure] = useState<{
    title: string;
    body: string;
    retry: boolean;
    content: string;
  } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  const [rename, setRename] = useState<{ id: string; title: string } | null>(null);
  const [showList, setShowList] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setActive(localStorage.getItem(ACTIVE_KEY));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (!convs.data) return;
    if (active && !convs.data.some((c) => c.id === active)) setActive(convs.data[0]?.id ?? null);
    if (!active && convs.data[0]) setActive(convs.data[0].id);
  }, [convs.data, active]);
  useEffect(() => {
    try {
      if (active) localStorage.setItem(ACTIVE_KEY, active);
    } catch {
      /* ignore */
    }
    setFailure(null);
  }, [active]);

  const conv = useQuery({
    queryKey: ['ai', 'conversation', active],
    queryFn: () => aiApi.conversation(active!),
    enabled: !!active,
  });
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [conv.data?.messages.length, pending]);

  const create = useMutation({
    mutationFn: () => aiApi.createConversation(),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      setActive(c.id);
      setShowList(false);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: (_d, id) => {
      toast.success('Conversation deleted');
      setDel(null);
      if (id === active) setActive(null);
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const doRename = useMutation({
    mutationFn: (r: { id: string; title: string }) => aiApi.renameConversation(r.id, r.title),
    onSuccess: () => {
      setRename(null);
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const send = useMutation({
    mutationFn: async (content: string) => {
      let id = active;
      if (!id) {
        const c = await aiApi.createConversation(content.slice(0, 60));
        id = c.id;
        setActive(id);
        qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      }
      return {
        id,
        r: await aiApi.send(id, content, {
          include_journal: incJournal,
          include_medical: incMedical,
        }),
      };
    },
    onMutate: (content) => {
      setPending(content);
      setFailure(null);
      setText('');
    },
    onSuccess: ({ id }) => {
      setPending(null);
      qc.invalidateQueries({ queryKey: ['ai', 'conversation', id] });
      qc.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
    onError: (e, content) => {
      setPending(null);
      setText(content);
      setFailure({ ...aiProblem(e), content });
    },
  });
  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const c = text.trim();
    if (c && !send.isPending) send.mutate(c);
  };

  const list = (
    <div className="flex h-full flex-col">
      <Button
        className="mb-3 w-full"
        variant="secondary"
        icon={<Plus className="h-4 w-4" />}
        loading={create.isPending}
        onClick={() => create.mutate()}
      >
        New conversation
      </Button>
      {convs.isLoading ? (
        <LoadingBlock rows={3} />
      ) : convs.error ? (
        <ErrorState error={convs.error} onRetry={() => convs.refetch()} />
      ) : !convs.data?.length ? (
        <p className="px-1 text-sm text-stone">No conversations yet.</p>
      ) : (
        <ul className="space-y-1 overflow-y-auto">
          {convs.data.map((c) => (
            <li
              key={c.id}
              className={cn(
                'group flex items-center rounded-xl',
                c.id === active ? 'bg-graphite-raised' : 'hover:bg-white/[0.04]'
              )}
            >
              <button
                onClick={() => {
                  setActive(c.id);
                  setShowList(false);
                }}
                className="min-w-0 flex-1 px-3 py-2.5 text-left"
                aria-current={c.id === active}
              >
                <p
                  className={cn('truncate text-sm', c.id === active ? 'text-ivory' : 'text-stone')}
                >
                  {c.title || 'Untitled conversation'}
                </p>
                <p className="text-[11px] text-stone">{fmtDateTime(c.updated_at)}</p>
              </button>
              <button
                onClick={() => setRename({ id: c.id, title: c.title ?? '' })}
                className="p-1.5 text-stone opacity-70 hover:text-ivory group-hover:opacity-100"
                aria-label="Rename conversation"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setDel(c.id)}
                className="mr-1 p-1.5 text-stone opacity-70 hover:text-rose group-hover:opacity-100"
                aria-label="Delete conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="surface hidden max-h-[72vh] p-3 lg:block">{list}</aside>
      <section className="surface flex min-h-[60vh] flex-col lg:h-[72vh]" aria-label="Conversation">
        <div className="flex items-center gap-2 border-b border-bronze px-4 py-3">
          <button
            className="rounded-lg border border-divider px-2.5 py-1.5 text-xs text-stone lg:hidden"
            onClick={() => setShowList(true)}
          >
            Conversations
          </button>
          <p className="truncate text-sm font-medium">
            {convs.data?.find((c) => c.id === active)?.title ||
              (active ? 'Conversation' : 'New conversation')}
          </p>
          <Badge className="ml-auto" tone="blue">
            AI-generated replies
          </Badge>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
          {active && conv.isLoading ? (
            <LoadingBlock rows={3} />
          ) : active && conv.error ? (
            <ErrorState error={conv.error} onRetry={() => conv.refetch()} />
          ) : (
            <>
              {!conv.data?.messages?.length && !pending && (
                <EmptyState
                  icon={<MessageCircle className="h-5 w-5" />}
                  title="What’s on your mind?"
                  body="Try: “What patterns do you see in my sleep and mood this month?” or “Help me think through a stressful week.”"
                />
              )}
              {conv.data?.messages?.map((m) => (
                <Bubble key={m.id} m={m} />
              ))}
              {pending && (
                <>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gold px-4 py-2.5 text-sm text-obsidian">
                    {pending}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
                    SOUL is thinking…
                  </div>
                </>
              )}
            </>
          )}
          <div ref={bottom} />
        </div>
        {failure && (
          <div className="mx-4 mb-3">
            <Notice
              tone={failure.title.startsWith('SOUL is not') ? 'gold' : 'rose'}
              icon={<AlertTriangle className="h-4 w-4 text-rose" />}
              title={failure.title}
            >
              {failure.body}
              {failure.retry && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                    onClick={() => send.mutate(failure.content)}
                    loading={send.isPending}
                  >
                    Retry
                  </Button>
                </div>
              )}
              {!failure.retry && (
                <div className="mt-2">
                  <Link href="/privacy" className="text-ivory underline underline-offset-2">
                    Open Privacy centre
                  </Link>
                </div>
              )}
            </Notice>
          </div>
        )}
        <form onSubmit={submit} className="border-t border-bronze p-3">
          <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone">
            <label
              className={cn('flex items-center gap-1.5', !journalOk && 'opacity-60')}
              title={journalOk ? undefined : 'Turn on journal access in the Privacy centre'}
            >
              <input
                type="checkbox"
                disabled={!journalOk}
                checked={incJournal}
                onChange={(e) => setIncJournal(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-divider bg-graphite text-gold focus:ring-gold"
              />
              Include my journal{!journalOk && ' (off in Privacy centre)'}
            </label>
            <label
              className={cn('flex items-center gap-1.5', !medicalOk && 'opacity-60')}
              title={medicalOk ? undefined : 'Turn on medical access in the Privacy centre'}
            >
              <input
                type="checkbox"
                disabled={!medicalOk}
                checked={incMedical}
                onChange={(e) => setIncMedical(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-divider bg-graphite text-gold focus:ring-gold"
              />
              Include medical info{!medicalOk && ' (off in Privacy centre)'}
            </label>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={4000}
              rows={1}
              className="min-h-[44px] flex-1"
              placeholder="Write a message…"
              aria-label="Message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <Button
              type="submit"
              aria-label="Send"
              loading={send.isPending}
              disabled={!text.trim()}
              icon={<Send className="h-4 w-4" />}
              className="h-11"
            />
          </div>
          <p className="mt-2 text-[11px] text-stone">
            SOUL can make mistakes and does not give medical advice. Enter to send, Shift+Enter for
            a new line.
          </p>
        </form>
      </section>

      <Modal open={showList} onClose={() => setShowList(false)} title="Conversations">
        {list}
      </Modal>
      <Modal
        open={!!rename}
        onClose={() => setRename(null)}
        title="Rename conversation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRename(null)}>
              Cancel
            </Button>
            <Button
              disabled={!rename?.title.trim()}
              loading={doRename.isPending}
              onClick={() =>
                rename && doRename.mutate({ id: rename.id, title: rename.title.trim() })
              }
            >
              Save
            </Button>
          </>
        }
      >
        <Input
          value={rename?.title ?? ''}
          maxLength={200}
          onChange={(e) => rename && setRename({ ...rename, title: e.target.value })}
          aria-label="Conversation title"
        />
      </Modal>
      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={() => del && remove.mutate(del)}
        loading={remove.isPending}
        title="Delete this conversation?"
        body="All messages in it will be permanently deleted."
      />
    </div>
  );
}

function Bubble({ m }: { m: Message }) {
  if (m.sender === 'user')
    return (
      <div className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gold px-4 py-2.5 text-sm text-obsidian">
        {m.content}
      </div>
    );
  const meta = m.metadata ?? {};
  const safety = meta.source === 'safety_rule' || meta.safety_flag;
  return (
    <div className="max-w-[90%]">
      <div
        className={cn(
          'whitespace-pre-wrap rounded-2xl rounded-bl-md border px-4 py-3 text-sm',
          safety
            ? 'border-rose/40 bg-rose/5 text-ivory'
            : 'border-bronze bg-graphite-deep text-ivory'
        )}
      >
        {safety && (
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-rose">
            <LifeBuoy className="h-3.5 w-3.5" />
            Safety message
          </p>
        )}
        {m.content}
      </div>
      <p className="mt-1 px-1 text-[11px] text-stone">
        {meta.ai_generated
          ? 'AI-generated'
          : meta.source === 'safety_rule'
            ? 'Fixed safety response (not AI)'
            : 'Response'}
        {meta.data_used?.length ? ` · used: ${meta.data_used.map(titleCase).join(', ')}` : ''}
        {meta.filtered ? ' · filtered for safety' : ''} · {fmtDateTime(m.created_at)}
      </p>
      {meta.safety_note && <p className="px-1 text-[11px] text-rose">{meta.safety_note}</p>}
    </div>
  );
}

function Support() {
  return (
    <section id="support" className="mt-8 scroll-mt-24" aria-labelledby="support-h">
      <Card className="border-rose/30">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-rose" />
          <h2 id="support-h" className="font-semibold">
            If you need help now
          </h2>
        </div>
        <div className="mt-3 grid gap-4 text-sm text-stone md:grid-cols-3">
          <p>
            <span className="font-medium text-ivory">In immediate danger?</span> Call your local
            emergency number (for example 112 in the EU and India, 999 in the UK, 911 in the US) or
            go to the nearest emergency department.
          </p>
          <p>
            <span className="font-medium text-ivory">Thinking about suicide or self-harm?</span>{' '}
            Contact a crisis line in your country — for example 988 (US), Samaritans 116 123 (UK
            &amp; Ireland), or Tele-MANAS 14416 (India).
          </p>
          <p>
            <span className="font-medium text-ivory">Not urgent but struggling?</span> Talk to
            someone you trust, or book an appointment with a GP or mental-health professional.
          </p>
        </div>
        <p className="mt-4 text-xs text-stone">
          SOUL can’t contact anyone for you and isn’t monitored by people. Numbers change — please
          check your local service.
        </p>
      </Card>
    </section>
  );
}
