import { Prose } from './Prose';

export function PrivacyPolicy() {
  return (
    <Prose title="Privacy policy" updated="9 November 2026">
      <p className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm">This policy describes how the NEURIX software is built. It is a draft that has not been legally reviewed, and NEURIX has not been certified against HIPAA, GDPR or any other regulation.</p>
      <section><h2>What we store</h2><ul><li>Account details: name, email, optional date of birth.</li><li>What you log: mood, wellbeing, habits, screen time you enter manually, journal entries, goals and reminders.</li><li>Health information you add: records, history, uploaded documents, and assessment answers and scores.</li><li>SOUL conversations, and only if you consent.</li><li>A log of consent changes and of every time a clinician accesses your data.</li></ul></section>
      <section><h2>How it is protected</h2><ul><li>Data is stored in a Supabase Postgres database with row-level security: each query only returns rows you own or have shared.</li><li>Uploaded documents are kept in private storage and opened through signed links that expire within minutes.</li><li>The browser only ever holds public configuration; server secrets stay on the server.</li></ul></section>
      <section><h2>Sharing with clinicians</h2><p>Nothing is shared by default. A doctor code only identifies a verified clinician; it never grants access by itself. You choose categories one by one, can set an expiry, and can revoke at any time. Journals, SOUL conversations and reminders can never be shared.</p></section>
      <section><h2>AI processing</h2><p>When you use SOUL, the parts of your data covered by your consent are sent from the NEURIX server to the configured AI provider to generate a reply. Journal and medical data have separate switches and are off unless you turn them on. The browser never contacts the AI provider directly.</p></section>
      <section><h2>Your choices</h2><ul><li>Review and change AI consent and sharing in the Privacy centre.</li><li>Delete individual entries, records, documents and conversations.</li><li>See who accessed your shared data in your audit trail.</li></ul></section>
      <section><h2>What we don’t do</h2><ul><li>We don’t sell your data or show ads.</li><li>We don’t read your phone’s usage automatically.</li></ul></section>
    </Prose>
  );
}
