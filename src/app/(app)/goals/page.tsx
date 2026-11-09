'use client';
import { PageHeader } from '@/components/ui';
import { RemindersManager } from '@/components/features/Reminders';
export default function GoalsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Daily life"
        title="Goals"
        subtitle="Gentle, specific intentions. Progress is yours to judge."
      />
      <RemindersManager mode="goals" />
    </>
  );
}
