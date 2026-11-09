'use client';
import { PublicPage } from '@/components/public/SiteChrome';
import { PrivacyPolicy } from '@/components/public/PrivacyPolicy';
import PatientShell from '@/components/shell/PatientShell';
import PrivacyCentre from '@/components/features/PrivacyCentre';
import { useAuth } from '@/context/auth';
import { FullScreenLoader } from '@/components/shell/guards';

/** Signed out: the public privacy policy. Signed in: the patient’s Privacy centre. */
export default function PrivacyPage() {
  const { ready, session } = useAuth();
  if (!ready) return <FullScreenLoader />;
  if (!session)
    return (
      <PublicPage>
        <PrivacyPolicy />
      </PublicPage>
    );
  return (
    <PatientShell>
      <PrivacyCentre />
    </PatientShell>
  );
}
