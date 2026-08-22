#!/bin/bash
# activate_company.sh — Source this script to make the AI Agent Company globally available
#
# Usage:
#   source /path/to/company_bugs/scripts/activate_company.sh
#
# Then use company commands from any directory:
#   company-plan "Add user authentication"
#   company-execute "Implement login endpoint"
#   company-review "Review all changed files"
#   company-warden "Audit file sizes"

COMPANY_BUGS_PATH="${COMPANY_BUGS_PATH:-/home/pratay-karali/Desktop/company_bugs}"

echo "🏢 AI Agent Company — Global Skill Activated"
echo "Company path: $COMPANY_BUGS_PATH"
echo ""

# ── Company CLI Commands ──────────────────────────────────────────────

company-help() {
    echo "AI Agent Company — Available Commands"
    echo ""
    echo "  company-plan      <description>   Run Agent 1: Architecture & Planning"
    echo "  company-execute   <description>   Run Agent 2: Implementation"
    echo "  company-ml        <description>   Run Agent 3: ML/LLM Optimization"
    echo "  company-test      <description>   Run Agent 4: Testing & QA"
    echo "  company-review    <description>   Run Agent 5: Code Review & Security"
    echo "  company-warden    <path>          Run Agent 6: File Governance Audit"
    echo "  company-pipeline  <feature>       Run full 9-stage CI/CD pipeline"
    echo "  company-init      <directory>     Initialize company structure in project"
    echo "  company-report                    Generate governance report for current dir"
    echo ""
    echo "Environment Variables:"
    echo "  COMPANY_BUGS_PATH  Path to company_bugs directory"
    echo "  COMPANY_SKIP_QA    Set to 'true' to skip QA gates (not recommended)"
}

company-plan() {
    echo "🔍 Agent 1: Architect / Planner"
    echo "Task: $1"
    echo ""
    echo "See architecture template:"
    cat "$COMPANY_BUGS_PATH/agents/agent1_architect_planner.md" | head -30
    echo ""
    echo "📋 Generate your plan following the template above."
    echo "Save to: .company/plans/$(echo $1 | tr ' ' '_').md"
}

company-execute() {
    echo "💻 Agent 2: Lead Developer / Coder"
    echo "Task: $1"
    echo ""
    echo "See MASTER_CODER standards:"
    cat "$COMPANY_BUGS_PATH/agents/agent2_lead_developer.md" | head -40
    echo ""
    echo "📝 Implement following MASTER_CODER guidelines."
    echo "Each file MUST be 300-500 lines maximum."
}

company-ml() {
    echo "🤖 Agent 3: ML/LLM Specialist"
    echo "Task: $1"
    echo ""
    cat "$COMPANY_BUGS_PATH/agents/agent3_ml_llm_specialist.md" | head -30
    echo ""
    echo "⚙️ Optimize prompts and token budgets."
}

company-test() {
    echo "🧪 Agent 4: Tester / QA Engineer"
    echo "Task: $1"
    echo ""
    cat "$COMPANY_BUGS_PATH/agents/agent4_tester_qa.md" | head -30
    echo ""
    echo "✅ Write and run tests. Coverage target: ≥ 90%"
}

company-review() {
    TARGET="${1:-.}"
    echo "🔐 Agent 5: Code Reviewer & Quality Architect (Architecting Excellence)"
    echo "Target: $TARGET"
    echo ""
    echo "🛡️ Running 7-Dimensional Excellence Gate..."
    echo "  1. Security & Data Integrity"
    echo "  2. Correctness & Robustness"
    echo "  3. Tactical Aesthetics (Never Nester depth ≤ 3, Guard Clauses)"
    echo "  4. Abstraction Prudence (AHA/WET, Variable Optimization)"
    echo "  5. Performance & Resource Efficiency"
    echo "  6. Validation Fidelity (Testing Trophy, Mutation/Property Tests)"
    echo "  7. Socio-Technical & Small CLs (Conventional Comments)"
    echo ""
    if [ -f "$COMPANY_BUGS_PATH/evals/code_quality_reviewer.py" ]; then
        python3 "$COMPANY_BUGS_PATH/evals/code_quality_reviewer.py" --source "$TARGET"
    fi
}

