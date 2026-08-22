# UX Audit Report

## Overview

This document defines the structured UX audit report produced by **Agent 8 (UX Researcher)** after reviewing designs from **Agent 7 (UI Designer)** and before handoff to **Agent 2 (Lead Developer)**. Every UX audit MUST conform to this schema to ensure accessibility, usability, and interaction quality.

---

## 1. Report Header

```markdown
## UX Audit Report: <Feature/Page/Component Name>

### Metadata
- **Auditor:** Agent 8 — UX Researcher
- **Designer:** Agent 7 — UI Designer
- **Feature:** <feature-name>
- **Date:** <ISO-8601-date>
- **Version:** <design-version>
- **Status:** [DRAFT | IN REVIEW | APPROVED | CHANGES REQUIRED | REJECTED]
```

---

## 2. Executive Summary

```markdown
### 2.1 Overall UX Score: <score>/100

| Dimension | Score | Verdict |
|-----------|-------|---------|
| User Journey Clarity | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |
| Information Architecture | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |
| State Coverage | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |
| WCAG Accessibility | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |
| Error Handling & Recovery | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |
| Consistency | <0-100> | ✅ PASS / ⚠️ WARN / ❌ FAIL |

### 2.2 Critical Issues
| # | Severity | Issue | Location | Assigned To |
|---|----------|-------|----------|-------------|
| 1 | 🔴 Critical | <description> | <component/page> | Agent 7 |
| 2 | 🟡 High | <description> | <component/page> | Agent 7 |
| 3 | 🟢 Medium | <description> | <component/page> | Agent 7 |

### 2.3 Verdict
**<APPROVED | CHANGES REQUIRED | REJECTED>** — <reason>
```

---

## 3. User Journey Audit

```markdown
### 3.1 Journey Map: <Feature Flow>

| Stage | User Goal | UX Score | Issues |
|-------|-----------|----------|--------|
| 1. Entry | <goal> | <0-100> | <issues or N/A> |
| 2. Discovery | <goal> | <0-100> | <issues or N/A> |
| 3. Selection | <goal> | <0-100> | <issues or N/A> |
| 4. Confirmation | <goal> | <0-100> | <issues or N/A> |

### 3.2 Friction Points Identified

| Friction Point | Stage | Severity | Impact | Recommended Fix |
|---------------|-------|----------|--------|-----------------|
| <description> | <stage> | High/Med/Low | <user impact> | <specific fix> |
| <description> | <stage> | High/Med/Low | <user impact> | <specific fix> |

### 3.3 Dead-End States Check
- [ ] No dead-end states — every state has a clear next action
- [ ] Error states provide recovery paths
- [ ] Empty states provide CTAs
- [ ] Success states confirm completion

### 3.4 Cognitive Load Assessment
- **Steps to complete primary goal:** <number>
- **Recommended max:** 5 ± 2 steps
- **Verdict:** ✅ Within limits / ⚠️ Excessive steps / ❌ Needs simplification
```

---

## 4. Information Architecture Audit

```markdown
### 4.1 Navigation Structure

```
Proposed Structure:
└── <Level 0>
    ├── <Level 1a>
    │   ├── <Level 2a>
    │   └── <Level 2b>
    └── <Level 1b>
        └── <Level 2c>
```

### 4.2 Depth Analysis
- **Max navigation depth:** <number> levels
- **Recommended max:** 3 levels
- **Verdict:** ✅ Optimal / ⚠️ Consider flattening / ❌ Too deep

### 4.3 Wayfinding Assessment

| Element | Status | Notes |
|---------|--------|-------|
| Current location indicator | ✅/❌ | <notes> |
| Breadcrumb navigation | ✅/❌ | <notes> |
| Search persistence | ✅/❌ | <notes> |
| Back navigation | ✅/❌ | <notes> |
| Deep linking | ✅/❌ | <notes> |

### 4.4 Content Organization

| Criteria | Score | Issues |
|----------|-------|--------|
| Logical grouping | <0-100> | <issues> |
| Consistent labeling | <0-100> | <issues> |
| Progressive disclosure | <0-100> | <issues> |
| Searchability | <0-100> | <issues> |
```

---

