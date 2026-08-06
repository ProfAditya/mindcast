'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import SleepTrackerContent from './components/SleepTrackerContent';

export default function SleepPage() {
  return (
    <AppLayout>
      <SleepTrackerContent />
    </AppLayout>
  );
}
