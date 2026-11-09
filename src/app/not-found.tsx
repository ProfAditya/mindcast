import { PublicPage } from '@/components/public/SiteChrome';
import { ButtonLink } from '@/components/ui';

export default function NotFound() {
  return (
    <PublicPage>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <p className="text-6xl font-semibold text-gold">404</p>
        <h1 className="mt-4 text-2xl font-semibold">This page doesn’t exist</h1>
        <p className="mt-2 text-stone">The link may be old, or the address may have a typo.</p>
        <div className="mt-7 flex gap-2">
          <ButtonLink href="/" variant="secondary">
            Home
          </ButtonLink>
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
        </div>
      </div>
    </PublicPage>
  );
}
