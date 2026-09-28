import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { remainingQuestions, weekProgress } from '../nafes/src/progress.js';

const ids = [1, 2, 3, 4].map(n => String(n).padStart(24, '0'));
const questions = ids.map((id, i) => ({ _id: id, indicator_id: i < 3 ? 'week1-indicator' : 'week2-indicator' }));
const week = { indicators: [{ question_ids: ids.slice(0, 3) }] };

test('nonsequential answers resume at the first unanswered question, scoped to the week', () => {
  const answered = [ids[2], ids[0], ids[2], ids[3]];
  assert.deepEqual(remainingQuestions(questions.slice(0, 3), answered), [questions[1]]);
  assert.deepEqual(weekProgress(week, answered), {
    answeredQuestionIds: [ids[0], ids[2]], answeredCount: 2, totalCount: 3, isComplete: false,
  });
  assert.deepEqual(remainingQuestions(questions, ids), []);
  assert.equal(weekProgress(week, ids).isComplete, true);
  assert.equal(weekProgress({ indicators: [] }, []).isComplete, false);
});

// Exercise both real route implementations with an isolated model double: no production DB writes.
for (const file of ['./server.js', '../nafes/server/index.js']) {
  test(`${file}: saved IDs survive new requests, stay account-specific, and reject invalid questions`, async () => {
    const routes = new Map();
    const rows = [];
    const app = { use() {}, listen() {} };
    for (const method of ['get', 'post', 'delete']) {
      app[method] = (path, ...handlers) => routes.set(`${method} ${path}`, handlers.at(-1));
    }
    const express = Object.assign(() => app, { json: () => () => {} });
    const source = readFileSync(new URL(file, import.meta.url), 'utf8').replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    vm.runInNewContext(source, {
      express, createHash, cors: () => () => {}, dotenv: { config() {} },
      process: { env: {} }, console, connectAndInitDb() {},
      Question: { find: filter => ({ lean: async () => filter._id ? questions.filter(q => filter._id.$in.includes(q._id)) : questions }) },
      UserSolvedQuestion: {
        async distinct(field, filter) { return [...new Set(rows.filter(r => r.user_id === filter.user_id).map(r => r[field]))]; },
        async updateOne(filter, update) {
          if (!rows.some(r => r.user_id === filter.user_id && r.question_id === filter.question_id)) rows.push(update.$setOnInsert);
        },
      },
    });
    async function request(method, userId, body = {}) {
      let status = 200;
      let data;
      const res = { status(code) { status = code; return this; }, json(value) { data = value; } };
      await routes.get(`${method} /api/indicators/solved`)({ user: { id: userId }, body }, res);
      return { status, data: JSON.parse(JSON.stringify(data)) };
    }
    assert.equal((await request('post', 'student-a', { question_ids: [ids[2], ids[0], ids[2]] })).status, 200);
    await request('post', 'student-a', { question_ids: [ids[0]] });
    assert.equal(rows.length, 2);
    const loaded = (await request('get', 'student-a')).data;
    assert.equal(loaded.solvedQuestionIds.length, 2);
    assert.deepEqual(loaded.solvedIndicatorIds, []);
    assert.deepEqual(remainingQuestions(questions.slice(0, 3), loaded.solvedQuestionIds), [questions[1]]);
    assert.deepEqual((await request('get', 'student-b')).data.solvedQuestionIds, []);
    assert.equal((await request('post', 'student-a', { question_ids: ['bad-id'] })).status, 400);
    assert.equal((await request('post', 'student-a', { question_ids: ['f'.repeat(24)] })).status, 400);
    await request('post', 'student-a', { question_ids: [ids[1]] });
    const complete = (await request('get', 'student-a')).data;
    assert.deepEqual(complete.solvedIndicatorIds, ['week1-indicator']);
    assert.equal(weekProgress(week, complete.solvedQuestionIds).isComplete, true);
    assert.deepEqual(remainingQuestions(questions.slice(0, 3), complete.solvedQuestionIds), []);
  });
}
