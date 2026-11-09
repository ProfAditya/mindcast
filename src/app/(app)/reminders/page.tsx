'use client';
import { PageHeader } from '@/components/ui';
import { RemindersManager } from '@/components/features/Reminders';
export default function RemindersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Daily life"
        title="Reminders"
        subtitle="Nudges for check-ins, journalling, medication and more."
      />
      <RemindersManager mode="reminders" />
    </>
  );
}
