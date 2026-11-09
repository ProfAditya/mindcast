'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { doctorApi } from '@/lib/api/services';
import { SHARE_CATEGORIES } from '@/lib/api/types';
import { Badge, Card, CardHeader, Stat } from '@/components/ui';
import { CategoryGate, DataTable, usePatientData } from '@/components/features/doctor';
import { CATEGORY_INFO } from '@/lib/share';
import { avg, fmtDate, round1 } from '@/lib/utils';

export default function PatientOverview() {
  const { id } = useParams<{ id: string }>();
  const pts = useQuery({ queryKey: ['doctor', 'patients'], queryFn: doctorApi.patients });
  const p = pts.data?.find((x) => x.patient_id === id);
  const history = usePatientData(id, 'medical_history');
  const mood = usePatientData(id, 'mood_wellbeing');
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="What this patient shares with you" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SHARE_CATEGORIES.map((c) => {
            const perm = p?.active_permissions.find((x) => x.category === c);
            return (
              <li
                key={c}
                className="flex items-center justify-between gap-2 rounded-xl border border-bronze bg-graphite-deep px-3 py-2.5 text-sm"
              >
                <span className={perm ? 'text-ivory' : 'text-stone'}>{CATEGORY_INFO[c].label}</span>
                {perm ? (
                  <Badge tone="sage">
                    {perm.expires_at ? `Until ${fmtDate(perm.expires_at)}` : 'Shared'}
                  </Badge>
                ) : (
                  <Badge>Not shared</Badge>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-stone">
          Journals, SOUL conversations and reminders are never available to clinicians.
        </p>
      </Card>
      <Card>
        <CardHeader title="Mood summary" subtitle="From the patient’s self-reported check-ins" />
        <CategoryGate q={mood} category="mood_wellbeing">
          {(d) => {
            const rows = (d.mood_entries ?? []) as {
              mood_score?: number | null;
              stress_score?: number | null;
              recorded_at?: string;
            }[];
            const ms = rows.map((r) => r.mood_score).filter((x): x is number => x != null);
            const ss = rows.map((r) => r.stress_score).filter((x): x is number => x != null);
            return (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="Check-ins shared" value={rows.length} />
                <Stat label="Avg mood" value={ms.length ? `${round1(avg(ms))}/10` : '—'} />
                <Stat label="Avg stress" value={ss.length ? `${round1(avg(ss))}/10` : '—'} />
                <Stat
                  label="Latest"
                  value={
                    <span className="text-base">
                      {rows[0]?.recorded_at ? fmtDate(rows[0].recorded_at) : '—'}
                    </span>
                  }
                />
              </div>
            );
          }}
        </CategoryGate>
      </Card>
      <Card>
        <CardHeader title="Health history" />
        <CategoryGate q={history} category="medical_history">
          {(d) => <DataTable rows={d.medical_history ?? []} empty="No history entries." />}
        </CategoryGate>
      </Card>
    </div>
  );
}
