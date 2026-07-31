'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import HabitTrackerContent from './components/HabitTrackerContent';

export default function HabitsPage() {
  return (
    <AppLayout>
      <HabitTrackerContent />
    </AppLayout>
  );
}
