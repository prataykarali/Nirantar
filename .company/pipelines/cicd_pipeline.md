# CI/CD Pipeline Architecture

## Overview

The AI Agent Company operates on a strict **9-Stage CI/CD Pipeline** that transforms a client request into production-ready, governance-compliant code with design quality gates. Every stage has clear entry criteria, exit criteria, and an assigned agent.

## Pipeline Flow

```
Client Request
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 1: Requirements Analysis (CEO)                        │
│ - Parse client request into structured requirements         │
│ - Estimate token/quota budget for the session               │
│ - Route to appropriate agents                               │
│ Output: requirements.md, session_budget.md                  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 2: Architecture & Planning (Agent 1 - Architect)      │
│ - Decompose into tasks with time estimates                  │
│ - Map dependencies via Obsidian mind-map                    │
│ - Design file structure (respecting 300-500 line limits)    │
│ - Sync architecture plan to Obsidian vault                  │
│ Output: plan.md, architecture.md, obsidian_mindmap.md       │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 2.5: Design Generation (Agent 7 + Agent 8)            │
│ - Agent 7: Design tokens, component specs, Tailwind config  │
│ - Agent 8: User journey maps, WCAG compliance, state specs  │
│ - Create design_handoff_spec.md for Agent 2 consumption     │
│ Output: design_handoff_spec.md, ux_audit_spec.md            │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 3: Implementation (Agent 2 - Lead Developer)          │
│ - Consume design_handoff_spec.md for frontend code          │
│ - Apply Headroom/Ponytail for token-efficient context       │
│ - Run Gratify for structural linting after writing          │
│ - Write code per MASTER_CODER standards                     │
│ - Self-review before handoff                                │
│ Output: source code files, gratify_report.json              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 4: ML/LLM Optimization (Agent 3 - ML Specialist)      │
│ - Optimize prompts and token budgets using Headroom         │
│ - Run Ponytail for context window compression               │
│ - Validate LLM outputs with distribution checks             │
│ Output: prompt files, token config, headroom_report.json    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 5: Testing (Agent 4 - QA Engineer)                    │
│ - Unit tests, integration tests, adversarial tests          │
│ - LLM output quality checks                                 │
│ - Visual regression tests via visual_regression_check.py    │
│ Output: test files, test_report.md                          │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 5.5: Visual QA & UX Audit (Agent 7 + Agent 8)        │
│ - Agent 7: Verify visual regression, token compliance,      │
│   responsive breakpoints, component states                  │
│ - Agent 8: Verify WCAG AA/AAA, state coverage, journey      │
│   completion, accessibility attributes                      │
│ Output: visual_regression_report.md, ux_audit_report.md     │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 6: Code Review & Security (Agent 5 - Reviewer)        │
│ - 5-Pass Review Gate with automated PR tooling              │
│ - CodeRabbit PR summarization & inline review               │
│ - OctoReview automated inline comments                      │
│ - GitStream merge gate checks                               │
│ - Banned pattern scan                                       │
│ Output: review_report.md, pr_automation_report.md           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 7: Governance Audit (Agent 6 - File Warden)           │
│ - File size enforcement (300-500 lines)                     │
│ - Gratify structural linting pass                           │
│ - Headroom token bloat audit                                │
│ - Directory structure audit                                 │
│ - Auto-split bloated files                                  │
│ Output: governance_report.md, token_audit.json              │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Quality Gate Check (CEO)                                     │
│ - All 9 stages complete?                                     │
│ - All reports PASS?                                          │
│ - Token/quota within budget?                                 │
│ - Any blocking issues?                                       │
│ Decision: DEPLOY or ITERATE                                  │
└─────────────────────────────────────────────────────────────┘
     │
     ├── DEPLOY ──► Production Release (via PR merge)
     │
     └── ITERATE ──► Stage 2 (with feedback)
```

## Stage Details

### Stage 1: Requirements Analysis
**Owner:** CEO (main LLM)
**Entry:** Client request received
**Exit:** `requirements.md`, `session_budget.md`

```markdown
Requirements checks:
- [ ] Requirements are unambiguous and testable
- [ ] Success criteria defined
- [ ] Token/quota budget estimated
- [ ] Constraints documented
- [ ] UX requirements captured (if frontend)
- [ ] Security considerations noted
```

### Stage 2: Architecture & Planning
**Owner:** Agent 1 (Architect)
**Entry:** `requirements.md` exists
**Exit:** `plan.md`, `architecture.md`, `obsidian_mindmap.md`

```markdown
Architecture checks:
- [ ] Tasks are granular and independent
- [ ] Time estimates per task documented
- [ ] No single file will exceed 500 lines
- [ ] Dependencies are mapped and versioned
- [ ] Interfaces are defined
- [ ] Obsidian mind-map synced
- [ ] Design agents tagged if frontend work involved
```

