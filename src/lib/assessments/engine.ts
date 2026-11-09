/**
 * Exploratory assessment engine: parses the question bank, selects the 30/40/50-item form, and scores answers
 * deterministically. Same module version + same answers ⇒ same result, always. No AI is involved in scoring.
 */
import { MODULE_SPECS, type ModuleSpec } from './bank';

export type Format = 'likert5' | 'likert7' | 'frequency' | 'single' | 'scenario' | 'multi' | 'text';
export interface Option {
  value: string;
  label: string;
  score?: number;
}
export interface Question {
  id: string;
  domain: string;
  text: string;
  format: Format;
  reverse: boolean;
  options: Option[];
  scored: boolean;
  tier: 30 | 40 | 50;
  followUp?: { text: string; kind: 'question' | 'note' };
}
export type Answer = string | string[];
export type Answers = Record<string, Answer>;
export const LENGTHS = [30, 40, 50] as const;
export type Length = (typeof LENGTHS)[number];

export interface Module {
  id: string;
  version: string;
  title: string;
  tagline: string;
  description: string;
  domains: { id: string; label: string; about: string; low: string; high: string }[];
  questions: Question[];
}

const LIKERT5 = [
  'Strongly disagree',
  'Disagree',
  'Neither agree nor disagree',
  'Agree',
  'Strongly agree',
];
const LIKERT7 = [
  'Strongly disagree',
  'Disagree',
  'Somewhat disagree',
  'Neutral',
  'Somewhat agree',
  'Agree',
  'Strongly agree',
];
const FREQ = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
const scale = (labels: string[]): Option[] =>
  labels.map((label, i) => ({ value: String(i), label, score: i / (labels.length - 1) }));

function parseItem(raw: string, domain: string, idx: number, moduleId: string): Question {
  const [body, follow] = raw.split('>>');
  const [code, text, opts] = body.split('|');
  const tier: Question['tier'] = idx < 6 ? 30 : idx < 8 ? 40 : 50;
  const base = {
    id: `${moduleId}.${domain}.${idx + 1}`,
    domain,
    text: text.trim(),
    tier,
    followUp: follow
      ? {
          text: follow.trim(),
          kind: follow.trim().endsWith('?') ? ('question' as const) : ('note' as const),
        }
      : undefined,
  };
  const choice = (): Option[] =>
    (opts ?? '').split(';').map((o, i) => {
      const eq = o.lastIndexOf('=');
      return { value: String(i), label: o.slice(0, eq).trim(), score: Number(o.slice(eq + 1)) };
    });
  switch (code) {
    case 'L5':
    case 'L5R':
      return {
        ...base,
        format: 'likert5',
        reverse: code.endsWith('R'),
        options: scale(LIKERT5),
        scored: true,
      };
    case 'L7':
    case 'L7R':
      return {
        ...base,
        format: 'likert7',
        reverse: code.endsWith('R'),
        options: scale(LIKERT7),
        scored: true,
      };
    case 'F':
    case 'FR':
      return {
        ...base,
        format: 'frequency',
        reverse: code === 'FR',
        options: scale(FREQ),
        scored: true,
      };
    case 'S':
      return { ...base, format: 'single', reverse: false, options: choice(), scored: true };
    case 'SC':
      return { ...base, format: 'scenario', reverse: false, options: choice(), scored: true };
    case 'M':
      return { ...base, format: 'multi', reverse: false, options: choice(), scored: true };
    case 'T':
      return { ...base, format: 'text', reverse: false, options: [], scored: false };
    default:
      throw new Error(`Unknown item code ${code} in ${base.id}`);
  }
}

function build(spec: ModuleSpec): Module {
  const questions: Question[] = [];
  // Interleave domains so the form moves between topics instead of asking ten similar questions in a row.
  const max = Math.max(...spec.domains.map((d) => d.items.length));
  for (let i = 0; i < max; i++)
    for (const d of spec.domains)
      if (d.items[i]) questions.push(parseItem(d.items[i], d.id, i, spec.id));
  const { domains, ...rest } = spec;
  return { ...rest, domains: domains.map(({ items: _items, ...d }) => d), questions };
}

export const MODULES: Module[] = MODULE_SPECS.map(build);
export const getModule = (id: string) => MODULES.find((m) => m.id === id);
export const formFor = (m: Module, length: Length) => m.questions.filter((q) => q.tier <= length);

