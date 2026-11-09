import PatientShell from '@/components/shell/PatientShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <PatientShell>{children}</PatientShell>;
}
