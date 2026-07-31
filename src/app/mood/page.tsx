'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import MoodTrackerContent from './components/MoodTrackerContent';

export default function MoodPage() {
  return (
    <AppLayout>
      <MoodTrackerContent />
    </AppLayout>
  );
}
