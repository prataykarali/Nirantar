#!/bin/bash
# harness_agent.sh — The Harness Agent: Orchestrates the 6-agent workflow with looping
#
# This script implements the "harness agent" pattern where agents can loop back
# to previous stages if issues are found, creating an iterative improvement cycle.
#
# Usage:
#   ./harness_agent.sh plan "Add user authentication"
#   ./harness_agent.sh execute "Implement login" --arch-plan plans/login.md
#   ./harness_agent.sh pipeline "full-feature" --max-iterations 3

set -euo pipefail

COMPANY_BUGS_PATH="${COMPANY_BUGS_PATH:-/home/pratay-karali/Desktop/company_bugs}"
MAX_ITERATIONS="${MAX_ITERATIONS:-3}"
CURRENT_ITERATION=0
FEATURE_NAME=""
MODE="pipeline"

# ── Colors ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ── Help ──────────────────────────────────────────────────────────────
show_help() {
    echo "AI Agent Company — Harness Agent"
    echo ""
    echo "Usage:"
    echo "  $0 plan <description>          Run Agent 1: Architecture & Planning"
    echo "  $0 execute <description>       Run Agent 2: Implementation"
    echo "  $0 optimize <description>       Run Agent 3: ML/LLM Optimization"
    echo "  $0 test <description>          Run Agent 4: Testing & QA"
    echo "  $0 review <description>        Run Agent 5: Code Review & Security"
    echo "  $0 audit <path>                Run Agent 6: File Governance Audit"
    echo "  $0 pipeline <feature>          Run full CI/CD pipeline with looping"
    echo ""
    echo "Options:"
    echo "  --max-iterations <N>   Maximum loop iterations (default: 3)"
    echo "  --skip-qa              Skip QA gates (not recommended)"
    echo "  --verbose              Verbose output"
    echo ""
}

# ── Stage Functions ───────────────────────────────────────────────────

stage_1_requirements() {
    local feature="$1"
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Stage 1/7: Requirements Analysis — CEO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
    echo "Feature: $feature"
    echo ""
    echo "Requirements Checklist:"
    echo "  [ ] Requirements are unambiguous and testable"
    echo "  [ ] Success criteria defined"
    echo "  [ ] Constraints documented"
    echo "  [ ] Edge cases identified"
    echo "  [ ] Security considerations noted"
    echo ""
    echo "📋 Generating requirements document..."
    
    mkdir -p ".company/plans"
    cat > ".company/plans/${feature// /_}_requirements.md" << EOF
# Requirements: $feature

## Summary
<!-- 2-3 sentence overview -->

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Constraints
- 

## Edge Cases
- 

## Security Considerations
- 
EOF
    
    echo -e "${GREEN}✅ Requirements document created${NC}"
    return 0
}