### Stage 2.5: Design Generation
**Owner:** Agent 7 (UI Designer) + Agent 8 (UX Researcher)
**Entry:** `plan.md`, `architecture.md` approved, frontend flag set
**Exit:** `design_handoff_spec.md`, `ux_audit_spec.md`

```markdown
Design checks:
- [ ] Design tokens defined (colors, typography, spacing, breakpoints)
- [ ] Component specs with all states (default, hover, active, disabled, focus, loading, error, empty)
- [ ] Tailwind/Responsive breakpoints documented
- [ ] User journey maps created
- [ ] WCAG AA/AAA targets identified
- [ ] Micro-interaction timing and easing curves specified
- [ ] Handoff spec ready for Agent 2 consumption
```

### Stage 3: Implementation
**Owner:** Agent 2 (Lead Developer)
**Entry:** `plan.md`, `architecture.md`, `design_handoff_spec.md` approved
**Exit:** Source code files, `gratify_report.json`

```markdown
Implementation checks:
- [ ] Code follows MASTER_CODER standards
- [ ] Design tokens implemented correctly (colors, spacing, typography)
- [ ] All component states rendered (loading, empty, error, success)
- [ ] Headroom/Ponytail token optimization applied
- [ ] Gratify linting passed
- [ ] Responsive breakpoints respected
- [ ] All edge cases handled
- [ ] Error handling complete
- [ ] No TODOs or stubs
- [ ] Self-review completed
```

### Stage 4: ML/LLM Optimization
**Owner:** Agent 3 (ML Specialist)
**Entry:** Source code with prompts exists
**Exit:** Optimized prompts, token config, `headroom_report.json`

```markdown
ML optimization checks:
- [ ] Token budgets calculated correctly via Headroom audit
- [ ] Context windows optimized via Ponytail compression
- [ ] Fallback strategies in place
- [ ] Output validation implemented
- [ ] Model selection justified
- [ ] Prompt versioning in place
```

### Stage 5: Testing
**Owner:** Agent 4 (QA Engineer)
**Entry:** Source code exists
**Exit:** Test files, `test_report.md`

```markdown
Testing checks:
- [ ] Unit tests cover ≥ 90% of code
- [ ] Integration tests cover all endpoints
- [ ] Adversarial tests pass
- [ ] LLM output quality checks pass
- [ ] Visual regression tests pass (if UI)
- [ ] No regressions introduced
```

### Stage 5.5: Visual QA & UX Audit
**Owner:** Agent 7 (UI Designer) + Agent 8 (UX Researcher)
**Entry:** Source code + tests exist, visual regression tests passed
**Exit:** `visual_regression_report.md`, `ux_audit_report.md`

```markdown
Visual QA checks:
- [ ] Design tokens match spec (colors, spacing, typography)
- [ ] All component states visually verified
- [ ] Responsive breakpoints render correctly
- [ ] No layout shifts or overflow issues
- [ ] Micro-interactions match timing specs

UX Audit checks:
- [ ] WCAG AA compliance verified (minimum)
- [ ] Color contrast ratios meet WCAG thresholds
- [ ] aria-labels and accessibility attributes present
- [ ] Loading, empty, error, and success states all exist
- [ ] User journey complete — no dead ends
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified
```

### Stage 6: Code Review & Quality Architecture (Architecting Excellence)
**Owner:** Agent 5 (Code Reviewer & Quality Architect)
**Entry:** Source code + tests + design/UX reports exist
**Exit:** `review_report.md`, `pr_automation_report.md`

```markdown
Architecting Excellence checks:
- [ ] DIMENSION 1: Security & Data Integrity — zero secrets/injections
- [ ] DIMENSION 2: Correctness & Semantic Robustness — edge cases & contracts
- [ ] DIMENSION 3: Tactical Aesthetics — Never Nester (depth ≤ 3), Guard clauses, Cognitive Complexity < 8
- [ ] DIMENSION 4: Abstraction Prudence — AHA Principle, WET Rule of Three, variable pruning
- [ ] DIMENSION 5: Performance Efficiency — zero N+1 queries, async non-blocking
- [ ] DIMENSION 6: Validation Fidelity — Testing Trophy (integration core), mutation/property tests
- [ ] DIMENSION 7: Socio-Technical & Small CLs — Conventional Comments, Google Review Standard
- [ ] Automated Quality Audit: `evals/code_quality_reviewer.py` passed
- [ ] CodeRabbit PR summary generated & OctoReview inline comments reviewed
- [ ] GitStream merge gate passed
```

### Stage 7: Governance Audit
**Owner:** Agent 6 (File Warden)
**Entry:** All files written
**Exit:** `governance_report.md`, `token_audit.json`

