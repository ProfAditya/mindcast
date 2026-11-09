// Descriptions for the server-scored validated screeners. Wording and scoring live on the server (neurix-api) and are not changed here.
export const VALIDATED = {
  phq9: {
    title: 'PHQ-9',
    name: 'Patient Health Questionnaire-9',
    about:
      'A widely used 9-question screener for symptoms of low mood and depression over the last two weeks.',
    higherIsBetter: false,
  },
  gad7: {
    title: 'GAD-7',
    name: 'Generalised Anxiety Disorder-7',
    about: 'A 7-question screener for symptoms of anxiety over the last two weeks.',
    higherIsBetter: false,
  },
  who5: {
    title: 'WHO-5',
    name: 'WHO-5 Wellbeing Index',
    about:
      'Five positively-worded questions about your wellbeing over the last two weeks. Higher scores mean better wellbeing.',
    higherIsBetter: true,
  },
} as const;
export type ValidatedCode = keyof typeof VALIDATED;
export const isValidated = (id: string): id is ValidatedCode => id in VALIDATED;
