---
name: code-quality-agents
description: >
  Run NIRANTAR's code-quality agent library: Karpathy CLAUDE.md guidelines,
  company quality agents (reviewer, QA, file warden, architect, security),
  and mechanical evals. Use when the user asks to check code quality,
  review, modularity, file size, security, test everything, run company
  agents, Architecting Excellence, or runs /code-quality-agents.
---

# Code Quality Agents

Library root: `code-quality-agents/` in the NIRANTAR repo.

## Always load first

Read `code-quality-agents/CLAUDE.md` and follow it for the whole run:

1. Think before coding — state assumptions, don't pick silently.
2. Simplicity first — no speculative abstractions.
3. Surgical changes — only lines that serve the request.
4. Goal-driven — verifiable checks, loop until they pass.

## Quality pass (default when asked to "check everything")

State the plan, then execute:

1. **Karpathy overlay** → verify: you named assumptions and success checks.
2. **Agent 5** `code-quality-agents/agents/agent5_code_reviewer_security.md`
   → run `python3 code-quality-agents/evals/code_quality_reviewer.py --source <touched>`
   → verify: no must-severity security/nesting issues in touched files.
3. **Agent 6** `code-quality-agents/agents/agent6_file_warden.md`
   → verify: touched files stay modular; report any file over 500 lines (do not auto-split unless asked).
4. **Agent 4** `code-quality-agents/agents/agent4_tester_qa.md`
   → run `python3 -m pytest tests/ -q`
   → verify: suite green, or list failing tests with the actual error.
5. **Hardcoding audit** → `python3 code-quality-agents/evals/anti_hardcoding_auditor.py --dir .`
   → verify: no new hardcoded secrets.

Also run Makefile targets when they fit: `make test`, `make review`, `make audit`.

## Other agents (only if the request needs them)

| Ask | Agent file |
|-----|------------|
| architecture / module map | `agents/agent1_architect_planner.md` |
| implement / MASTER_CODER | `agents/agent2_lead_developer.md` |
| LLM / prompts / models | `agents/agent3_ml_llm_specialist.md` |
| UI visuals | `agents/agent7_ui_designer.md` |
| citizen journey / a11y | `agents/agent8_ux_researcher.md` |

Rules live in `code-quality-agents/rules/`.

## Report format

When done, report:

- What was run (agents + commands)
- Pass / fail per gate
- Findings with file paths (must / issue / suggestion)
- Tests: collected count and failures
- What you did **not** change (surgical)

Do not implement unrelated refactors. Do not expand into Module 5+ unless asked.
