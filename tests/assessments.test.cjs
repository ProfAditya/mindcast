// Unit tests for the exploratory assessment engine. Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { MODULES, LENGTHS, formFor, itemScore, needsFollowUp, scoreExploratory } = require('../.test-build/lib/assessments/engine.js');

test('there are 7 modules with unique ids and versions', () => {
  assert.equal(MODULES.length, 7);
  assert.equal(new Set(MODULES.map((m) => m.id)).size, 7);
  for (const m of MODULES) assert.match(m.version, /^\d+\.\d+\.\d+$/);
});

test('each module offers exactly 30, 40 and 50 question forms', () => {
  for (const m of MODULES) for (const n of LENGTHS) assert.equal(formFor(m, n).length, n, `${m.id} ${n}`);
});

test('question ids are unique and every choice option has a 0–1 score', () => {
  const ids = new Set();
  for (const m of MODULES) for (const q of m.questions) {
    assert.ok(!ids.has(q.id), `duplicate ${q.id}`);
    ids.add(q.id);
    assert.ok(q.text.length > 5, q.id);
    if (q.format !== 'text') {
      assert.ok(q.options.length >= 2, `${q.id} options`);
      for (const o of q.options) assert.ok(Number.isFinite(o.score) && o.score >= 0 && o.score <= 1, `${q.id} ${o.label} = ${o.score}`);
    }
  }
});

test('every domain has at least 4 scored items in the 30-question form', () => {
  for (const m of MODULES) for (const d of m.domains) {
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
  assert.ok(itemScore(q, q.options.map((o) => o.value)) <= 1);
  assert.equal(itemScore(q, undefined), null);
});

test('all-favourable answers score 100; all-unfavourable land in the lowest band', () => {
  for (const m of MODULES) {
    const best = {}, worst = {};
    for (const q of formFor(m, 50)) {
      if (q.format === 'text') continue;
      const ranked = [...q.options].map((o) => ({ o, s: itemScore(q, q.format === 'multi' ? [o.value] : o.value) })).sort((a, b) => b.s - a.s);
      if (q.format === 'multi') { best[q.id] = q.options.filter((o) => o.score > 0).map((o) => o.value); worst[q.id] = [ranked.at(-1).o.value]; }
      else { best[q.id] = ranked[0].o.value; worst[q.id] = ranked.at(-1).o.value; }
    }
    const hi = scoreExploratory(m, 50, best), lo = scoreExploratory(m, 50, worst);
    assert.equal(hi.overall, 100, `${m.id} best`);
    // Some items have a non-zero floor (e.g. "Under 6 hours" = 0.2), so the minimum is near, not exactly, 0.
    assert.ok(lo.overall <= 10, `${m.id} worst = ${lo.overall}`);
    assert.ok(hi.domains.every((d) => d.band === 'strength'));
    assert.ok(lo.domains.every((d) => d.band === 'explore'));
  }
});

test('scoring is deterministic for the same answers', () => {
  const m = MODULES[0];
  const answers = Object.fromEntries(formFor(m, 40).filter((q) => q.format !== 'text' && q.format !== 'multi').map((q, i) => [q.id, q.options[i % q.options.length].value]));
  assert.deepEqual(scoreExploratory(m, 40, answers), scoreExploratory(m, 40, answers));
});

test('a domain with fewer than half its items answered is reported as insufficient', () => {
  const m = MODULES[1];
  const r = scoreExploratory(m, 30, {});
  assert.equal(r.overall, null);
  assert.ok(r.domains.every((d) => d.score === null && d.band === 'insufficient'));
});

test('follow-ups appear only for unfavourable answers', () => {
  const q = MODULES.flatMap((m) => m.questions).find((x) => x.followUp && x.format === 'frequency' && x.reverse);
  assert.equal(needsFollowUp(q, '4'), true);  // "Always" on a reverse item
  assert.equal(needsFollowUp(q, '0'), false);
});

test('results always carry non-diagnostic limitations and a scoring explanation', () => {
  const r = scoreExploratory(MODULES[2], 30, {});
  assert.ok(r.limitations.some((l) => /not a diagnosis/i.test(l)));
  assert.ok(r.limitations.some((l) => /not been clinically validated/i.test(l)));
  assert.match(r.scoring, /v\d+\.\d+\.\d+/);
});
