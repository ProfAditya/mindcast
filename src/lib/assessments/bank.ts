/**
 * NEURIX exploratory assessment modules.
 *
 * These are original NEURIX self-reflection questionnaires, NOT validated clinical instruments. They have not been
 * psychometrically validated, and every result screen says so.
 *
 * Compact item syntax (parsed in ./engine.ts):
 *   L5|text            5-point agree scale, agreement scores toward the domain's "high" end
 *   L5R|text           5-point agree scale, reverse-scored
 *   L7|text / L7R|text 7-point agree scale
 *   F|text / FR|text   frequency (Never … Always); FR = reverse-scored
 *   S|text|a=1;b=0.5   single choice; number after '=' is the item score 0–1
 *   SC|text|…          situational question (single choice describing a likely response)
 *   M|text|…           multiple choice; score = sum of chosen option scores, capped at 1
 *   T|text             free-text reflection, optional, never scored
 * An item may end with  >>follow-up  : shown only when the answer scores ≤ 0.25. Text ending in '?' is an optional free-text
 * follow-up question; any other text is shown as an information note.
 *
 * Domain kinds:
 *   'wellbeing'  higher = more favourable for the person (e.g. recovery after stress). Banded and used for suggestions.
 *   'tendency'   a preference between two poles (e.g. prefers solitude ↔ seeks company). Neither end is better; no bands
 *                of "strength" or "area to explore", and tendencies never contribute to an overall score.
 *
 * Each domain lists 10 items: items 1–6 form the 30-question version, 7–8 are added for 40, 9–10 for 50.
 * Changing wording, order or scoring REQUIRES bumping the module version.
 */
import { LIBRARY } from './library';

export interface DomainSpec {
  id: string;
  label: string;
  about: string;
  low: string;
  high: string;
  items: string[];
  kind?: 'wellbeing' | 'tendency';
  /** For tendencies: names of the two poles. */
  poles?: [string, string];
  /** Library key (module.domain) used to look up suggestions. */
  source?: string;
}
export interface ModuleSpec {
  id: string;
  version: string;
  title: string;
  tagline: string;
  description: string;
  domains: DomainSpec[];
  lengths?: (30 | 40 | 50)[];
  sensitive?: string;
  related?: string[];
}

const lib = (
  moduleId: string,
  domainId: string,
  overrides: Partial<DomainSpec> = {}
): DomainSpec => {
  const d = LIBRARY.find((m) => m.id === moduleId)?.domains.find((x) => x.id === domainId);
  if (!d) throw new Error(`Unknown library domain ${moduleId}.${domainId}`);
  return { ...d, kind: 'wellbeing', source: `${moduleId}.${domainId}`, ...overrides };
};

