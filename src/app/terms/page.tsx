import type { Metadata } from 'next';
import { PublicPage } from '@/components/public/SiteChrome';
import { Prose } from '@/components/public/Prose';

export const metadata: Metadata = { title: 'Terms of use' };

export default function Terms() {
  return (
    <PublicPage>
      <Prose title="Terms of use" updated="9 November 2026">
        <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">
          This is a plain-language draft prepared for the product. It has not been reviewed by a
          lawyer and should be checked before public launch.
        </p>
        <section>
          <h2>1. What NEURIX is</h2>
          <p>
            NEURIX is a personal self-tracking, reflection and record-keeping tool. It is not a
            medical device, does not provide medical advice, diagnosis or treatment, and is not an
            emergency service.
          </p>
        </section>
        <section>
          <h2>2. Your account</h2>
          <ul>
            <li>You must provide accurate information and keep your password secret.</li>
            <li>You are responsible for activity on your account.</li>
            <li>You can stop using NEURIX and delete your content at any time.</li>
          </ul>
        </section>
        <section>
          <h2>3. Assessments and insights</h2>
          <p>
            Validated screeners (PHQ-9, GAD-7, WHO-5) are scored with their published rules;
            exploratory modules are for self-reflection only. Results are not a diagnosis. Insights
            describe patterns in your own records and never imply that one thing causes another.
          </p>
        </section>
        <section>
          <h2>4. SOUL (AI companion)</h2>
          <p>
            SOUL produces AI-generated text and can be wrong. It will not diagnose, prescribe, or
            suggest changes to treatment. Use it only after reading and accepting its consent
            notice. If you are in danger, contact local emergency services.
          </p>
        </section>
        <section>
          <h2>5. Clinicians</h2>
          <p>
            Clinicians must apply and be verified by an administrator before patients can share data
            with them. Clinicians may only view categories a patient has actively granted, and only
            for clinical purposes agreed with that patient. Every access is logged.
          </p>
        </section>
        <section>
          <h2>6. Acceptable use</h2>
          <ul>
            <li>Do not upload content you do not have the right to store.</li>
            <li>Do not attempt to access other people’s data or interfere with the service.</li>
          </ul>
        </section>
        <section>
          <h2>7. Availability</h2>
          <p>
            We aim to keep NEURIX available but cannot guarantee uninterrupted service. Some
            features (such as SOUL) may be unavailable when the underlying provider is not
            configured.
          </p>
        </section>
        <section>
          <h2>8. Changes</h2>
          <p>
            We will update these terms when the product changes and show the date at the top of this
            page.
          </p>
        </section>
      </Prose>
    </PublicPage>
  );
}