## 5. State Coverage Audit

```markdown
### 5.1 State Coverage Matrix

| Component | Loading | Empty | Error | Success | Disabled | Offline | Optimistic |
|-----------|---------|-------|-------|---------|----------|---------|------------|
| <component> | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |
| <component> | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

### 5.2 Missing States

| Component | Missing State | Risk | Recommendation |
|-----------|--------------|------|----------------|
| <component> | <state> | <user impact if missing> | <specific implementation> |
| <component> | <state> | <user impact if missing> | <specific implementation> |

### 5.3 State Transition Validation

```
Checked transitions:
- Empty → Loading → Success ✅
- Empty → Loading → Error → Retry → Loading ✅
- Loading → Partial → Success ✅
- Success → Empty (reset) ✅
- Error → Offline → Reconnect → Loading ✅
```

### 5.4 Timing & Feedback

| State | Feedback Type | Timing | Accessibility |
|-------|--------------|--------|---------------|
| Loading | Skeleton / Pulse | < 3s → skeleton, > 3s → spinner with progress | aria-busy="true" |
| Empty | Illustration + message + CTA | Immediate | role="status" |
| Error | Inline error + retry | Immediate | role="alert" |
| Success | Confirmation + next step | 2s auto-dismiss or manual dismiss | aria-live="polite" |
```

---

## 6. WCAG Accessibility Audit

```markdown
### 6.1 Compliance Summary

| Level | Pass Rate | Critical Failures |
|-------|-----------|-------------------|
| A | <percentage>% | <count> |
| AA | <percentage>% | <count> |
| AAA | <percentage>% | <count> |

### 6.2 Perceivable

| Criterion | Level | Status | Notes | Fix |
|-----------|-------|--------|-------|-----|
| 1.1.1 Non-text Content | A | ✅/❌ | <notes> | <fix> |
| 1.4.1 Use of Color | A | ✅/❌ | <notes> | <fix> |
| 1.4.3 Contrast (Text) | AA | ✅/❌ | <notes> | <fix> |
| 1.4.4 Resize Text | AA | ✅/❌ | <notes> | <fix> |
| 1.4.11 Contrast (Non-text) | AA | ✅/❌ | <notes> | <fix> |
| 1.4.12 Text Spacing | AA | ✅/❌ | <notes> | <fix> |

### 6.3 Operable

| Criterion | Level | Status | Notes | Fix |
|-----------|-------|--------|-------|-----|
| 2.1.1 Keyboard | A | ✅/❌ | <notes> | <fix> |
| 2.1.2 No Keyboard Trap | A | ✅/❌ | <notes> | <fix> |
| 2.4.3 Focus Order | A | ✅/❌ | <notes> | <fix> |
| 2.4.7 Focus Visible | AA | ✅/❌ | <notes> | <fix> |
| 2.5.3 Label in Name | A | ✅/❌ | <notes> | <fix> |
| 2.5.5 Target Size | AA | ✅/❌ | <notes> | <fix> |

### 6.4 Understandable

| Criterion | Level | Status | Notes | Fix |
|-----------|-------|--------|-------|-----|
| 3.2.1 On Focus | A | ✅/❌ | <notes> | <fix> |
| 3.2.2 On Input | A | ✅/❌ | <notes> | <fix> |
| 3.3.1 Error Identification | A | ✅/❌ | <notes> | <fix> |
| 3.3.2 Labels/Instructions | A | ✅/❌ | <notes> | <fix> |
| 3.3.3 Error Suggestion | AA | ✅/❌ | <notes> | <fix> |

### 6.5 Robust

| Criterion | Level | Status | Notes | Fix |
|-----------|-------|--------|-------|-----|
| 4.1.1 Parsing | A | ✅/❌ | <notes> | <fix> |
| 4.1.2 Name, Role, Value | A | ✅/❌ | <notes> | <fix> |
| 4.1.3 Status Messages | AA | ✅/❌ | <notes> | <fix> |

### 6.6 Color Contrast Report

| Element | Foreground | Background | Ratio | AA Normal | AA Large | AAA Normal |
|---------|-----------|------------|-------|-----------|----------|------------|
| <element> | <hex> | <hex> | <ratio> | ✅/❌ | ✅/❌ | ✅/❌ |
| <element> | <hex> | <hex> | <ratio> | ✅/❌ | ✅/❌ | ✅/❌ |

### 6.7 Keyboard Navigation Map

```
Tab order:
1. Skip to content link
2. Main navigation links
3. Search input
4. Primary CTA button
5. Secondary actions
6. Footer links

