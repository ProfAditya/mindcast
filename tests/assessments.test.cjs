// Unit tests for the exploratory assessment engine. Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MODULES,
  LENGTHS,
  formFor,
  itemScore,
  needsFollowUp,
  scoreExploratory,
} = require('../.test-build/lib/assessments/engine.js');

test('there are 7 modules with unique ids and versions', () => {
  assert.equal(MODULES.length, 7);
  assert.equal(new Set(MODULES.map((m) => m.id)).size, 7);
  for (const m of MODULES) assert.match(m.version, /^\d+\.\d+\.\d+$/);
});

test('each module offers its configured lengths, and each form has exactly that many questions', () => {
  for (const m of MODULES) {
    assert.ok(m.lengths.length >= 1);
    for (const n of m.lengths) assert.ok(LENGTHS.includes(n), `${m.id} length ${n}`);
    for (const n of LENGTHS) assert.equal(formFor(m, n).length, n, `${m.id} ${n}`);
  }
});

test('the seven requested categories exist; comprehensive is 50 questions only', () => {
  assert.deepEqual(
    MODULES.map((m) => m.id),
    [
      'emotional',
      'personality',
      'thinking',
      'lifestyle',
      'coping',
      'relationships',
      'comprehensive',
    ]
  );
  assert.deepEqual(MODULES.find((m) => m.id === 'comprehensive').lengths, [50]);
  assert.ok(MODULES.find((m) => m.id === 'relationships').sensitive);
});

test('tendency domains have two poles and never feed the overall score', () => {
  const p = MODULES.find((m) => m.id === 'personality');
  assert.ok(p.domains.every((d) => d.kind === 'tendency' && d.poles && d.poles.length === 2));
  const answers = Object.fromEntries(
    formFor(p, 40)
      .filter((q) => q.scored && q.format !== 'multi')
      .map((q) => [q.id, q.options[0].value])
  );
  const r = scoreExploratory(p, 40, answers);
  assert.equal(r.overall, null);
  assert.deepEqual(r.strengths, []);
  assert.deepEqual(r.explore, []);
  assert.ok(
    r.domains.every((d) => ['lower', 'balanced', 'higher', 'insufficient'].includes(d.band))
  );
});

test('situational answers are listed with the chosen response', () => {
  const m = MODULES.find((x) => x.id === 'coping');
  const sc = formFor(m, 40).filter((q) => q.format === 'scenario');
  assert.ok(sc.length >= 1);
  const r = scoreExploratory(m, 40, Object.fromEntries(sc.map((q) => [q.id, q.options[0].value])));
  assert.equal(r.situational.length, sc.length);
  assert.equal(r.situational[0].answer, sc[0].options[0].label);
  assert.ok(r.situationalSummary);
});

test('domains drawn from the library keep a suggestion source', () => {
  for (const m of MODULES)
    for (const d of m.domains) assert.match(d.source, /^[a-z_]+\.[a-z_]+$/, `${m.id}.${d.id}`);
});

test('question ids are unique and every choice option has a 0–1 score', () => {
  const ids = new Set();
  for (const m of MODULES)
    for (const q of m.questions) {
      assert.ok(!ids.has(q.id), `duplicate ${q.id}`);
      ids.add(q.id);
      assert.ok(q.text.length > 5, q.id);
      if (q.format !== 'text') {
        assert.ok(q.options.length >= 2, `${q.id} options`);
        for (const o of q.options)
          assert.ok(
            Number.isFinite(o.score) && o.score >= 0 && o.score <= 1,
            `${q.id} ${o.label} = ${o.score}`
          );
      }
    }
});

test('every domain has at least 4 scored items in the 30-question form', () => {
  for (const m of MODULES)
    for (const d of m.domains) {
      const n = formFor(m, 30).filter((q) => q.domain === d.id && q.scored).length;
      assert.ok(n >= 4, `${m.id}.${d.id} has ${n}`);
    }
});

test('reverse-scored items flip the scale', () => {
  const q = MODULES.flatMap((m) => m.questions).find((x) => x.reverse && x.format === 'likert5');
  assert.equal(itemScore(q, '4'), 0);
  assert.equal(itemScore(q, '0'), 1);
});

test('multi-choice scores are summed and capped at 1; unanswered items are null', () => {
  const q = MODULES.flatMap((m) => m.questions).find((x) => x.format === 'multi');
  assert.equal(itemScore(q, []), null);
  assert.ok(
    itemScore(
      q,
      q.options.map((o) => o.value)
    ) <= 1
  );
  assert.equal(itemScore(q, undefined), null);
});

test('all-favourable answers score 100; all-unfavourable land in the lowest band', () => {
  for (const m of MODULES.filter((x) => x.domains.every((d) => d.kind === 'wellbeing'))) {
    const best = {},
      worst = {};
    for (const q of formFor(m, 50)) {
      if (q.format === 'text') continue;
      const ranked = [...q.options]
        .map((o) => ({ o, s: itemScore(q, q.format === 'multi' ? [o.value] : o.value) }))
        .sort((a, b) => b.s - a.s);
      if (q.format === 'multi') {
        best[q.id] = q.options.filter((o) => o.score > 0).map((o) => o.value);
        worst[q.id] = [ranked.at(-1).o.value];
      } else {
        best[q.id] = ranked[0].o.value;
        worst[q.id] = ranked.at(-1).o.value;
      }
    }
    const hi = scoreExploratory(m, 50, best),
      lo = scoreExploratory(m, 50, worst);
    assert.equal(hi.overall, 100, `${m.id} best`);
    // Some items have a non-zero floor (e.g. "Under 6 hours" = 0.2), so the minimum is near, not exactly, 0.
    assert.ok(lo.overall <= 10, `${m.id} worst = ${lo.overall}`);
    assert.ok(hi.domains.every((d) => d.band === 'strength'));
    assert.ok(lo.domains.every((d) => d.band === 'explore'));
  }
});

test('scoring is deterministic for the same answers', () => {
  const m = MODULES[0];
  const answers = Object.fromEntries(
    formFor(m, 40)
      .filter((q) => q.format !== 'text' && q.format !== 'multi')
      .map((q, i) => [q.id, q.options[i % q.options.length].value])
  );
  assert.deepEqual(scoreExploratory(m, 40, answers), scoreExploratory(m, 40, answers));
});

test('a domain with fewer than half its items answered is reported as insufficient', () => {
  const m = MODULES[1];
  const r = scoreExploratory(m, 30, {});
  assert.equal(r.domains.length, 5);
  assert.equal(r.overall, null);
  assert.ok(r.domains.every((d) => d.score === null && d.band === 'insufficient'));
});

test('follow-ups appear only for unfavourable answers', () => {
  const q = MODULES.flatMap((m) => m.questions).find(
    (x) => x.followUp && x.format === 'frequency' && x.reverse
  );
  assert.equal(needsFollowUp(q, '4'), true); // "Always" on a reverse item
  assert.equal(needsFollowUp(q, '0'), false);
});

test('results always carry non-diagnostic limitations and a scoring explanation', () => {
  const r = scoreExploratory(MODULES[2], 30, {});
  assert.ok(r.limitations.some((l) => /not a diagnosis/i.test(l)));
  assert.ok(r.limitations.some((l) => /not been clinically validated/i.test(l)));
  assert.match(r.scoring, /v\d+\.\d+\.\d+/);
});
