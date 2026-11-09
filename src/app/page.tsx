import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  FileHeart,
  Lock,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
  Stethoscope,
  Timer,
} from 'lucide-react';
import { PublicPage } from '@/components/public/SiteChrome';
import { ButtonLink } from '@/components/ui';

export default function Landing() {
  return (
    <PublicPage>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(214,180,106,0.10),transparent_70%)]"
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <p className="label-eyebrow mb-5 text-gold">
              Personal wellbeing &amp; health intelligence
            </p>
            <h1 className="text-4xl font-semibold leading-[1.08] text-ivory sm:text-5xl lg:text-[56px]">
              Understand the patterns behind how you feel.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-stone">
              NEURIX brings your mood, sleep, habits, health records and self-assessments into one
              private place — so you can see what tends to move together, reflect with SOUL, and
              share exactly what you choose with your doctor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" size="lg" icon={<ArrowRight className="h-4 w-4" />}>
                Create your private space
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone">
              {[
                'Nothing is shared unless you choose to',
                'Journals are never shared with doctors',
                'Not a diagnosis or medical service',
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-sage" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>
      </section>

      {/* About */}
      <Section
        id="about"
        eyebrow="What NEURIX is"
        title="One calm place for the things that shape your days."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Activity,
              t: 'Track gently',
              b: 'Log mood, sleep, activity, hydration, habits and screen time in seconds. Skip days without guilt.',
            },
            {
              icon: BarChart3,
              t: 'Notice patterns',
              b: 'See what tends to move together over weeks — with the number of records and the date range always shown.',
            },
            {
              icon: Stethoscope,
              t: 'Share with care',
              b: 'Connect a verified clinician and choose which categories they can see, for how long. Revoke any time.',
            },
          ].map((f) => (
            <Feature key={f.t} {...f} />
          ))}
        </div>
      </Section>

      {/* SOUL */}
      <Section id="soul" eyebrow="SOUL" title="A reflective companion — not a therapist." alt>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4 text-stone">
            <p>
              SOUL helps you put words to what you notice, using only the data you allow it to read.
              It explains where its observations come from, and it says so when it doesn’t know.
            </p>
            <ul className="space-y-3">
              {[
                'Never diagnoses, prescribes or suggests changing treatment.',
                'Clearly labels AI-generated text and the data it used.',
                'Recognises crisis language and points you to real help.',
                'Only reads journals or medical data if you switch that on.',
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" aria-hidden />
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="surface space-y-4 p-6">
            <p className="label-eyebrow">How SOUL replies</p>
            <ol className="space-y-3 text-sm text-stone">
              {[
                [
                  'You ask a question',
                  'For example, about how your sleep and mood have changed recently.',
                ],
                [
                  'The NEURIX server gathers only what you allowed',
                  'Journal and medical data are included only if you have switched them on.',
                ],
                [
                  'The reply is labelled',
                  'You can see that it is AI-generated and which kinds of data it used.',
                ],
                [
                  'Crisis language gets a fixed safety response',
                  'Pointing to emergency and crisis services, instead of an AI reply.',
                ],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold-line text-xs text-gold">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-ivory">{t}</span>
                    {d}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* Records / assessments / insights / tracking */}
      <Section
        id="records"
        eyebrow="My Health"
        title="Your records, history and documents — organised and private."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={FileHeart}
            t="Medical records"
            b="Lab results, prescriptions, imaging, notes — with private document upload. Files are never publicly accessible."
          />
          <Feature
            icon={ClipboardList}
            t="Health history"
            b="Conditions, medications, allergies and surgeries, with status and dates."
          />
          <Feature
            icon={Moon}
            t="Sleep & lifestyle"
            b="Daily logs for sleep, activity, hydration and time outdoors."
          />
          <Feature
            icon={Timer}
            t="Manual screen time"
            b="Enter your phone’s screen-time totals yourself. NEURIX does not read your device."
          />
        </div>
      </Section>

      <Section
        id="assessments"
        eyebrow="Assessment Centre"
        title="Structured self-reflection, scored transparently."
        alt
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface p-6">
            <p className="label-eyebrow text-sage">Validated screeners</p>
            <h3 className="mt-2 text-lg font-semibold">PHQ-9 · GAD-7 · WHO-5</h3>
            <p className="mt-2 text-sm text-stone">
              Standard published questionnaires, scored by the NEURIX server with the published
              scoring rules. A screening result is not a diagnosis — it’s a conversation starter
              with a professional.
            </p>
          </div>
          <div className="surface p-6">
            <p className="label-eyebrow text-softblue">Exploratory reflection modules</p>
            <h3 className="mt-2 text-lg font-semibold">Seven modules · 30 to 50 questions</h3>
            <p className="mt-2 text-sm text-stone">
              Emotional wellbeing, personality tendencies, thinking and decisions, sleep and
              lifestyle, stress and coping, relationships and family, and a comprehensive overview.
              Original NEURIX questions with fixed, versioned scoring — labelled as exploratory, not
              clinically validated.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="insights"
        eyebrow="Insights & tracking"
        title="Patterns you can check — never mysterious scores."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={BarChart3}
            t="Honest insights"
            b="Every insight shows its date range and how many records it’s based on. Correlation is never presented as causation."
          />
          <Feature
            icon={BookOpen}
            t="Private journal"
            b="Your journal is never shared with doctors and is only read by SOUL if you explicitly allow it."
          />
          <Feature
            icon={Sparkles}
            t="Goals & reminders"
            b="Set gentle goals and in-app reminders. We don’t promise push notifications we don’t send."
          />
        </div>
      </Section>

      <Section
        id="sharing"
        eyebrow="Doctor sharing"
        title="You decide who sees what — and for how long."
        alt
      >
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            [
              'Enter your doctor’s code',
              'A code identifies a verified clinician. It never grants access on its own.',
            ],
            [
              'They accept the connection',
              'Nothing is visible until you grant at least one category.',
            ],
            [
              'Grant categories, set expiry',
              'Records, assessments, mood, sleep… Each one separately. Every view is logged in your audit trail.',
            ],
          ].map(([t, b], i) => (
            <li key={t} className="surface p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-line text-sm font-semibold text-gold">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-stone">{b}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="privacy" eyebrow="Privacy" title="Built so that private things stay private.">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={Lock}
            t="Row-level security"
            b="The database itself only returns rows that belong to you or that you have actively shared."
          />
          <Feature
            icon={Shield}
            t="Signed, short-lived document links"
            b="Medical files are stored privately and opened with links that expire within minutes."
          />
          <Feature
            icon={MessageCircle}
            t="Separate AI consent"
            b="SOUL needs your explicit consent, with separate switches for journal and medical data."
          />
        </div>
        <p className="mt-6 text-sm text-stone">
          We describe what we’ve built honestly. NEURIX has not been independently certified for any
          healthcare regulation.{' '}
          <Link
            className="text-gold-pale underline underline-offset-4 hover:text-gold"
            href="/privacy"
          >
            Read the privacy policy
          </Link>
          .
        </p>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Questions people ask" alt>
        <div className="mx-auto max-w-3xl divide-y divide-divider rounded-2xl border border-bronze bg-graphite">
          {[
            [
              'Is NEURIX a medical service?',
              'No. NEURIX is a self-tracking and reflection tool. It does not diagnose or treat anything, and it does not replace professional care.',
            ],
            [
              'Can my doctor read my journal?',
              'No. Journals, SOUL conversations and reminders can never be shared through NEURIX. Doctors only see categories you grant.',
            ],
            [
              'Does NEURIX track my phone automatically?',
              'No. Screen time is entered manually, from the totals your phone shows you.',
            ],
            [
              'What happens if I’m in crisis?',
              'SOUL is not an emergency service. If you’re in danger, contact your local emergency number or a crisis line immediately. The app shows support options on every SOUL screen.',
            ],
            [
              'Can I delete my data?',
              'Yes. You can delete individual entries, records and conversations at any time from within the app.',
            ],
          ].map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ivory">
                {q}
                <span className="text-gold transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-stone">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold">Start noticing what matters to you.</h2>
        <p className="mx-auto mt-3 max-w-lg text-stone">
          Create an account with your email address.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/signup" size="lg">
            Create account
          </ButtonLink>
          <ButtonLink href="/doctor/login" size="lg" variant="secondary">
            I’m a clinician
          </ButtonLink>
        </div>
      </section>
    </PublicPage>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
  alt,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  alt?: boolean;
}) {
  return (
    <section id={id} className={alt ? 'border-y border-bronze/60 bg-[#151515]' : ''}>
      <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="label-eyebrow mb-3 text-gold">{eyebrow}</p>
        <h2 className="mb-10 max-w-2xl text-3xl font-semibold leading-tight">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  t,
  b,
}: {
  icon: React.ComponentType<{ className?: string }>;
  t: string;
  b: string;
}) {
  return (
    <div className="surface p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-bronze bg-graphite-deep text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{t}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-stone">{b}</p>
    </div>
  );
}

/** A schematic of the app's sections. It shows no numbers, scores or results. */
function HeroPreview() {
  const tiles: [string, string][] = [
    ['Wellbeing', 'Mood, sleep, activity, water, manual screen time'],
    ['My Health', 'Records, history, private documents'],
    ['Assessment Centre', 'Validated screeners and reflection modules'],
    ['Insights', 'Trends with date ranges and record counts'],
    ['SOUL', 'Reflective AI companion, with your consent'],
    ['Doctor sharing', 'Per-category, revocable, logged'],
  ];
  return (
    <div className="surface relative p-5 sm:p-6" aria-label="Overview of the main areas of NEURIX">
      <p className="label-eyebrow">Inside NEURIX</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {tiles.map(([t, d]) => (
          <li key={t} className="rounded-xl border border-bronze bg-graphite-deep p-4">
            <p className="font-medium text-ivory">{t}</p>
            <p className="mt-1 text-xs text-stone">{d}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