Shortcuts:
- / → Focus search
- Escape → Close modal/dropdown
- Tab → Next focusable element
- Shift+Tab → Previous focusable element
- Enter/Space → Activate element
```
```

---

## 7. Error Handling & Recovery Audit

```markdown
### 7.1 Error Scenario Coverage

| Scenario | Error Message | Recovery Action | UX Score |
|----------|--------------|-----------------|----------|
| Network timeout | <message> | <action> | <0-100> |
| Invalid input | <message> | <action> | <0-100> |
| Server error (500) | <message> | <action> | <0-100> |
| Not found (404) | <message> | <action> | <0-100> |
| Rate limited (429) | <message> | <action> | <0-100> |
| Authorization (403) | <message> | <action> | <0-100> |
| Offline | <message> | <action> | <0-100> |

### 7.2 Error Message Quality

| Criteria | Score | Issues |
|----------|-------|--------|
| Clear what happened | <0-100> | <issues> |
| Clear how to fix | <0-100> | <issues> |
| No technical jargon | <0-100> | <issues> |
| Appropriate tone | <0-100> | <issues> |
| Actionable CTA | <0-100> | <issues> |

### 7.3 Recovery Path Completeness

- [ ] Retry button with exponential backoff
- [ ] "Go back" option
- [ ] Contact support link
- [ ] Offline fallback content
- [ ] Data preservation on error (no loss of user input)
```
---

## 8. Consistency Audit

```markdown
### 8.1 Interaction Pattern Consistency

| Pattern | Occurrences | Consistent? | Notes |
|---------|-------------|-------------|-------|
| Button placement | <count> | ✅/❌ | <notes> |
| Form validation style | <count> | ✅/❌ | <notes> |
| Navigation pattern | <count> | ✅/❌ | <notes> |
| Loading indicators | <count> | ✅/❌ | <notes> |
| Error message style | <count> | ✅/❌ | <notes> |

### 8.2 Terminology Consistency

| Term | Used In | Consistent? |
|------|---------|-------------|
| <term> | <locations> | ✅/❌ |
| <term> | <locations> | ✅/❌ |

### 8.3 Visual Consistency

- [ ] Same component types use same visual treatment
- [ ] Spacing is consistent across similar components
- [ ] Color usage follows token system
- [ ] Typography hierarchy is consistent
```
---

## 9. Recommendations

```markdown
### 9.1 Required Changes (Blocking Approval)

| # | Priority | Issue | Agent | Fix Description |
|---|----------|-------|-------|-----------------|
| 1 | 🔴 Critical | <issue> | Agent 7 | <detailed fix> |
| 2 | 🟡 High | <issue> | Agent 7 | <detailed fix> |

### 9.2 Recommended Improvements (Non-Blocking)

| # | Priority | Issue | Agent | Fix Description |
|---|----------|-------|-------|-----------------|
| 1 | 🟢 Medium | <issue> | Agent 7 | <detailed fix> |
| 2 | 🔵 Low | <issue> | Agent 7 | <detailed fix> |

### 9.3 Future Considerations

- <suggestion for next iteration>
- <suggestion for future enhancement>
```
---

## 10. Approval Block

```markdown
## UX Audit Sign-Off

| Role | Agent | Signature | Date |
|------|-------|-----------|------|
| UX Auditor | Agent 8 | ✅ / ❌ | <date> |
| UI Designer | Agent 7 | ✅ / ❌ | <date> |
| Lead Developer | Agent 2 | ✅ / ❌ | <date> |
| CEO | Main LLM | ✅ / ❌ | <date> |

**Status:** [PENDING | APPROVED | CHANGES REQUIRED | REJECTED]
**Next Action:** <who needs to do what next>

---
*Generated by Agent 8 — UX Interaction & User Flow Specialist*