```markdown
Governance checks:
- [ ] No file exceeds 500 lines
- [ ] All files meet minimum line count (≥ 10)
- [ ] Directory structure is logical
- [ ] No banned directory names
- [ ] No circular imports
- [ ] No orphaned modules
- [ ] Gratify lint pass — no style violations
- [ ] Headroom token audit — no bloat
- [ ] No duplicate code across files
```

## Quality Gate Decision Matrix

| Stage Results | Decision | Action |
|---------------|----------|--------|
| All 9 stages PASS | ✅ DEPLOY | Create PR with automated review, merge to production |
| Stages 1-5.5 PASS, 6-7 FAIL | 🔄 ITERATE | Fix review/governance issues, re-run stages 5-7 |
| Stages 1-3 PASS, 4-5.5 FAIL | 🔄 ITERATE | Fix ML/testing/design issues, re-run stages 3-5.5 |
| Stage 1-2 FAIL | 🔄 RE-PLAN | Revise requirements/architecture, restart from stage 1 |
| Stage 2.5 (Design) FAIL | 🔄 RE-DESIGN | Agent 7 + Agent 8 revise specs, restart from stage 2.5 |
| Stage 6 (Security) CRITICAL FAIL | 🚨 ESCALATE | Immediate CEO attention, block all progress |
| Stage 5.5 (UX) FAIL | 🔄 RE-DESIGN | Agent 8 revises UX, Agent 2 re-implements, re-run stages 3-5.5 |

## Tooling Integration Points

### Obsidian (Agent 1 - Architect)
```bash
# Sync architecture plan to Obsidian vault
obsidian sync ./src/ --vault=./.obsidian/ --prefix=arch/

# Generate mind-map from dependency graph
obsidian mindmap --input=./.company/plans/architecture.md --output=./.obsidian/mindmaps/
```

### Headroom & Ponytail (Agent 2, 3)
```bash
# Before context window creation — compress with Ponytail
ponytail compress ./context/ --target-tokens=2048 --preserve-core-semantics

# After code generation — audit token usage with Headroom
headroom audit ./src/ --warn-threshold=1.2 --output=./.company/audits/token-audit.json
```

### Gratify (Agent 2, 6)
```bash
# After implementation — structural lint check
gratify check ./src/ --max-lines=500 --no-todos --no-debug-prints

# During governance — final compliance pass
gratify lint ./src/ --rules=./.gratify.yaml --output=./.company/audits/lint-report.json
```

### CodeRabbit, OctoReview, GitStream (Agent 5)
```bash
# Automated PR pipeline
coderabbit summarize --pr=$PR_NUMBER
octoreview run --repo=. --pr=$PR_NUMBER
gitstream check --pr=$PR_NUMBER
```

## Pipeline Automation Script

```bash
#!/bin/bash
# pipeline.sh — Execute the 9-stage CI/CD pipeline for a feature

FEATURE_NAME=$1
STAGE=${2:-1}

echo "🏢 AI Agent Company — 9-Stage CI/CD Pipeline"
echo "Feature: $FEATURE_NAME"
echo "Starting from Stage: $STAGE"
echo ""

case $STAGE in
    1)  echo "Stage 1:  Requirements Analysis        — CEO" ;;
    2)  echo "Stage 2:  Architecture & Planning      — Agent 1 (Architect)" ;;
    2.5)echo "Stage 2.5: Design Generation            — Agent 7 (UI) + Agent 8 (UX)" ;;
    3)  echo "Stage 3:  Implementation               — Agent 2 (Lead Developer)" ;;
    4)  echo "Stage 4:  ML/LLM Optimization           — Agent 3 (ML Specialist)" ;;
    5)  echo "Stage 5:  Testing                       — Agent 4 (QA)" ;;
    5.5)echo "Stage 5.5: Visual QA & UX Audit         — Agent 7 (UI) + Agent 8 (UX)" ;;
    6)  echo "Stage 6:  Code Review & Security        — Agent 5 (Reviewer)" ;;
    7)  echo "Stage 7:  Governance Audit              — Agent 6 (File Warden)" ;;
    8)  echo "Quality Gate Check                      — CEO" ;;
    *)  echo "Unknown stage: $STAGE" ;;
esac

echo "✅ Stage $STAGE initiated for $FEATURE_NAME"
```

## Handoff Notes

- Each stage MUST complete fully before the next stage begins
- Any stage can fail and return to a previous stage for iteration
- The CEO (main LLM) has authority to skip or accelerate stages based on risk assessment
- Design Generation (Stage 2.5) is SKIPPED for backend-only features (no frontend work)
- Visual QA (Stage 5.5) is SKIPPED for backend-only features
- Security-critical features MUST complete all 9 stages
- Hotfixes may skip stages 1-2.5 but MUST complete stages 3-7
- Token budget is monitored across all stages — if exceeded, session is split
