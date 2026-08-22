# 🏢 AI Agent Company — Global Skill Blueprint

A **reusable, globally-available** multi-agent AI workforce system designed for any CLI-based AI coder (Claude, Codex, Cursor, etc.) to autonomously plan, develop, test, review, and deploy software with enterprise-grade quality gates.

## 🚀 Quick Start

```bash
# Clone or copy this blueprint into any project
cp -r /path/to/company_bugs ./your-project/.company

# Or source it globally
export COMPANY_BUGS_PATH="/home/pratay-karali/Desktop/company_bugs"
```

## 🏛️ Organizational Hierarchy

| Role | Agent | Responsibility |
|------|-------|---------------|
| **CEO** | You (the main LLM) | Strategic direction, task breakdown, agent orchestration, smart session planning |
| **Agent 1** | Architect / Planner | Feature breakdown, dependency mapping, architecture design, Obsidian mind-mapping |
| **Agent 2** | Lead Developer / Coder | Write pristine code following MASTER_CODER, Gratify/Headroom/Ponytail tooling |
| **Agent 3** | ML/LLM Specialist | Prompt engineering, token optimization, Headroom/Ponytail context management |
| **Agent 4** | Tester / QA Engineer | Unit tests, adversarial tests, distribution-based LLM checks |
| **Agent 5** | Code Reviewer & Quality Architect | Architecting Excellence: 7-Dimensional Gate, Never Nester, AHA/WET, Testing Trophy, Conventional Comments, CodeRabbit/OctoReview |
| **Agent 6** | File Warden | File size governance (300-500 lines), Gratify linting, Headroom token audits |
| **Agent 7** | UI Visual Designer | Design tokens, component specs, Tailwind config, layout wireframes, micro-interactions |
| **Agent 8** | UX Interaction Specialist | Journey mapping, WCAG accessibility, state coverage, information architecture |

## 📋 Core Directories

```
company_bugs/
├── agents/          # Agent system prompts & profiles
├── pipelines/       # CI/CD workflow definitions
├── rules/           # Governance policies & banned patterns
├── templates/       # Reusable code & document templates
├── scripts/         # Automation & enforcement scripts
└── evals/           # Evaluation frameworks & test suites
```

## 🔧 Usage with Any AI Coder

### As a System Prompt Prefix
```markdown
You are operating under the AI Agent Company framework.
Load the agent profiles from /path/to/company_bugs/agents/
Enforce file governance from /path/to/company_bugs/rules/
Follow the CI/CD pipeline from /path/to/company_bugs/pipelines/
```

### As a CLI Skill
```bash
# Source the company skill
source /path/to/company_bugs/scripts/activate_company.sh

# Then use company commands
company-plan "Add user authentication"
company-execute "Implement login endpoint"
company-review "Review all changed files"
company-warden "Audit file sizes"
```

## 🎯 Key Features

- **8 Specialized Agents** with distinct roles and system prompts (6 engineering + 2 UI/UX design)
- **Smart MoE Orchestrator** — Session decomposition, token/quota estimation, AI-model-agnostic planning
- **Quota-Aware Execution** — Says exactly what fits in your daily budget (codex, anthropic, deepseek, ollama)
- **Design-to-Code Handoff** — Structured tokens, component specs, and layout wireframes prevent UI bugs
- **UI/UX Quality Gates** — Visual regression checks, WCAG accessibility audit, state coverage validation
- **Advanced Tooling Ecosystem** — Obsidian mind-mapping, Gratify linting, Headroom/Ponytail token optimization
- **Automated PR Review** — CodeRabbit summaries, OctoReview inline comments, GitStream merge gates
- **File Size Governance** — Hard cap of 300-500 lines per file with auto-split
- **7-Dimensional Excellence Gate** — Architecting Excellence: Security, Correctness, Never Nester Aesthetics, AHA Abstraction Prudence, Performance, Testing Trophy, and Conventional Comments
- **Adversarial & Mutation Testing** — Prompt injection, edge cases, property-based tests (Hypothesis), mutation checks
- **Auto-Refactoring** — Files exceeding limits are automatically split by File Warden
- **Session-Based CI/CD Pipeline** — 9-stage pipeline with resume capability and progress tracking

---

*Built for vibe coding — autonomous, quality-gated, production-ready.*
