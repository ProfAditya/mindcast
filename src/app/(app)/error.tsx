'use client';
import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="surface max-w-md p-7 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose" />
        <h1 className="mt-4 text-lg font-semibold">Something went wrong on this screen</h1>
        <p className="mt-2 text-sm text-stone">
          Your data is safe. Try again, or go back to the dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <ButtonLink href="/dashboard" variant="secondary">
            Dashboard
          </ButtonLink>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
