const Redis = require('ioredis');
const { fromEvent, scan, bufferTime, map, from, filter } = require('rxjs');
const { persist } = require('./db');

const redis = new Redis();
const CHANNEL = 'chn';

async function main() {
  await redis.subscribe(CHANNEL);

  // create an observable from "message" events
  const messages = fromEvent(redis, 'message').pipe(
    map(([_, message]) => message), // "pluck" message part of the tuple
    filter((msg) => !!msg), // filter out the truthy values
  );

  messages.pipe(scan((count) => count + 1, 0)).subscribe((count) => console.log(`Received ${count} messages`));

  // creates a buffered observable from messages with an interval of 3 seconds, 3 messages max
  const buffered = messages.pipe(bufferTime(3000, undefined, 3));
  buffered.subscribe((msgs) => console.log('Buffered:', msgs));

  // creates promises from each batch
  const promises = buffered.pipe(map((msgs) => Promise.allSettled(msgs.map(persist))));

  // at the end, consume the promises to trigger the event loop
  promises.subscribe(async (promise) => {
    const results = await promise;
    console.dir({ results }, { depth: null });
    /**
     * It'll look like something like this:
     * {
     *   results: [
     *     { status: 'fulfilled', value: { msg: 'test', ok: true } },
     *     { status: 'fulfilled', value: { msg: 'test', ok: true } }
     *   ]
     * }
     */
  });
}

main();
