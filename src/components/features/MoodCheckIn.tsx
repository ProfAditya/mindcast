'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Frown, Laugh, Meh, Smile, Annoyed } from 'lucide-react';
import { moodApi } from '@/lib/api/services';
import { errorMessage } from '@/lib/api/client';
import type { MoodLabel } from '@/lib/api/types';
import { Button, SegmentedScale, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

export const MOOD_META: Record<
  MoodLabel,
  { label: string; score: number; icon: React.ComponentType<{ className?: string }> }
> = {
  great: { label: 'Great', score: 9, icon: Laugh },
  good: { label: 'Good', score: 7, icon: Smile },
  okay: { label: 'Okay', score: 5, icon: Meh },
  low: { label: 'Low', score: 3, icon: Annoyed },
  struggling: { label: 'Struggling', score: 1, icon: Frown },
};

export function MoodCheckIn({ compact, onDone }: { compact?: boolean; onDone?: () => void }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState<MoodLabel | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [anxiety, setAnxiety] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [more, setMore] = useState(!compact);

  const m = useMutation({
    mutationFn: () =>
      moodApi.create({
        mood_label: label,
        mood_score: score ?? (label ? MOOD_META[label].score : null),
        energy_score: energy,
        stress_score: stress,
        anxiety_score: anxiety,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      toast.success('Check-in saved');
      setLabel(null);
      setScore(null);
      setEnergy(null);
      setStress(null);
      setAnxiety(null);
      setNote('');
      qc.invalidateQueries({ queryKey: ['mood'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      onDone?.();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ivory">
          How are you feeling right now?
        </legend>
        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Mood">
          {(Object.keys(MOOD_META) as MoodLabel[]).map((k) => {
            const M = MOOD_META[k];
            const on = label === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setLabel(k);
                  setScore(M.score);
                }}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 text-xs transition-colors',
                  on
                    ? 'border-gold bg-gold/10 text-gold-pale'
                    : 'border-divider bg-graphite-deep text-stone hover:border-gold-line hover:text-ivory'
                )}
              >
                <M.icon className={cn('h-5 w-5', on ? 'text-gold' : '')} />
                {M.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {compact && !more && (
        <button
          type="button"
          className="text-xs text-gold-pale underline underline-offset-4 hover:text-gold"
          onClick={() => setMore(true)}
        >
          Add energy, stress and a note
        </button>
      )}
      {more && (
        <>
          <SegmentedScale
            label="Mood score (0–10)"
            value={score}
            onChange={setScore}
            lowLabel="Very low"
            highLabel="Very good"
          />
          <div className="grid gap-5 md:grid-cols-3">
            <SegmentedScale
              label="Energy"
              value={energy}
              onChange={setEnergy}
              max={10}
              lowLabel="Drained"
              highLabel="Energised"
            />
            <SegmentedScale
              label="Stress"
              value={stress}
              onChange={setStress}
              lowLabel="Calm"
              highLabel="Very stressed"
            />
            <SegmentedScale
              label="Anxiety"
              value={anxiety}
              onChange={setAnxiety}
              lowLabel="None"
              highLabel="Severe"
            />
          </div>
          <div>
            <label htmlFor="mood-note" className="mb-1.5 block text-sm font-medium">
              Note <span className="text-stone">(optional)</span>
            </label>
            <Textarea
              id="mood-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={5000}
              placeholder="Anything that might be affecting how you feel?"
            />
          </div>
        </>
      )}
      <Button onClick={() => m.mutate()} loading={m.isPending} disabled={!label && score == null}>
        Save check-in
      </Button>
    </div>
  );
}