// ─── New domains: personality and behavioural tendencies (all 'tendency') ───────────────────────
const PERSONALITY: DomainSpec[] = [
  {
    id: 'sociability',
    label: 'Sociability',
    kind: 'tendency',
    poles: ['Prefers quieter, smaller settings', 'Seeks company and lively settings'],
    about: 'How much you seek out social contact and stimulation.',
    low: 'You tend to recharge alone or with a few people.',
    high: 'You tend to draw energy from being around others.',
    items: [
      'L5|I feel energised after spending time with a group of people.',
      'L5R|I need time alone to recharge after socialising.',
      'L5|I enjoy meeting new people.',
      'S|Would you rather spend a free evening…|At a lively gathering=1;With one or two close friends=0.5;On my own=0',
      'L5|I start conversations with people I don’t know.',
      'L5R|I prefer listening to talking in groups.',
      'SC|You arrive at an event where you know only the host. What do you usually do?|Introduce myself to people=1;Stay near the host and join in when invited=0.5;Find a quiet corner or leave early=0.1',
      'L7|I like being the centre of attention now and then.',
      'S|Would you prefer working alone or collaborating?|Mostly collaborating=1;A mix of both=0.5;Mostly alone=0',
      'T|Describe a social setting where you feel most at ease.',
    ],
  },
  {
    id: 'openness',
    label: 'Openness to experience',
    kind: 'tendency',
    poles: ['Prefers the familiar', 'Seeks novelty and new ideas'],
    about: 'Curiosity, imagination and interest in new experiences.',
    low: 'You tend to value the familiar and proven.',
    high: 'You tend to seek new ideas and experiences.',
    items: [
      'L5|I enjoy trying foods, places or activities I haven’t tried before.',
      'L5|I’m curious about how things work.',
      'L5R|I prefer routines to new experiences.',
      'L5|I enjoy art, music or ideas that make me think.',
      'L5|I like considering different points of view.',
      'L5R|Abstract or theoretical discussions bore me.',
      'SC|A friend suggests an unusual activity you’ve never heard of. What’s most like you?|Say yes straight away=1;Ask a few questions, then probably go=0.6;Suggest something familiar instead=0.1',
      'L7|I often daydream or imagine possibilities.',
      'F|I seek out new information or skills for fun.',
      'T|What is something new you’d like to explore?',
    ],
  },
  {
    id: 'conscientiousness',
    label: 'Organisation',
    kind: 'tendency',
    poles: ['Flexible and spontaneous', 'Structured and planned'],
    about: 'Preference for structure, planning and follow-through.',
    low: 'You tend to keep things flexible and spontaneous.',
    high: 'You tend to prefer structure and planning.',
    items: [
      'L5|I prefer planning before taking action.',
      'L5|I like my space to be orderly.',
      'L5R|I tend to leave things to the last minute.',
      'L5|I pay attention to details.',
      'L5|I keep commitments I make.',
      'S|When starting a trip, you usually…|Have a detailed plan=1;Have a rough idea=0.5;Decide as I go=0',
      'L7|I follow a schedule most days.',
      'L5R|I find rules and routines restrictive.',
      'SC|You have a free weekend with several tasks to do. What usually happens?|I list and schedule them=1;I tackle whichever feels right=0.5;I leave them for later=0.1',
      'L5|I double-check my work.',
    ],
  },
  {
    id: 'cooperation',
    label: 'Cooperation',
    kind: 'tendency',
    poles: ['Direct and independent', 'Accommodating and cooperative'],
    about: 'How you tend to balance your own views with others’.',
    low: 'You tend to be direct and hold your own position.',
    high: 'You tend to accommodate others and seek harmony.',
    items: [
      'L5|I try to find solutions that work for everyone.',
      'L5|I give people the benefit of the doubt.',
      'L5R|I enjoy a good argument.',
      'L5|I go out of my way to help others.',
      'L5R|I say what I think even if it upsets people.',
      'L5|I avoid being critical of others.',
      'SC|In a group project, someone proposes an idea you think is weak. What do you usually do?|Build on it to find a better version together=1;Say politely that I see problems=0.6;Argue firmly for my own idea=0.15',
      'L7|I put the group’s needs before my own.',
      'L5R|I find it hard to compromise.',
      'SC|Someone close to you needs support while you are already busy. What would you most likely do?|Make time straight away=1;Help briefly and arrange a better time=0.7;Explain I can’t right now=0.3',
    ],
  },
  {
    id: 'reactivity',
    label: 'Emotional reactivity',
    kind: 'tendency',
    poles: ['Even-tempered', 'Strongly responsive'],
    about: 'How strongly and quickly you react to events emotionally.',
    low: 'You tend to stay fairly even when things happen.',
    high: 'You tend to feel events strongly and quickly.',
    items: [
      'L5|Small setbacks affect my mood.',
      'L5|I feel things deeply.',
      'L5R|I stay calm under pressure.',
      'L5|I worry about how things will turn out.',
      'L5R|It takes a lot to upset me.',
      'L5|My emotions show on my face.',
      'SC|You receive unexpected criticism. What is your usual reaction?|I feel it strongly for a while=1;It stings, then I move on=0.5;I stay mostly unaffected=0.1',
      'L7|I get excited easily.',
      'L5R|I rarely feel nervous.',
      'T|What kinds of situations stir the strongest feelings for you?',
    ],
  },
];

