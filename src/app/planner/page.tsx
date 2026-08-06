'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import DailyPlannerContent from './components/DailyPlannerContent';

export default function PlannerPage() {
  return (
    <AppLayout>
      <DailyPlannerContent />
    </AppLayout>
  );
}
