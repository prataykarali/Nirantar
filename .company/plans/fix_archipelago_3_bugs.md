# Architecture Plan: Fix 3 Bugs in Archipelago

## Summary
Fix 3 critical bugs in the libraryAI/archipelago system: LLM replies cut mid-sentence, insufficient page links in replies, and paper cards failing to render.

**Status: IMPLEMENTED (2026-07-25)** — verified by `scripts/qa_three_bugs_harness.py` (39/39) and `tests/unit/test_three_bugs_fix.py`.

## Bug Analysis

### Bug 1: LLM Replies Cut Mid-Sentence
**Root Cause Chain:**
1. `stream_budget.py`: `num_predict = max(MIN_NUM_PREDICT, free)` requested *more* tokens than free KV when the prompt was large → Ollama `done_reason="length"` mid-word
2. `CHARS_PER_TOKEN_ESTIMATE = 4` over-counted prompt tokens (~16%), starving completion room
3. `CTX_SAFETY_TOKENS = 128` left too little slack for chat-template wrapper tokens
4. Boundary trim existed but budget math made hits to the length cap common

**Fix applied:**
- `CHARS_PER_TOKEN_SCALE = 4.5` for prompt estimates
- `CTX_SAFETY_TOKENS = 192`
- `num_predict = max(1, free)` — never exceeds free context
- `STUDY_RESERVE_TOKENS = 960` (already in place)
- `_finalize_stream_answer` always calls `trim_to_completion_boundary`

### Bug 2: Insufficient Page Links (Restricted to 2-3)
**Root Cause Chain:**
1. Prompt asked for only 2–6 / at most 8 markers → model under-cited
2. `cleanse_model_citations` dropped markers unless the *enclosing paragraph* named the topic
3. Fallout attachment only ran when `seen_inline == 0`, so sparse 1–2 link answers never topped up

**Fix applied:**
- Prompt budget: 5–10 markers (`reply_styles` + stream system prompt)
- Permissive grounding: paragraph **or** full-answer topic match
- Top-up when `seen_inline < 5` from remaining distinct page payloads
- `_MAX_INLINE_PAGE_LINKS = 35`, ensure threshold 20, compact sources max 10

### Bug 3: Paper Cards Half the Time Don't Appear
**Root Cause Chain:**
1. `appendEvidenceRail` early-returned if `.evidence-rail` existed
2. `typewriter.flush()` → `renderMarkdownSafely` sets `innerHTML` → **wipes** the rail
3. Second `finalizeStreamedBubble` no-op'd on `bubbleFinalized` → cards gone ~50% of streams
4. `citation_payload` left `page_number=None` → UI `citationPageUrl` returned `''`

**Fix applied:**
- Always remove + re-mount evidence rail after markdown paint
- Idempotent finalize; terminal `done` path re-appends cards
- `paintAssistant` re-attaches when `bubbleFinalized`
- Payload normalizes `page_number >= 1`, adds `title` / `page_url`

## File Changes (done)

### 1. `archipelago/inference/stream_budget.py`
- [x] Honourable `num_predict` (`max(1, free)`)
- [x] `CHARS_PER_TOKEN_SCALE = 4.5`
- [x] `CTX_SAFETY_TOKENS = 192`
- [x] `STUDY_RESERVE_TOKENS = 960`

### 2. `archipelago/inference/synthesis.py`
- [x] Citation ask 5–10 / S1..S10
- [x] `_compact_source_links` default max 10
- [x] Trim on all finalize paths (pre-existing + retained)

### 3. `archipelago/inference/citations.py`
- [x] Permissive cleanse + min useful link top-up (5)
- [x] Spawnable payload (`page_number`, `title`, `page_url`)

### 4. `archipelago/inference/reply_styles.py`
- [x] `_MIN_INLINE_CITATIONS_REQUESTED = 5`
- [x] `_MAX_INLINE_CITATIONS_REQUESTED = 10`

### 5. `ui/chat/index.html`
- [x] Evidence rail remount race fixed
- [x] `citationPageUrl` defaults page to 1

### 6. QA
- [x] `tests/unit/test_three_bugs_fix.py`
- [x] `scripts/qa_three_bugs_harness.py` (3-round agent loop)
- [x] Related unit suite green (65 tests)

## Verification commands

```bash
cd /home/pratay-karali/Desktop/libraryAI/libraryAI
source .venv/bin/activate
python scripts/qa_three_bugs_harness.py --verbose
python -m pytest tests/unit/test_three_bugs_fix.py tests/unit/test_citations.py \
  tests/unit/test_reply_styles.py tests/unit/test_streaming_synthesis_grounding.py -q
```

## Followup Steps
- [ ] Restart services: `./scripts/ops/serve.sh restart`
- [ ] Manual smoke: one study query, confirm full sentence end + ≥5 page chips + Resources rail
- [x] Run LLM output quality / harness evaluation