// ─── New domains: thinking and decision-making ──────────────────────────────────────────────────
const THINKING: DomainSpec[] = [
  {
    id: 'problem_solving',
    label: 'Problem-solving',
    kind: 'wellbeing',
    about: 'How you approach problems.',
    low: 'Problems may feel hard to get a grip on right now.',
    high: 'You approach problems in a structured way.',
    items: [
      'L5|When a problem appears, I first try to understand it fully.',
      'L5|I consider several possible solutions before choosing one.',
      'L5R|I freeze when faced with a hard problem.',
      'L5|I break big problems into smaller parts.',
      'SC|A difficult problem appears at work or home. How do you approach it?|Define it, list options, pick one=1;Ask someone experienced=0.8;Try the first idea that comes to mind=0.4;Hope it resolves itself=0.05',
      'F|I learn from how past problems were solved.',
      'L7|I stay persistent when the first solution fails.',
      'L5|I can explain my reasoning to others.',
      'FR|I jump to conclusions.',
      'T|Describe a problem you solved well.',
    ],
  },
  {
    id: 'decisions',
    label: 'Decision-making',
    kind: 'wellbeing',
    about: 'How confidently and deliberately you decide.',
    low: 'Decisions may feel hard or rushed at the moment.',
    high: 'You tend to make decisions with confidence and care.',
    items: [
      'L5|I feel confident in most decisions I make.',
      'FR|I second-guess decisions after making them.',
      'L5|I weigh pros and cons for important choices.',
      'FR|I put off decisions until it’s too late.',
      'L5|I can make a decision without needing everyone’s approval.',
      'SC|You must choose between two good job or study options by tomorrow. What do you do?|Compare them against what matters most to me=1;Talk it through with someone I trust=0.8;Go with my gut=0.5;Delay and ask for more time=0.2',
      'L7|I accept that some decisions turn out imperfectly.',
      'FR|I make impulsive purchases or choices I later regret.',
      'L5|I notice when emotions are steering a decision.',
      'T|What helps you make a good decision?',
    ],
  },
  lib('focus', 'organisation', { label: 'Planning & organisation' }),
  {
    id: 'risk',
    label: 'Risk preference',
    kind: 'tendency',
    poles: ['Cautious', 'Comfortable with risk'],
    about: 'How comfortable you are with risk and uncertainty in choices.',
    low: 'You tend to prefer safe, predictable choices.',
    high: 'You tend to be comfortable taking chances.',
    items: [
      'L5|I’m willing to take risks for something I want.',
      'L5R|I prefer a sure thing to a gamble.',
      'L5|I enjoy trying things where the outcome is uncertain.',
      'S|You’re offered a guaranteed small reward or a 50% chance of a reward three times bigger. You’d choose…|The 50% chance=1;It depends on the situation=0.5;The guaranteed reward=0',
      'L5R|I avoid situations where I might fail.',
      'L5|I’d try a new path even if others thought it unwise.',
      'L7|I like a bit of adventure in life.',
      'L5R|I research thoroughly before trying anything new.',
      'SC|Your plans suddenly change at the last minute. How do you typically respond?|See it as a chance for something new=1;Adjust and carry on=0.6;Feel unsettled and try to restore the plan=0.2',
      'T|When has taking a risk worked out well, or badly, for you?',
    ],
  },
  {
    id: 'flexibility',
    label: 'Flexibility & uncertainty',
    kind: 'wellbeing',
    about: 'Adapting your thinking and coping with not knowing.',
    low: 'Uncertainty or change may feel especially hard right now.',
    high: 'You adapt fairly well when things are uncertain.',
    items: [
      'L5|I can change my mind when I get new information.',
      'L5R|Not knowing how things will turn out really bothers me.',
      'L5|I can see a situation from more than one angle.',
      'FR|I get stuck on one way of doing things.',
      'L5|I cope well when plans change.',
      'L5R|I need to know exactly what will happen before I feel comfortable.',
      'L7|I can tolerate doubt while I wait for answers.',
      'F|I reflect on how I could have thought about something differently.',
      'SC|Results you were waiting for are delayed by a week. What’s most like you?|Get on with other things=1;Check in once or twice=0.6;Think about it constantly=0.1',
      'L5|I’m aware of my own thinking habits.',
    ],
  },
];

// ─── New domain: family environment (optional, sensitive) ───────────────────────────────────────
const FAMILY: DomainSpec = {
  id: 'family',
  label: 'Family environment',
  kind: 'wellbeing',
  about: 'Communication, support and pressures within your family, as you describe them.',
  low: 'Family life may be a source of strain at the moment.',
  high: 'Your family environment feels mostly supportive.',
  items: [
    'L5|I feel comfortable discussing problems with my family.',
    'L5|My family listens to my point of view.',
    'FR|Family responsibilities feel overwhelming.',
    'L5|I feel supported by at least one family member.',
    'FR|Disagreements at home leave me upset.',
    'L5|Roles and responsibilities at home feel fair.',
    'S|How would you describe communication in your family?|Open and respectful=1;Mostly fine=0.7;Strained=0.3;I prefer not to say=0.5',
    'L7|I feel I belong in my family.',
    'FR|I feel pressure to meet my family’s expectations.>>If home doesn’t feel safe, support is available — see the support options on the SOUL page.',
    'T|Is there anything about your family situation you’d like to reflect on? (optional)',
  ],
};

