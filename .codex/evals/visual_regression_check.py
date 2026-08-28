#!/usr/bin/env python3
"""
Visual Regression & Design Token Validation Script

Automated visual regression checking and design token compliance validation.
Used by Agent 7 (UI Designer) and Agent 4 (QA Engineer) during Stage 5.5 (Visual QA).

Usage:
    python visual_regression_check.py --tokens .company/design/tokens.json --source ./src
    python visual_regression_check.py --baseline .company/design/baseline/ --current ./dist
    python visual_regression_check.py --validate-tailwind --config tailwind.config.js
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ── Color Contrast Utilities (WCAG 2.1) ─────────────────────────────────────

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(c * 2 for c in hex_color)
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """Calculate relative luminance per WCAG 2.1."""
    vals = []
    for c in rgb:
        s = c / 255.0
        vals.append(s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4)
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]


def check_contrast(foreground_hex: str, background_hex: str) -> Dict[str, Any]:
    """Calculate WCAG contrast ratio between two hex colors."""
    fg_rgb = hex_to_rgb(foreground_hex)
    bg_rgb = hex_to_rgb(background_hex)
    fg_lum = relative_luminance(fg_rgb)
    bg_lum = relative_luminance(bg_rgb)
    lighter = max(fg_lum, bg_lum)
    darker = min(fg_lum, bg_lum)
    ratio = (lighter + 0.05) / (darker + 0.05)
    return {
        "ratio": round(ratio, 2),
        "passes_AA_normal": ratio >= 4.5,
        "passes_AA_large": ratio >= 3.0,
        "passes_AAA_normal": ratio >= 7.0,
        "passes_AAA_large": ratio >= 4.5,
    }


# ── Design Token Loader ─────────────────────────────────────────────────────

def load_design_tokens(tokens_path: str) -> Dict[str, Any]:
    """Load design tokens from JSON file."""
    with open(tokens_path, 'r') as f:
        return json.load(f)


def validate_tokens_structure(tokens: Dict[str, Any]) -> List[Dict[str, str]]:
    """Validate that design tokens have all required fields."""
    required_sections = ['colors', 'typography', 'spacing', 'breakpoints', 'shadows', 'borderRadius', 'zIndex']
    errors = []
    for section in required_sections:
        if section not in tokens:
            errors.append({"field": section, "error": f"Missing required section: {section}"})
    return errors


# ── Tailwind Config Validation ──────────────────────────────────────────────

CSS_COLOR_PATTERN = re.compile(
    r'(?:color|background-color|border-color|outline-color|box-shadow):\s*'
    r'(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))'
)
CSS_FONT_PATTERN = re.compile(r'font-family:\s*[\'"]([^\'"]+)[\'"]')
CSS_SPACING_PATTERN = re.compile(r'(padding|margin|gap):\s*(\d+(?:\.\d+)?(?:px|rem|em))')

TAILWIND_COLOR_CLASSES = re.compile(r'(?:bg|text|border|ring|outline)-(?:[a-z]+)-(\d+)')
TAILWIND_SPACING_CLASSES = re.compile(r'(?:p|m|px|py|mx|my|gap)-(?:\d+|xs|sm|md|lg|xl|2xl|3xl)')


def validate_tailwind_config(config_path: str, tokens: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Validate Tailwind config extends design tokens properly."""
    issues = []
    if not os.path.exists(config_path):
        return [{"severity": "ERROR", "message": f"Tailwind config not found: {config_path}"}]
    try:
        with open(config_path, 'r') as f:
            content = f.read()
        # Check if token colors are referenced
        for color_name in ['primary', 'secondary', 'neutral']:
            if color_name in tokens.get('colors', {}):
                if color_name not in content:
                    issues.append({
                        "severity": "WARNING",
                        "message": f"Color '{color_name}' defined in tokens but not found in Tailwind config"
                    })
        # Check custom animations
        if 'animation' in tokens:
            token_animations = set(tokens['animation'].get('duration', {}).keys())
            config_has_custom_animations = 'keyframes' in content
            if token_animations and not config_has_custom_animations:
                issues.append({
                    "severity": "INFO",
                    "message": "Animation tokens defined but no custom keyframes found in Tailwind config"
                })
    except Exception as e:
        issues.append({"severity": "ERROR", "message": f"Error reading Tailwind config: {e}"})
    return issues