/** Score of one answered item on 0–1 (favourable = 1), or null when unanswered/unscored. */
export function itemScore(q: Question, a: Answer | undefined): number | null {
  if (!q.scored || a === undefined || a === '' || (Array.isArray(a) && !a.length)) return null;
  if (q.format === 'multi') {
    const picked = q.options.filter((o) => (a as string[]).includes(o.value));
    return Math.min(
      1,
      picked.reduce((s, o) => s + (o.score ?? 0), 0)
    );
  }
  const o = q.options.find((x) => x.value === a);
  if (!o || o.score === undefined) return null;
  return q.reverse ? 1 - o.score : o.score;
}

export const needsFollowUp = (q: Question, a: Answer | undefined) => {
  const s = itemScore(q, a);
  return !!q.followUp && s !== null && s <= 0.25;
};

export type Band = 'explore' | 'mixed' | 'strength' | 'insufficient';
export const BAND_LABEL: Record<Band, string> = {
  explore: 'Area to explore',
  mixed: 'Mixed',
  strength: 'Relative strength',
  insufficient: 'Not enough answers',
};
// Descriptive bands for self-reflection only. They are NOT clinical cut-offs.
const band = (score: number | null): Band =>
  score === null ? 'insufficient' : score < 40 ? 'explore' : score < 70 ? 'mixed' : 'strength';

export interface DomainResult {
  id: string;
  label: string;
  score: number | null;
  band: Band;
  answered: number;
  total: number;
  summary: string;
}
export interface ExploratoryResult {
  module: string;
  version: string;
  length: Length;
  overall: number | null;
  answered: number;
  total: number;
  domains: DomainResult[];
  strengths: string[];
  explore: string[];
  patterns: string[];
  recommendations: string[];
  limitations: string[];
  scoring: string;
}

const TIPS: Record<string, string[]> = {
  'sleep.routine': [
    'Pick a wake-up time you can keep every day, including weekends, for two weeks.',
    'Start a 20-minute wind-down: dim lights, no work, something calm.',
  ],
  'sleep.onset': [
    'If you can’t sleep after about 20 minutes, get up and do something quiet in low light until you feel sleepy.',
    'Try writing tomorrow’s to-do list before bed to park busy thoughts.',
  ],
  'sleep.continuity': [
    'Avoid checking the clock at night — turn it away from you.',
    'If night waking is frequent or long-lasting, mention it to a GP.',
  ],
  'sleep.restoration': [
    'Track sleep and energy together for a week to see how they relate for you.',
    'Keep naps short (under 30 minutes) and before mid-afternoon.',
  ],
  'sleep.environment': [
    'Make the room darker and cooler, and try keeping your phone out of reach overnight.',
  ],
  'stress.load': ['List current demands and mark one you could drop, delay or share this week.'],
  'stress.body': ['Try a 60-second body scan once a day: jaw, shoulders, hands, breath.'],
  'stress.coping': [
    'Choose one helpful coping action (a walk, a call, a short breathing exercise) to try the next time stress rises.',
  ],
  'stress.recovery': [
    'Schedule one genuinely restful activity this week and treat it like an appointment.',
  ],
  'stress.control': [
    'Sort worries into “can influence” and “can’t influence”, and pick one small action for the first list.',
  ],
  'focus.sustained': [
    'Try short focused blocks (for example 25 minutes) followed by a 5-minute break.',
  ],
  'focus.distraction': [
    'Turn on a focus mode or put your phone in another room during one block of work each day.',
  ],
  'focus.organisation': [
    'Use one place for tasks — a single list or calendar — and review it each morning.',
  ],
  'focus.energy': ['Notice your best time of day and protect it for your hardest task.'],
  'focus.followthrough': [
    'Shrink the first step until it takes under two minutes, then start it now.',
  ],
  'emotions.awareness': ['Pause twice a day to name what you feel in one word.'],
  'emotions.stability': [
    'Log mood alongside sleep for a couple of weeks — patterns are often easier to see on paper.',
  ],
  'emotions.regulation': [
    'When feelings run high, try slow breathing with a longer out-breath before responding.',
  ],
  'emotions.selfcompassion': [
    'When you notice self-criticism, ask: “What would I say to a friend here?”',
  ],
  'emotions.positive': ['Write down three small good things at the end of each day for a week.'],
  'connection.support': ['Reach out to one person this week, even with a short message.'],
  'connection.belonging': [
    'Consider a regular group activity — a class, club, faith group or volunteering.',
  ],
  'connection.communication': ['Practise “I feel … when … I need …” in a low-stakes conversation.'],
  'connection.boundaries': [
    'Pick one boundary to state clearly this week, such as times you’re unavailable.',
  ],
  'connection.conflict': [
    'After a disagreement, try a short repair conversation once you’re both calm.',
  ],
  'habits.movement': ['Add a 10-minute walk to a part of your day you already do.'],
  'habits.nutrition': ['Keep a water bottle visible and aim for regular meal times.'],
  'habits.substances': [
    'Try moving your last caffeine earlier, or adding alcohol-free days, and notice the effect on sleep.',
  ],
  'habits.screens': ['Set one screen-free window, such as the first 30 minutes after waking.'],
  'habits.outdoors': ['Get 10–15 minutes of daylight outside, ideally in the morning.'],
  'wellbeing.purpose': [
    'Write down what matters most to you and one small action that reflects it this week.',
  ],
  'wellbeing.growth': ['Choose one small thing to learn or try this month.'],
  'wellbeing.satisfaction': [
    'Notice which areas of life feel most and least satisfying, and focus on one small change.',
  ],
  'wellbeing.balance': ['Plan one block of unstructured time for rest or fun this week.'],
  'wellbeing.values': ['Each evening, note one moment where you acted in line with your values.'],
};

