import { test } from "node:test";
import assert from "node:assert/strict";
import { askPhil, type PhilDeps } from "../lib/phil-chat";

const REFUSAL = "That question is outside what this assistant covers.";
function fakeLumen(replies: string[]) {
  const sent: string[] = [];
  const deps: PhilDeps = {
    openSession: async () => "session-1",
    send: async (_id, message) => { sent.push(message); return replies.shift() ?? REFUSAL; },
    fallback: async () => ({ answer: "Nasa SSS ID mo o sa My.SSS account.", source: "Gemini" }),
  };
  return { deps, sent };
}

test("a Lumen answer reaches the user and the session is kept", async () => {
  const { deps } = fakeLumen(["Makikita mo sa SSS ID mo."]);
  const reply = await askPhil({ message: "Where can I see my SSS number?" }, deps);
  assert.deepEqual(reply, { answer: "Makikita mo sa SSS ID mo.", source: "Lumen AI", sessionId: "session-1" });
});

test("a Lumen scope refusal is never shown; Phil answers from the fallback", async () => {
  const { deps } = fakeLumen([REFUSAL]);
  const reply = await askPhil({ message: "Where can I see my SSS number?" }, deps);
  assert.equal(reply.answer, "Nasa SSS ID mo o sa My.SSS account.");
  assert.equal(reply.source, "Gemini");
  assert.equal(reply.sessionId, "session-1");
});

test("follow-up questions still tell Lumen who Phil is", async () => {
  const { deps, sent } = fakeLumen(["Sagot."]);
  await askPhil({ message: "Ano ang TIN?", sessionId: "session-1" }, deps);
  assert.match(sent[0], /You are Phil/);
  assert.match(sent[0], /Ano ang TIN\?$/);
});