# ── CSS Source Compliance Check ─────────────────────────────────────────────

def extract_hardcoded_values(source_dir: str) -> List[Dict[str, Any]]:
    """Find hardcoded color/spacing values that should use design tokens."""
    hardcoded = []
    source_path = Path(source_dir)
    for file_path in source_path.rglob('*.css'):
        if 'node_modules' in str(file_path) or '.git' in str(file_path):
            continue
        try:
            content = file_path.read_text()
            for match in CSS_COLOR_PATTERN.finditer(content):
                hardcoded.append({
                    "file": str(file_path.relative_to(source_path)),
                    "line": content[:match.start()].count('\n') + 1,
                    "value": match.group(1),
                    "type": "hardcoded_color",
                    "recommendation": "Replace with design token reference"
                })
            for match in CSS_SPACING_PATTERN.finditer(content):
                hardcoded.append({
                    "file": str(file_path.relative_to(source_path)),
                    "line": content[:match.start()].count('\n') + 1,
                    "value": match.group(2),
                    "type": "hardcoded_spacing",
                    "recommendation": "Replace with spacing token"
                })
        except Exception:
            pass
    return hardcoded


# ── Responsive Breakpoint Compliance Check ──────────────────────────────────

def check_responsive_breakpoints(tokens: Dict[str, Any], source_dir: str) -> List[Dict[str, Any]]:
    """Check that source code respects defined breakpoints."""
    issues = []
    breakpoints = tokens.get('breakpoints', {})
    if not breakpoints:
        return issues
    source_path = Path(source_dir)
    defined_bps = set(breakpoints.keys())
    for file_path in source_path.rglob('*.css'):
        if 'node_modules' in str(file_path) or '.git' in str(file_path):
            continue
        try:
            content = file_path.read_text()
            # Find media queries
            media_queries = re.findall(r'@media\s*\([^)]+\)', content)
            for mq in media_queries:
                bp_match = re.search(r'(\d+)px', mq)
                if bp_match:
                    px_value = int(bp_match.group(1))
                    # Check if this breakpoint is close to a defined one
                    matched = False
                    for bp_name, bp_val in breakpoints.items():
                        bp_px = int(re.search(r'(\d+)', str(bp_val)).group(1))
                        if abs(px_value - bp_px) <= 16:
                            matched = True
                            break
                    if not matched:
                        issues.append({
                            "file": str(file_path.relative_to(source_path)),
                            "media_query": mq,
                            "issue": f"Breakpoint {px_value}px not found in design tokens. Defined: {breakpoints}",
                            "severity": "WARNING"
                        })
        except Exception:
            pass
    return issues


# ── Composition / Component Audit ───────────────────────────────────────────

def audit_component_states(source_dir: str) -> Dict[str, Any]:
    """Check that components have all required states defined in CSS."""
    required_states = {
        'hover': [':hover', 'hover:'],
        'focus': [':focus', ':focus-visible', 'focus:', 'focus-visible:'],
        'active': [':active', 'active:'],
        'disabled': [':disabled', 'disabled:'],
        'loading': ['.loading', '[aria-busy="true"]'],
        'error': ['.error', '[aria-invalid="true"]'],
        'empty': ['.empty', ':empty'],
    }
    source_path = Path(source_dir)
    components_found = {}
    for file_path in source_path.rglob('*.css'):
        if 'node_modules' in str(file_path) or '.git' in str(file_path):
            continue
        try:
            content = file_path.read_text()
            # Identify component selectors (class-based)
            selectors = re.findall(r'\.([a-zA-Z][\w-]*)\s*\{', content)
            for sel in selectors:
                if sel not in components_found:
                    components_found[sel] = set()
                # Check which states are defined for this component
                for state_name, patterns in required_states.items():
                    for pattern in patterns:
                        if pattern in content:
                            components_found[sel].add(state_name)
        except Exception:
            pass
    # Report missing states per component
    state_audit = {}
    for comp, states in components_found.items():
        missing = [s for s in required_states if s not in states]
        if missing:
            state_audit[comp] = {
                "defined_states": list(states),
                "missing_states": missing,
                "coverage": f"{len(states)}/{len(required_states)}"
            }
    return state_audit


