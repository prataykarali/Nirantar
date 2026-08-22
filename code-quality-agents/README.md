# Code Quality Agents

Skill library for NIRANTAR. Every quality pass starts with `CLAUDE.md` (Karpathy), then the specialist agent, then the eval scripts.

This folder is the library. The Grok skill that invokes it lives at `.grok/skills/code-quality-agents/SKILL.md`.

## Layout

```
code-quality-agents/
├── CLAUDE.md                 # Karpathy behavioral guidelines (load first)
├── README.md                 # this index
├── agents/                   # company quality / engineering agents
├── evals/                    # mechanical reviewers (Python)
└── rules/                    # MASTER_CODER + file governance
```

## Agents

| File | Role | Use when |
|------|------|----------|
| `agent1_architect_planner.md` | Architect / planner | structure, module boundaries, plans |
| `agent2_lead_developer.md` | Lead developer | implementation against MASTER_CODER |
| `agent3_ml_llm_specialist.md` | ML / LLM | prompts, models, token budget |
| `agent4_tester_qa.md` | Tester / QA | unit, integration, adversarial tests |
| `agent5_code_reviewer_security.md` | Code reviewer & security | 7-dimensional gate, secrets, nesting |
| `agent6_file_warden.md` | File warden | file size, modular splits, circular imports |
| `agent7_ui_designer.md` | UI designer | visual system, components |
| `agent8_ux_researcher.md` | UX researcher | journeys, accessibility |

Quality core for a "check everything" pass: **5 + 4 + 6**, with `CLAUDE.md` as the overlay.

## Eval scripts

From repo root:

```bash
python3 code-quality-agents/evals/code_quality_reviewer.py --source backend/
python3 code-quality-agents/evals/anti_hardcoding_auditor.py --dir .
python3 -m pytest tests/ -q
```

Makefile still points at `.company/evals/` (same scripts). Either path is valid.

## Invoke

- Slash: `/code-quality-agents`
- Ask: "run the code quality agents", "check modularity", "security review", "test everything"