export const LIMITATIONS = [
  'This is an exploratory self-reflection module written for NEURIX. It has not been clinically validated.',
  'Scores describe your answers on this occasion only. They are not a diagnosis and do not measure any condition.',
  'Bands (“area to explore”, “mixed”, “relative strength”) are descriptive and are not clinical thresholds.',
  'Results can change with mood, circumstances and how questions are interpreted.',
  'If something in your results worries you, talk to a GP or another qualified professional.',
];

export function scoreExploratory(m: Module, length: Length, answers: Answers): ExploratoryResult {
  const form = formFor(m, length);
  const domains: DomainResult[] = m.domains.map((d) => {
    const qs = form.filter((q) => q.domain === d.id && q.scored);
    const scores = qs
      .map((q) => itemScore(q, answers[q.id]))
      .filter((x): x is number => x !== null);
    // A domain needs at least half its scored items answered to be reported.
    const score =
      scores.length >= Math.ceil(qs.length / 2) && scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
        : null;
    const b = band(score);
    return {
      id: d.id,
      label: d.label,
      score,
      band: b,
      answered: scores.length,
      total: qs.length,
      summary:
        b === 'insufficient'
          ? 'Answer more questions in this area to see a score.'
          : score! < 50
            ? d.low
            : d.high,
    };
  });
  const valid = domains.filter((d) => d.score !== null) as (DomainResult & { score: number })[];
  const overall = valid.length
    ? Math.round(valid.reduce((a, d) => a + d.score, 0) / valid.length)
    : null;
  const sorted = [...valid].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const strengths = sorted
    .filter((d) => d.band === 'strength')
    .slice(0, 2)
    .map((d) => d.label);
  const explore = [...sorted]
    .reverse()
    .filter((d) => d.band !== 'strength')
    .slice(0, 2)
    .map((d) => d.label);

  const patterns: string[] = [];
  if (sorted.length >= 2) {
    const spread = sorted[0].score - sorted[sorted.length - 1].score;
    patterns.push(
      spread >= 30
        ? `Your answers vary a lot between areas: “${sorted[0].label}” scored ${sorted[0].score} and “${sorted[sorted.length - 1].label}” scored ${sorted[sorted.length - 1].score}.`
        : `Your scores are fairly even across areas (a spread of ${spread} points).`
    );
  }
  const explores = valid.filter((d) => d.band === 'explore');
  if (explores.length >= 3)
    patterns.push(
      `${explores.length} of ${valid.length} areas fall in “area to explore”. It may help to focus on one at a time.`
    );
  if (valid.every((d) => d.band === 'strength'))
    patterns.push('Every area scored as a relative strength in this attempt.');
  const unanswered = form.filter((q) => q.scored && itemScore(q, answers[q.id]) === null).length;
  if (unanswered)
    patterns.push(
      `${unanswered} scored question${unanswered > 1 ? 's were' : ' was'} skipped, so some areas are based on fewer answers.`
    );

  const focus = [...valid]
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
    .filter((d) => d.score < 70)
    .slice(0, 3);
  const recommendations = focus.flatMap((d) => (TIPS[`${m.id}.${d.id}`] ?? []).slice(0, 1));
  if (!recommendations.length)
    recommendations.push(
      'Keep doing what’s working, and revisit this module in a few weeks to compare.'
    );

  return {
    module: m.id,
    version: m.version,
    length,
    overall,
    answered: Object.keys(answers).filter((k) => form.some((q) => q.id === k)).length,
    total: form.length,
    domains,
    strengths,
    explore,
    patterns,
    recommendations,
    limitations: LIMITATIONS,
    scoring: `Each answered item is converted to 0–1 (favourable = 1; reverse-worded items are flipped), averaged per area and shown as 0–100. Areas need at least half their items answered. Module ${m.id} v${m.version}, ${length}-question form.`,
  };
}
