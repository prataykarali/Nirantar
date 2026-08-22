#!/usr/bin/env bash
# Test execution helper running full pytest regression suite

set -e

echo "🧪 Running full NIRANTAR test suite..."
python3 -m pytest tests/ -v

echo "🔍 Running Anti-Hardcoding Audit..."
python3 code-quality-agents/evals/anti_hardcoding_auditor.py --dir .

echo "✨ Running Code Reviewer Audit..."
python3 code-quality-agents/evals/code_quality_reviewer.py --source backend/app/api/system.py

echo "🎉 ALL TESTS & CODE QUALITY AUDITS COMPLETED SUCCESSFULLY!"
