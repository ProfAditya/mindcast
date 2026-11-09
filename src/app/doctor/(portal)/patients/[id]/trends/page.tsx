'use client';
import { useParams } from 'next/navigation';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { TrendChart, BarsChart } from '@/components/charts';
import { CategoryGate, DataTable, usePatientData, type Rows } from '@/components/features/doctor';
import { fmtDate, round1 } from '@/lib/utils';

const byDate = (rows: Rows, key: string) =>
  [...rows].sort((a, b) => String(a[key]).localeCompare(String(b[key])));

export default function PatientTrends() {
  const { id } = useParams<{ id: string }>();
  const mood = usePatientData(id, 'mood_wellbeing');
  const sleep = usePatientData(id, 'sleep_habits');
  const life = usePatientData(id, 'lifestyle');
  const digital = usePatientData(id, 'digital_behaviour');
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Mood, stress and anxiety" subtitle="Self-reported, 0–10" />
        <CategoryGate q={mood} category="mood_wellbeing">
          {(d) => {
            const rows = byDate(d.mood_entries ?? [], 'recorded_at').map((r) => ({
              date: fmtDate(String(r.recorded_at), { day: 'numeric', month: 'short' }),
              mood: r.mood_score as number | null,
              stress: r.stress_score as number | null,
              anxiety: r.anxiety_score as number | null,
            }));
            return rows.length >= 2 ? (
              <TrendChart
                data={rows}
                x="date"
                series={[
                  { key: 'mood', label: 'Mood' },
                  { key: 'stress', label: 'Stress' },
                  { key: 'anxiety', label: 'Anxiety' },
                ]}
                yDomain={[0, 10]}
                desc={`${rows.length} check-ins`}
              />
            ) : (
              <EmptyState title="Fewer than two check-ins shared" />
            );
          }}
        </CategoryGate>
      </Card>
      <Card>
        <CardHeader title="Sleep" />
        <CategoryGate q={sleep} category="sleep_habits">
          {(d) => {
            const rows = byDate(d.sleep_logs ?? [], 'log_date').map((r) => ({
              date: fmtDate(String(r.log_date), { day: 'numeric', month: 'short' }),
              hours: r.sleep_hours == null ? null : round1(Number(r.sleep_hours)),
            }));
            return rows.length >= 2 ? (
              <TrendChart
                data={rows}
                x="date"
                series={[{ key: 'hours', label: 'Sleep (h)', unit: ' h' }]}
                yDomain={[0, 12]}
                desc={`${rows.length} nights`}
              />
            ) : (
              <EmptyState title="Fewer than two sleep logs shared" />
            );
          }}
        </CategoryGate>
      </Card>
      <Card>
        <CardHeader title="Activity and screen time" />
        <CategoryGate q={life} category="lifestyle">
          {(d) => {
            const rows = byDate(d.daily_wellbeing_logs ?? [], 'log_date').map((r) => ({
              date: fmtDate(String(r.log_date), { day: 'numeric', month: 'short' }),
              activity: r.activity_minutes as number | null,
              screen: r.screen_time_minutes as number | null,
            }));
            return rows.length ? (
              <BarsChart
                data={rows}
                x="date"
                xLabel="Date"
                series={[
                  { key: 'activity', label: 'Activity', unit: ' min' },
                  { key: 'screen', label: 'Screen time (manual)', unit: ' min' },
                ]}
                desc={`${rows.length} days`}
              />
            ) : (
              <EmptyState title="No daily logs shared" />
            );
          }}
        </CategoryGate>
      </Card>
      <Card>
        <CardHeader title="Screen-time details" subtitle="Entered manually by the patient" />
        <CategoryGate q={digital} category="digital_behaviour">
          {(d) => <DataTable rows={d.digital_activity_logs ?? []} />}
        </CategoryGate>
      </Card>
    </div>
  );
}