company-warden() {
    TARGET_DIR="${1:-.}"
    echo "📁 Agent 6: File Warden — Governance Audit"
    echo "Target: $TARGET_DIR"
    echo ""
    echo "Scanning file sizes..."
    echo "────────────────────────────────────────"
    
    OVER_LIMIT=0
    TOTAL_FILES=0
    
    while IFS= read -r file; do
        TOTAL_FILES=$((TOTAL_FILES + 1))
        LINES=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$LINES" -gt 500 ]; then
            echo "❌ OVER LIMIT: $file ($LINES lines)"
            OVER_LIMIT=$((OVER_LIMIT + 1))
        elif [ "$LINES" -gt 450 ]; then
            echo "⚠️  WARNING: $file ($LINES lines)"
        else
            echo "✅ OK: $file ($LINES lines)"
        fi
    done < <(find "$TARGET_DIR" -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.html" -o -name "*.css" -o -name "*.md" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/__pycache__/*" 2>/dev/null)
    
    echo "────────────────────────────────────────"
    echo "Total files scanned: $TOTAL_FILES"
    if [ "$OVER_LIMIT" -gt 0 ]; then
        echo "❌ $OVER_LIMIT file(s) exceed 500-line limit — ACTION REQUIRED"
    else
        echo "✅ All files within 500-line limit — GOVERNANCE PASSED"
    fi
}

company-pipeline() {
  FEATURE="$1"
  echo "🏢 AI Agent Company — Full CI/CD Pipeline"
  echo "Feature: $FEATURE"
  echo ""
  echo "Stage 1/9: Requirements Analysis — CEO"
  echo "Stage 2/9: Architecture & Planning — Agent 1"
  echo "Stage 2.5/9: Design Generation — Agent 7 + Agent 8"
  echo "Stage 3/9: Implementation — Agent 2"
  echo "Stage 4/9: ML/LLM Optimization — Agent 3"
  echo "Stage 5/9: Testing — Agent 4"
  echo "Stage 5.5/9: Visual QA & UX Audit — Agent 7 + Agent 8"
  echo "Stage 6/9: Code Review & Security — Agent 5"
  echo "Stage 7/9: Governance Audit — Agent 6"
  echo ""
  echo "📋 Pipeline initiated for '$FEATURE'"
  echo "See $COMPANY_BUGS_PATH/pipelines/cicd_pipeline.md for details"
}

company-init() {
    TARGET="${1:-.company}"
    echo "📦 Initializing AI Agent Company structure in '$TARGET'..."
    
    mkdir -p "$TARGET"/{plans,reviews,audits,prompts,logs}
    
    cat > "$TARGET/README.md" << 'EOF'
# AI Agent Company — Project Context

This directory contains AI Agent Company operational artifacts for this project.

## Structure
- `plans/` — Architecture plans from Agent 1
- `reviews/` — Code review reports from Agent 5
- `audits/` — Governance audit reports from Agent 6
- `prompts/` — LLM prompts from Agent 3
- `logs/` — Pipeline execution logs
EOF
    
    echo "✅ Initialized at '$TARGET'"
    company-help
}

company-report() {
    echo "📊 AI Agent Company — Governance Report"
    echo "Generated: $(date)"
    echo "────────────────────────────────────────"
    company-warden "$1"
    echo ""
    echo "See $COMPANY_BUGS_PATH/rules/file_governance_policy.md for full policy."
}

# ── Alias for daisy-chaining into any AI coder prompt ─────────────────

company-context() {
    echo "=== AI Agent Company Context ==="
    echo "Company Path: $COMPANY_BUGS_PATH"
    echo "Agents Available: 6"
    echo "- Agent 1: Architect/Planner"
    echo "- Agent 2: Lead Developer (MASTER_CODER)"
    echo "- Agent 3: ML/LLM Specialist"
    echo "- Agent 4: Tester/QA Engineer"
    echo "- Agent 5: Code Reviewer & Security Auditor"
    echo "- Agent 6: File Warden (Governance)"
    echo ""
    echo "Hard Rules:"
    echo "- Every file: 300-500 lines maximum"
    echo "- 5-Pass Review Gate before deployment"
    echo "- No hardcoded secrets or banned patterns"
    echo "- ≥ 90% test coverage required"
    echo ""
    echo "=== End Company Context ==="
}

echo "✅ Company commands loaded. Run 'company-help' to see all commands."