// ─── Modules ────────────────────────────────────────────────────────────────────────────────────
export const MODULE_SPECS: ModuleSpec[] = [
  {
    id: 'emotional',
    version: '1.0.0',
    title: 'Emotional wellbeing',
    tagline: 'Mood, awareness, worry and how you respond to feelings.',
    lengths: [30, 40],
    description:
      'Explores emotional awareness, how steady your mood feels, worry and pressure, how you respond to difficult feelings, and positive experiences. It does not screen for depression or anxiety — the validated PHQ-9 and GAD-7 do that.',
    domains: [
      lib('emotions', 'awareness'),
      lib('emotions', 'stability'),
      lib('stress', 'load', { label: 'Worry & pressure' }),
      lib('emotions', 'regulation'),
      lib('emotions', 'positive', { label: 'Positive experiences' }),
    ],
    related: ['coping', 'lifestyle'],
  },
  {
    id: 'personality',
    version: '1.0.0',
    title: 'Personality & behavioural tendencies',
    tagline: 'Preferences and typical patterns — not types or labels.',
    lengths: [30, 40, 50],
    description:
      'Describes where your preferences tend to sit on five dimensions: sociability, openness, organisation, cooperation and emotional reactivity. Neither end of a dimension is better. Your answers describe how you see yourself, not how you will always behave.',
    domains: PERSONALITY,
    related: ['thinking', 'comprehensive'],
  },
  {
    id: 'thinking',
    version: '1.0.0',
    title: 'Thinking & decision-making',
    tagline: 'Problem-solving, decisions, planning, risk and uncertainty.',
    lengths: [30, 40],
    description:
      'Looks at how you approach problems and decisions, plan, take risks and handle uncertainty. It is not an intelligence or attention test.',
    domains: THINKING,
    related: ['personality', 'coping'],
  },
  {
    id: 'lifestyle',
    version: '1.0.0',
    title: 'Sleep & lifestyle',
    tagline: 'Sleep, energy, movement, food and screens.',
    lengths: [30, 40, 50],
    description:
      'Looks at your sleep routine and how rested you feel, movement, eating and hydration, and screen habits. Your daily logs on the Wellbeing page show the actual measurements; this module captures how you experience them.',
    domains: [
      lib('sleep', 'routine', { label: 'Sleep routine' }),
      lib('sleep', 'restoration', { label: 'Rest & energy' }),
      lib('habits', 'movement'),
      lib('habits', 'nutrition'),
      lib('habits', 'screens'),
    ],
    related: ['emotional', 'coping'],
  },
  {
    id: 'coping',
    version: '1.0.0',
    title: 'Stress & coping',
    tagline: 'Pressure, setbacks, support-seeking and recovery.',
    lengths: [30, 40],
    description:
      'Explores how stress shows up for you, the ways you cope, how you handle conflict, your sense of control and how you recover.',
    domains: [
      lib('stress', 'body', { label: 'Stress signals' }),
      lib('stress', 'coping'),
      lib('connection', 'conflict', { label: 'Handling conflict' }),
      lib('stress', 'control'),
      lib('stress', 'recovery', { label: 'Recovery & resilience' }),
    ],
    related: ['emotional', 'relationships'],
  },
  {
    id: 'relationships',
    version: '1.0.0',
    title: 'Relationships & family',
    tagline: 'Support, belonging, communication and family life.',
    lengths: [30, 40, 50],
    sensitive:
      'This module includes optional questions about family life. Every question can be skipped, answers stay on this device, and NEURIX never infers family circumstances from other answers. Record family medical history under My Health → All history.',
    description:
      'Explores the support around you, belonging, communication, boundaries and your family environment, as you describe them.',
    domains: [
      lib('connection', 'support'),
      lib('connection', 'belonging'),
      lib('connection', 'communication'),
      lib('connection', 'boundaries'),
      FAMILY,
    ],
    related: ['coping', 'emotional'],
  },
  {
    id: 'comprehensive',
    version: '1.0.0',
    title: 'Comprehensive self-understanding',
    tagline: 'A broad profile across five areas — reported separately.',
    lengths: [50],
    description:
      'A 50-question overview covering emotional steadiness, coping, decision-making, rest and energy, and social support. Each area is reported on its own; 50 answers cannot describe a whole person, so use the focused modules to go deeper.',
    domains: [
      lib('emotions', 'stability', { id: 'emotional_steadiness', label: 'Emotional steadiness' }),
      lib('stress', 'coping', { id: 'coping', label: 'Coping style' }),
      { ...THINKING[1], id: 'decision_making', source: 'thinking.decisions' },
      lib('sleep', 'restoration', { id: 'rest', label: 'Rest & energy' }),
      lib('connection', 'support', { id: 'social_support', label: 'Social support' }),
    ],
    related: ['emotional', 'personality', 'thinking', 'lifestyle', 'coping', 'relationships'],
  },
];