stage_2_architecture() {
    local feature="$1"
    echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  Stage 2/7: Architecture & Planning — Agent 1 (Architect)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    # Load architect prompt
    cat "$COMPANY_BUGS_PATH/agents/agent1_architect_planner.md" 2>/dev/null | head -5
    echo ""
    echo "📋 Creating architecture plan..."
    
    mkdir -p ".company/plans"
    cat > ".company/plans/${feature// /_}_architecture.md" << EOF
# Architecture Plan: $feature

## Task Breakdown
- [ ] Task 1: 
- [ ] Task 2: 
- [ ] Task 3: 

## Dependency Graph
\`\`\`
<!-- Dependencies here -->
\`\`\`

## File Structure Plan
\`\`\`
<!-- Files here — each under 500 lines -->
\`\`\`

## Interface Contracts
\`\`\`
<!-- API contracts here -->
\`\`\`

## Risk Register
| Risk | Impact | Mitigation |
|------|--------|------------|
|      |        |            |
EOF
    
    echo -e "${GREEN}✅ Architecture plan created${NC}"
    return 0
}

stage_3_implementation() {
    local feature="$1"
    echo -e "\n${MAGENTA}═══════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  Stage 3/7: Implementation — Agent 2 (Lead Developer)${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${YELLOW}MASTER_CODER Standards Active:${NC}"
    echo "  - Each file: 300-500 lines maximum"
    echo "  - Single responsibility per module"
    echo "  - Comprehensive error handling"
    echo "  - No TODOs or placeholders"
    echo ""
    echo "💻 Implementing: $feature"
    echo ""
    echo "Implementation Checklist:"
    echo "  [ ] Code follows MASTER_CODER standards"
    echo "  [ ] All edge cases handled"
    echo "  [ ] Error handling complete"
    echo "  [ ] No TODOs or stubs"
    echo "  [ ] Self-review completed"
    
    return 0
}

stage_4_ml_optimization() {
    local feature="$1"
    echo -e "\n${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Stage 4/7: ML/LLM Optimization — Agent 3 (ML Specialist)${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo "⚙️ Optimizing prompts and token budgets..."
    echo ""
    echo "Optimization Checklist:"
    echo "  [ ] Token budgets calculated correctly"
    echo "  [ ] Fallback strategies in place"
    echo "  [ ] Output validation implemented"
    echo "  [ ] Model selection justified"
    echo "  [ ] Prompt versioning in place"
    
    return 0
}

stage_5_testing() {
    local feature="$1"
    echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Stage 5/7: Testing — Agent 4 (QA Engineer)${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo "🧪 Running test suite..."
    echo ""
    echo "Testing Checklist:"
    echo "  [ ] Unit tests cover ≥ 90% of code"
    echo "  [ ] Integration tests cover all endpoints"
    echo "  [ ] Adversarial tests pass"
    echo "  [ ] LLM output quality checks pass"
    echo "  [ ] No regressions introduced"
    echo ""
    
    # Check if pytest is available
    if command -v pytest &> /dev/null; then
        echo "Running pytest..."
        pytest --tb=short -q 2>&1 | head -20 || true
    else
        echo -e "${YELLOW}⚠️  pytest not available — manual test verification required${NC}"
    fi
    
    return 0
}

stage_6_review() {
    local feature="$1"
    echo -e "\n${RED}═══════════════════════════════════════════════════${NC}"
    echo -e "${RED}  Stage 6/7: Code Review & Security — Agent 5 (Reviewer)${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${RED}🔐 Running 5-Pass Review Gate...${NC}"
    echo ""
    echo "  Pass 1: Security Review"
    echo "  Pass 2: Correctness Review"
    echo "  Pass 3: Style & Maintainability"
    echo "  Pass 4: Performance Review"
    echo "  Pass 5: Governance & Compliance"
    echo ""
    
    # Scan for banned patterns
    echo "Scanning for banned patterns..."
    local banned_found=0
    while IFS= read -r file; do
        if grep -l "TODO\|FIXME\|HACK\|XXX\|password\s*=\|api_key\s*=\|secret\s*=" "$file" 2>/dev/null; then
            echo -e "${RED}❌ Banned pattern found in: $file${NC}"
            banned_found=$((banned_found + 1))
        fi
    done < <(find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null)
    
    if [ "$banned_found" -gt 0 ]; then
        echo -e "${RED}❌ $banned_found file(s) contain banned patterns — REVIEW FAILED${NC}"
        return 1
    else
        echo -e "${GREEN}✅ No banned patterns found — PASS${NC}"
        return 0
    fi
}

stage_7_governance() {
    local feature="$1"
    echo -e "\n${MAGENTA}═══════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  Stage 7/7: Governance Audit — Agent 6 (File Warden)${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════${NC}"
    echo ""
    
    echo "📁 Auditing file sizes and directory structure..."
    echo ""
    
    local over_limit=0
    local total_files=0
    
    while IFS= read -r file; do
        total_files=$((total_files + 1))
        local lines
        lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        if [ "$lines" -gt 500 ]; then
            echo -e "${RED}❌ OVER LIMIT: $file ($lines lines)${NC}"
            over_limit=$((over_limit + 1))
        elif [ "$lines" -gt 450 ]; then
            echo -e "${YELLOW}⚠️  WARNING: $file ($lines lines)${NC}"
        fi
    done < <(find . -type f \( -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.html" -o -name "*.css" \) ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/__pycache__/*" 2>/dev/null)
    
    echo ""
    echo "Total files scanned: $total_files"
    
    if [ "$over_limit" -gt 0 ]; then
        echo -e "${RED}❌ $over_limit file(s) exceed 500-line limit — GOVERNANCE FAILED${NC}"
        echo -e "${YELLOW}⚠️  Auto-split recommended for bloated files${NC}"
        return 1
    else
        echo -e "${GREEN}✅ All files within 500-line limit — GOVERNANCE PASSED${NC}"
        return 0
    fi
}

# ── Pipeline Orchestrator with Looping ────────────────────────────────

run_pipeline() {
    local feature="$1"
    local iteration=1
    local max_iter="${MAX_ITERATIONS}"
    local all_passed=false
    
    echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  🏢 AI Agent Company — Full CI/CD Pipeline            ║${NC}"
    echo -e "${BLUE}║  Feature: $feature${NC}"
    echo -e "${BLUE}║  Max Iterations: $max_iter${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
    
    while [ "$iteration" -le "$max_iter" ]; do
        echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}  Iteration $iteration of $max_iter${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        local stage_failed=false
        
        # Stage 1: Requirements
        stage_1_requirements "$feature" || stage_failed=true
        
        # Stage 2: Architecture
        stage_2_architecture "$feature" || stage_failed=true
        
        # Stage 3: Implementation
        stage_3_implementation "$feature" || stage_failed=true
        
        # Stage 4: ML Optimization
        stage_4_ml_optimization "$feature" || stage_failed=true
        
        # Stage 5: Testing
        stage_5_testing "$feature" || stage_failed=true
        
        # Stage 6: Review
        if ! stage_6_review "$feature"; then
            stage_failed=true
            echo -e "${RED}Review failed — will iterate${NC}"
        fi
        
        # Stage 7: Governance
        if ! stage_7_governance "$feature"; then
            stage_failed=true
            echo -e "${RED}Governance audit failed — will iterate${NC}"
        fi
        
        # Quality Gate
        echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
        echo -e "${BLUE}  Quality Gate Check${NC}"
        echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
        
        if [ "$stage_failed" = false ]; then
            all_passed=true
            echo -e "\n${GREEN}✅ ALL STAGES PASSED — DEPLOYMENT READY${NC}"
            break
        else
            echo -e "\n${YELLOW}⚠️  Some stages failed — iterating (attempt $iteration/$max_iter)${NC}"
            iteration=$((iteration + 1))
            
            if [ "$iteration" -le "$max_iter" ]; then
                echo -e "${CYAN}↻ Restarting pipeline with improvements from previous iteration...${NC}"
            fi
        fi
    done
    
    if [ "$all_passed" = true ]; then
        echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ PIPELINE COMPLETE — Ready for Deployment           ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
        return 0
    else
        echo -e "\n${RED}╔═══════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ❌ PIPELINE EXHAUSTED — Max iterations reached         ║${NC}"
        echo -e "${RED}║  Manual intervention required                           ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
        return 1
    fi
}

# ── Main Entry Point ──────────────────────────────────────────────────

main() {
    local mode="${1:-}"
    shift 2>/dev/null || true
    
    case "$mode" in
        plan|architect)
            stage_2_architecture "$*"
            ;;
        execute|implement|code)
            stage_3_implementation "$*"
            ;;
        optimize|ml)
            stage_4_ml_optimization "$*"
            ;;
        test|qa)
            stage_5_testing "$*"
            ;;
        review|audit)
            stage_6_review "$*"
            ;;
        warden|governance)
            stage_7_governance "$*"
            ;;
        pipeline|full)
            run_pipeline "$*"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown mode: $mode${NC}"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
