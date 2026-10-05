import assert from "node:assert/strict";

import { cachedDirectoryList } from "./directoryListCache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

async function run() {
  let now = 0;
  let calls = 0;
  let response = deferred<string[] | null>();
  const background: Promise<unknown>[] = [];
  const waitUntil = (task: Promise<unknown>) => background.push(task);
  const keys = cachedDirectoryList(
    () => {
      calls++;
      return response.promise;
    },
    { ttlMs: 100, now: () => now },
  );

  const cold = Array.from({ length: 60 }, () => keys(waitUntil));
  await Promise.resolve();
  assert.equal(calls, 1, "a cold burst shares one fetch");
  response.resolve(["krakow"]);
  const results = await Promise.all(cold);
  assert.ok(results.every((result) => result === results[0]));
  assert.deepEqual(await keys(waitUntil), new Set(["krakow"]));
  assert.equal(background.length, 0, "fresh lists need no background work");

  now = 100;
  response = deferred<string[] | null>();
  const stale = await Promise.all(Array.from({ length: 60 }, () => keys(waitUntil)));
  assert.equal(calls, 2, "an expired burst shares one background fetch");
  assert.ok(
    stale.every((result) => result?.has("krakow")),
    "stale callers do not wait",
  );
  assert.ok(background.every((task) => task === background[0]));
  now = 150;
  response.resolve(["warszawa"]);
  await Promise.all(background);
  assert.deepEqual(await keys(waitUntil), new Set(["warszawa"]));
  now = 249;
  await keys(waitUntil);
  assert.equal(calls, 2, "TTL starts when the refresh finishes");

  now = 250;
  background.length = 0;
  response = deferred<string[] | null>();
  assert.deepEqual(await keys(waitUntil), new Set(["warszawa"]));
  response.reject(new Error("API unavailable"));
  await Promise.all(background);
  assert.deepEqual(await keys(waitUntil), new Set(["warszawa"]), "failure preserves the list");
  await Promise.all(background);

  let retries = 0;
  const unavailable = cachedDirectoryList(async () => {
    if (++retries === 1) throw new Error("API unavailable");
    return ["krakow"];
  });
  assert.equal(await unavailable(waitUntil), null, "cold failure lets routing fail open");
  assert.deepEqual(await unavailable(waitUntil), new Set(["krakow"]), "failures allow retry");
  const nonOk = cachedDirectoryList(async () => null);
  assert.equal(await nonOk(waitUntil), null);

  console.log("directoryListCache.test.ts: ok");
}

void run();
