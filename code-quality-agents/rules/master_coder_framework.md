# MASTER_CODER Quality Framework

## Overview

The MASTER_CODER framework is the engineering rigor standard enforced across all AI Agent Company operations. Every agent, every file, every line of code must adhere to these 10 quality dimensions.

## The 10 Dimensions

### M — Modular
**Principle:** Every unit of code has a single, well-defined responsibility.

```
✅ GOOD:  src/auth/login.py — handles user login only
✅ GOOD:  src/auth/register.py — handles user registration only
❌ BAD:   src/auth.py — 800 lines handling login, register, reset, SSO, OAuth
```

**Rules:**
- Each file: 300-500 lines maximum
- Each function: do one thing, do it well
- Maximum function length: 50 lines
- Maximum class length: 300 lines
- Clear interfaces between modules (no shared mutable state)
- **AHA Principle:** Avoid Hasty Abstractions. "Duplication is far cheaper than the wrong abstraction."
- **WET Rule of Three:** Tolerate duplication until a pattern appears ≥ 3 times before abstracting.
- **No Shallow Modules:** Avoid shallow wrapper classes or pass-through functions that add mental overhead.

### A — Adversarial-Aware
**Principle:** Assume every input is malicious until proven otherwise.

```python
# ✅ GOOD: Validate ALL inputs
def process_query(user_input: str) -> str:
    if not isinstance(user_input, str):
        raise ValueError("Input must be a string")
    if len(user_input) > 10000:
        raise ValueError("Input exceeds maximum length")
    sanitized = sanitize_input(user_input)
    return generate_response(sanitized)

# ❌ BAD: Trust user input directly
def process_query(user_input):
    return generate_response(user_input)  # Vulnerable to injection
```

**Rules:**
- Validate all input types, lengths, and ranges
- Sanitize all string inputs
- Never trust LLM outputs blindly — parse with fallback
- Handle edge cases explicitly (empty, null, malformed)
- Rate limit all user-facing endpoints

### S — Secure
**Principle:** Security is not a feature, it's a property of the system.

```
BANNED (NEVER USE):
- Hardcoded API keys, passwords, tokens
- eval(), exec() on user input
- os.system() or subprocess with shell=True
- SQL string concatenation (use parameterized queries)
- Pickle deserialization of untrusted data
- Disabled SSL verification (verify=False)
```

**Rules:**
- All secrets in environment variables or secret manager
- Parameterized database queries only
- HTTPS for all external communications
- Proper authentication and authorization
- Safe error messages (no stack traces to users)
- Input validation on all user-supplied data
- CSRF protection on all state-changing operations

### T — Testable
**Principle:** Write code that is easy to test without mocking the world.

```python
# ✅ GOOD: Dependency injection for testability
def process_order(order_repo: OrderRepository, notifier: Notifier, order_id: str) -> Order:
    order = order_repo.get_by_id(order_id)
    if not order:
        raise ValueError(f"Order {order_id} not found")
    result = order.process()
    notifier.send(order.user_email, f"Order {order_id} processed")
    return result

# ❌ BAD: Hard-coded dependencies — impossible to unit test
def process_order(order_id: str):
    import db  # Hard-coded import
    order = db.query(f"SELECT * FROM orders WHERE id = {order_id}")
    # ...
```

**Rules:**
- Use dependency injection for external services
- Pure functions preferred (no side effects)
- Avoid global state
- Write tests before or alongside code (TDD design pressure)
- **Testing Trophy Model:** Bedrock static analysis, moderate unit tests, core integration tests (middle largest), and lean E2E tests.
- **Advanced Validation:** Utilize property-based testing (Hypothesis) and mutation testing (mutmut) for critical paths.
- Each test tests one behavior, independent and repeatable

### E — Efficient
**Principle:** Optimize for the target hardware and use case.

```python
# ✅ GOOD: Understanding constraints
# CPU-only inference → small model, short context, 4 threads max
NUM_THREADS = min(4, os.cpu_count() or 2)

# ❌ BAD: Assume unlimited resources
NUM_THREADS = 32  # May not be available
```

**Rules:**
- Know your hardware constraints
- No N+1 query problems
- Appropriate caching strategy
- No unnecessary allocations in hot paths
- Use appropriate data structures
- Connection pooling for databases
- Batch processing for bulk operations

### R — Readable
**Principle:** Code is read far more often than it is written.

```python
# ✅ GOOD: Self-documenting code + Guard clause
def calculate_max_tokens(prompt_chars: int, model_cpt: float = 4.66) -> int:
    """Calculate num_predict for a study answer based on prompt length."""
    if prompt_chars <= 0:
        return 320
    prompt_tokens = max(1, int(prompt_chars / model_cpt))
    reserve = 640
    max_ctx = 3072
    num_predict = min(max_ctx - prompt_tokens, reserve)
    return max(320, num_predict)

# ❌ BAD: Cryptic, undocumented, deeply nested
def f(a, b=4.66):
    if a > 0:
        if b > 0:
            return max(320, min(3072 - max(1, int(a/b)), 640))
    return 320
```