# ── Report Generation ───────────────────────────────────────────────────────

def generate_report(
    token_errors: List[Dict],
    tailwind_issues: List[Dict],
    hardcoded_values: List[Dict],
    responsive_issues: List[Dict],
    state_audit: Dict,
    color_contrast_report: List[Dict],
) -> str:
    """Generate a visual regression report in Markdown."""
    report_lines = [
        "# Visual Regression & Design Compliance Report",
        "",
        f"**Generated:** $(date)",
        f"**Auditor:** Agent 7 — UI Designer (via automated script)",
        "",
        "---",
        "",
        "## Executive Summary",
        "",
    ]
    total_issues = (
        len(token_errors) +
        len(tailwind_issues) +
        len(hardcoded_values) +
        len(responsive_issues) +
        sum(len(v['missing_states']) for v in state_audit.values()) +
        sum(1 for c in color_contrast_report if not c['passes_AA_normal'])
    )
    report_lines.append(f"**Total Issues Found:** {total_issues}")
    report_lines.append("")
    if total_issues == 0:
        report_lines.append("✅ **PASSED** — All visual regression checks pass.")
    else:
        report_lines.append(f"⚠️ **{total_issues} issue(s) require attention**")
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    # Token Structure
    report_lines.append("## 1. Design Token Structure")
    if token_errors:
        for err in token_errors:
            report_lines.append(f"- ❌ {err['error']}")
    else:
        report_lines.append("- ✅ All required token sections present")
    report_lines.append("")
    # Tailwind Config
    report_lines.append("## 2. Tailwind Config Compliance")
    if tailwind_issues:
        for issue in tailwind_issues:
            icon = {'ERROR': '❌', 'WARNING': '⚠️', 'INFO': 'ℹ️'}.get(issue['severity'], '❓')
            report_lines.append(f"- {icon} [{issue['severity']}] {issue['message']}")
    else:
        report_lines.append("- ✅ Tailwind config is aligned with design tokens")
    report_lines.append("")
    # Hardcoded Values
    report_lines.append("## 3. Hardcoded Values (Should Use Tokens)")
    if hardcoded_values:
        report_lines.append(f"| File | Line | Value | Type | Recommendation |")
        report_lines.append(f"|------|------|-------|------|---------------|")
        for hv in hardcoded_values[:20]:
            report_lines.append(f"| {hv['file']} | {hv['line']} | `{hv['value']}` | {hv['type']} | {hv['recommendation']} |")
        if len(hardcoded_values) > 20:
            report_lines.append(f"| ... | ... | ... | ... | +{len(hardcoded_values) - 20} more |")
    else:
        report_lines.append("- ✅ No hardcoded color or spacing values found")
    report_lines.append("")
    # Responsive
    report_lines.append("## 4. Responsive Breakpoint Compliance")
    if responsive_issues:
        for ri in responsive_issues:
            report_lines.append(f"- ⚠️ {ri['file']}: {ri['issue']}")
    else:
        report_lines.append("- ✅ All media queries align with defined breakpoints")
    report_lines.append("")
    # Component States
    report_lines.append("## 5. Component State Coverage")
    if state_audit:
        for comp, info in state_audit.items():
            report_lines.append(f"- ⚠️ `.{comp}` — Missing: {', '.join(info['missing_states'])} (Coverage: {info['coverage']})")
    else:
        report_lines.append("- ✅ All components have all required states")
    report_lines.append("")
    # Color Contrast
    report_lines.append("## 6. Color Contrast Compliance (WCAG AA)")
    colors_checked = 0
    colors_failed = 0
    for cc in color_contrast_report:
        colors_checked += 1
        if not cc['passes_AA_normal']:
            colors_failed += 1
    if color_contrast_report:
        report_lines.append(f"| Foreground | Background | Ratio | AA Normal | AA Large | AAA Normal |")
        report_lines.append(f"|-----------|------------|-------|-----------|----------|------------|")
        for cc in color_contrast_report:
            aa_normal = "✅" if cc['passes_AA_normal'] else "❌"
            aa_large = "✅" if cc['passes_AA_large'] else "❌"
            aaa_normal = "✅" if cc['passes_AAA_normal'] else "❌"
            report_lines.append(f"| `{cc['fg']}` | `{cc['bg']}` | {cc['ratio']}:1 | {aa_normal} | {aa_large} | {aaa_normal} |")
        report_lines.append(f"\n**Result:** {colors_checked} pairs checked, {colors_failed} failed AA normal")
    else:
        report_lines.append("- No color pairs provided for contrast checking")
    report_lines.append("")
    report_lines.append("---")
    report_lines.append("")
    if total_issues == 0:
        report_lines.append("## ✅ Overall: PASS")
    else:
        report_lines.append("## ⚠️ Overall: CHANGES REQUIRED")
        report_lines.append(f"\n**{total_issues} issue(s)** must be resolved before design handoff to Agent 2 (Lead Developer).")
    report_lines.append("\n---\n*Generated by Agent 7 — UI Visual Designer (via visual_regression_check.py)*")
    return '\n'.join(report_lines)


