# CLAUDE.md — Karpathy behavioral guidelines

Source: Karpathy-style coding guidelines (shared into NIRANTAR).  
Load this **before** any code-quality agent writes or edits code.  
Tradeoff: these bias toward caution over speed. For trivial tasks, use judgment.

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Wrong:** silently assume export format, fields, file path, and scope.  
**Right:** list assumptions, offer the simplest option, ask.

**Wrong:** "make search faster" → add cache, indexes, and async in one shot.  
**Right:** ask whether they mean latency, throughput, or perceived UX.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Wrong:** Strategy pattern + Protocol + dataclass config for one discount percent.  
**Right:** `return amount * (percent / 100)` until a second type exists.

**Wrong:** cache, validator, merge flags, and notify hooks when asked to save prefs.  
**Right:** one UPDATE. Add the rest when needed.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

**Wrong:** while fixing empty-email crash, rewrite username validation, quotes, and docstrings.  
**Right:** only the empty-email guard.

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → write tests for invalid inputs, then make them pass
- "Fix the bug" → write a test that reproduces it, then make it pass
- "Refactor X" → ensure tests pass before and after

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**Wrong:** "I'll review and improve authentication."  
**Right:** "Test: password change invalidates old session → implement → suite still green."

---

## Anti-patterns

| Principle | Anti-pattern | Fix |
|-----------|--------------|-----|
| Think Before Coding | Silently assume format, fields, scope | List assumptions, ask |
| Simplicity First | Design pattern for a one-liner | One function until complexity is needed |
| Surgical Changes | Reformat quotes / add types while fixing a bug | Only change lines that fix the issue |
| Goal-Driven | "I'll review and improve the code" | Write test for X → make it pass → no regressions |

Good code solves today's problem simply, not tomorrow's problem prematurely.

---

## How NIRANTAR agents use this file

1. Read this file first.
2. Then load the specialist agent under `agents/` that matches the job.
3. Run `evals/` scripts for mechanical gates.
4. Do not expand scope past the user's request.