**Rules:**
- **Never Nester Rule:** Maximum nesting depth is 3 levels. Flatten with early returns and guard clauses.
- **Cognitive Complexity:** Target < 8 per function; hard limit 15.
- **Variable Optimization:** Minimize redundant intermediate variables and mutable states.
- Descriptive variable and function names; no magic numbers.
- Comments explain "why" not "what".
- Functions at appropriate abstraction level; clean async/await syntax.

### C — Complete
**Principle:** No TODO stubs, no placeholders, no half-implemented features.

```
✅ GOOD: Every code path is implemented
✅ GOOD: Every error case is handled
✅ GOOD: Every edge case is considered
❌ BAD:  # TODO: implement this later
❌ BAD:  pass  # placeholder
❌ BAD:  raise NotImplementedError
```

**Rules:**
- Zero TODO stubs in production code
- Every except block handles the error meaningfully
- Default cases in all switch/match statements
- Fallback values for all optional configurations
- Graceful degradation for all external service calls

### O — Organized
**Principle:** Structure reflects function.

```
✅ GOOD:
src/
├── auth/         # Authentication module
│   ├── __init__.py
│   ├── login.py
│   └── register.py
├── api/          # API routes
│   ├── __init__.py
│   └── v1.py
└── models/       # Data models
    ├── __init__.py
    └── user.py

❌ BAD:
src/
├── utils.py      # 800 lines of everything
├── helpers.py    # 600 lines of more everything
└── main.py       # 1200 lines of spaghetti
```

**Rules:**
- Logical directory structure by domain
- One concept per file
- Clean import ordering (stdlib → third-party → local)
- No circular dependencies
- Consistent file naming across the project

### D — Documented
**Principle:** Good documentation is not optional.

```python
def fetch_citations(query: str, max_results: int = 5) -> list[dict]:
    """Fetch relevant citations from the knowledge graph.
    
    Args:
        query: User's search query
        max_results: Maximum number of citations to return (1-20)
        
    Returns:
        List of citation dicts with keys: doc_id, page_number, section_title, text_passage
        
    Raises:
        ValueError: If max_results is outside valid range
        ConnectionError: If graph database is unavailable
    """
```

**Rules:**
- Docstrings for all public functions, classes, and modules
- README for every major component
- Inline comments for complex algorithms
- Changelog for user-visible changes
- Architecture Decision Records (ADRs) for major decisions
- API documentation for all endpoints

### E — Evaluated
**Principle:** Self-review before submitting to peers.

```python
# Pre-submission checklist:
CHECKLIST = [
    "Did I run the linter?",
    "Did I run the formatter?",
    "Did I check file sizes?",
    "Did I write tests?",
    "Did I run the tests?",
    "Did I check for banned patterns?",
    "Did I remove debug prints/logging?",
    "Did I update the README/documentation?",
    "Did I check for security issues?",
    "Did I verify edge cases are handled?",
]
```

**Rules:**
- Run linters before submitting code
- Run formatters (black, prettier) before submitting
- Check file sizes are within limits
- Run full test suite
- Self-review for banned patterns
- Remove all debug code

### R — Reviewed
**Principle:** Every line of code is reviewed by at least one other agent.

```
Review Hierarchy:
├── Self-review (Agent 2 — Lead Developer)
├── Peer review (Agent 4 — QA Engineer)
├── Security review (Agent 5 — Code Reviewer)
└── Governance review (Agent 6 — File Warden)
    └── Final sign-off (CEO)
```

**Rules:**
- No code is merged without review
- All review comments must be addressed
- Security-critical changes need 2 reviewers
- Governance violations must be resolved
- Review reports are archived for audit trail

## Quality Gate Scorecard

| Dimension | Weight | Passing Score |
|-----------|--------|---------------|
| Modular | 15% | ≥ 80% |
| Adversarial-Aware | 15% | ≥ 90% |
| Secure | 20% | 100% (CRITICAL) |
| Testable | 10% | ≥ 70% |
| Efficient | 5% | ≥ 60% |
| Readable | 10% | ≥ 70% |
| Complete | 10% | ≥ 90% |
| Organized | 5% | ≥ 70% |
| Documented | 5% | ≥ 70% |
| Evaluated | 2.5% | ≥ 80% |
| Reviewed | 2.5% | 100% |

**Overall: Score ≥ 80% required for deployment.**
**Security score MUST be 100%. Any security violation blocks deployment.**