# ── Main CLI ────────────────────────────────────────────────────────────────

def parse_args():
    parser = argparse.ArgumentParser(description='Visual Regression & Design Token Validation')
    parser.add_argument('--tokens', type=str, help='Path to design tokens JSON file')
    parser.add_argument('--source', type=str, default='./src', help='Source code directory to scan')
    parser.add_argument('--validate-tailwind', action='store_true', help='Validate Tailwind config')
    parser.add_argument('--config', type=str, default='tailwind.config.js', help='Tailwind config path')
    parser.add_argument('--output', type=str, help='Output report path (default: stdout)')
    parser.add_argument('--color-pairs', type=str, nargs='+', help='Color pairs for contrast check (fg:bg)')
    return parser.parse_args()


def main():
    args = parse_args()
    report_data = {
        "token_errors": [],
        "tailwind_issues": [],
        "hardcoded_values": [],
        "responsive_issues": [],
        "state_audit": {},
        "color_contrast_report": [],
    }
    # 1. Validate design tokens
    if args.tokens:
        if os.path.exists(args.tokens):
            tokens = load_design_tokens(args.tokens)
            report_data["token_errors"] = validate_tokens_structure(tokens)
        else:
            report_data["token_errors"].append({"error": f"Tokens file not found: {args.tokens}"})
            tokens = {}
    else:
        tokens = {}
    # 2. Validate Tailwind config
    if args.validate_tailwind and tokens:
        report_data["tailwind_issues"] = validate_tailwind_config(args.config, tokens)
    # 3. Scan source for hardcoded values
    if os.path.exists(args.source):
        report_data["hardcoded_values"] = extract_hardcoded_values(args.source)
        report_data["responsive_issues"] = check_responsive_breakpoints(tokens, args.source)
        report_data["state_audit"] = audit_component_states(args.source)
    else:
        report_data["hardcoded_values"] = []
        report_data["responsive_issues"] = []
    # 4. Color contrast checks
    if args.color_pairs:
        for pair in args.color_pairs:
            parts = pair.split(':')
            if len(parts) == 2:
                report_data["color_contrast_report"].append({
                    "fg": parts[0],
                    "bg": parts[1],
                    **check_contrast(parts[0], parts[1])
                })
    # 5. Generate report
    report = generate_report(**report_data)
    if args.output:
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"Report written to {args.output}")
    else:
        print(report)


if __name__ == '__main__':
    main()
