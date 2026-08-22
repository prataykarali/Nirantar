#!/usr/bin/env python3
"""
UX Quality Evaluation Script

Automated UX quality evaluation covering WCAG compliance checks, state coverage validation,
journey completeness, and interaction consistency. Used by Agent 8 (UX Researcher) and
Agent 4 (QA Engineer) during Stage 5.5 (Visual QA) and Stage 5 (Testing).

Usage:
    python ux_quality_eval.py --source ./src --output ux_report.md
    python ux_quality_eval.py --aria-audit --source ./src
    python ux_quality_eval.py --state-coverage --components components.json
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


# ── WCAG ARIA Audit ─────────────────────────────────────────────────────────

ARIA_REQUIRED_ATTRIBUTES: Dict[str, List[str]] = {
    'button': ['role', 'aria-label'],
    'link': ['role', 'aria-label'],
    'img': ['alt'],
    'input': ['aria-label', 'aria-describedby'],
    'select': ['aria-label'],
    'textarea': ['aria-label'],
    'dialog': ['role', 'aria-modal', 'aria-label'],
    'alert': ['role', 'aria-live'],
    'progressbar': ['role', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
    'tabpanel': ['role', 'aria-labelledby'],
    'tooltip': ['role', 'aria-label'],
}

ARIA_BANNED_PATTERNS: List[str] = [
    r'aria-hidden="true"\s*on\s*interactive\s*element',
    r'role="alert"\s*without\s*aria-live',
    r'tabindex="[^0"]"\s*on\s*non-interactive',
    r'onclick="[^"]*"\s*without\s*role',
    r'keyboard\s*trapped',
]


def audit_aria_compliance(source_dir: str) -> Dict[str, List[Dict[str, Any]]]:
    """Audit ARIA attribute compliance in HTML/JSX files."""
    issues: Dict[str, List[Dict[str, Any]]] = {'missing': [], 'banned': []}
    source_path = Path(source_dir)

    for ext in ['*.html', '*.jsx', '*.tsx', '*.js']:
        for file_path in source_path.rglob(ext):
            if 'node_modules' in str(file_path) or '.git' in str(file_path):
                continue
            try:
                content = file_path.read_text()
                relative = str(file_path.relative_to(source_path))

                # Check for interactive elements missing required ARIA
                for element, required_attrs in ARIA_REQUIRED_ATTRIBUTES.items():
                    pattern = re.compile(rf'<{element}[^>]*>', re.IGNORECASE)
                    for match in pattern.finditer(content):
                        element_html = match.group(0)
                        for attr in required_attrs:
                            if attr not in element_html and attr not in content:
                                issues['missing'].append({
                                    'file': relative,
                                    'line': content[:match.start()].count('\n') + 1,
                                    'element': element,
                                    'missing_attr': attr,
                                    'html': element_html[:80],
                                })

                # Check for banned ARIA patterns
                for pattern_str in ARIA_BANNED_PATTERNS:
                    for match in re.finditer(pattern_str, content, re.IGNORECASE):
                        issues['banned'].append({
                            'file': relative,
                            'line': content[:match.start()].count('\n') + 1,
                            'pattern': pattern_str,
                            'matched': match.group(0)[:80],
                        })
            except Exception:
                pass

    return issues


# ── Keyboard Navigation Audit ───────────────────────────────────────────────

FOCUSABLE_SELECTORS = [
    r'<a\s[^>]*href=',
    r'<button[^>]*>',
    r'<input[^>]*>',
    r'<select[^>]*>',
    r'<textarea[^>]*>',
    r'tabindex=["\']0["\']',
    r'contenteditable',
]


def audit_keyboard_navigation(source_dir: str) -> Dict[str, Any]:
    """Audit keyboard navigation accessibility."""
    source_path = Path(source_dir)
    focusable_elements = 0
    elements_without_focus = 0
    tabindex_issues: List[str] = []

    for ext in ['*.html', '*.jsx', '*.tsx']:
        for file_path in source_path.rglob(ext):
            if 'node_modules' in str(file_path) or '.git' in str(file_path):
                continue
            try:
                content = file_path.read_text()
                relative = str(file_path.relative_to(source_path))

                # Count focusable elements
                for selector in FOCUSABLE_SELECTORS:
                    matches = re.findall(selector, content, re.IGNORECASE)
                    focusable_elements += len(matches)

                # Check for onclick without keyboard handling
                onclick_matches = re.finditer(
                    r'onclick=(["\'])([^"\']+)\1', content, re.IGNORECASE
                )
                for match in onclick_matches:
                    onclick_line = content[:match.start()].count('\n') + 1
                    # Check if onkeydown/onkeypress exists nearby
                    nearby = content[max(0, match.start() - 200):match.end() + 200]
                    if 'onkeydown' not in nearby and 'onkeypress' not in nearby:
                        # Check if it's on a button or link (already keyboard accessible)
                        element_context = content[max(0, match.start() - 100):match.start()]
                        if 'button' not in element_context and 'a ' not in element_context:
                            tabindex_issues.append(
                                f"{relative}:{onclick_line} — onclick without keyboard handler"
                            )

                # Check for positive tabindex values
                positive_tabindex = re.finditer(r'tabindex=["\'](\d+)["\']', content)
                for match in positive_tabindex:
                    val = int(match.group(1))
                    if val > 0:
                        line = content[:match.start()].count('\n') + 1
                        tabindex_issues.append(
                            f"{relative}:{line} — tabindex={val} > 0 (should be 0 or -1)"
                        )
            except Exception:
                pass

    return {
        'focusable_elements': focusable_elements,
        'total_issues': len(tabindex_issues),
        'tabindex_issues': tabindex_issues,
    }


# ── Color Contrast Audit ────────────────────────────────────────────────────

HEX_COLOR = re.compile(r'#[0-9a-fA-F]{3,8}')
RGB_COLOR = re.compile(r'rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)')


def extract_color_pairs_from_css(source_dir: str) -> List[Dict[str, str]]:
    """Extract foreground/background color pairs from CSS files."""
    pairs: List[Dict[str, str]] = []
    source_path = Path(source_dir)

    for file_path in source_path.rglob('*.css'):
        if 'node_modules' in str(file_path) or '.git' in str(file_path):
            continue
        try:
            content = file_path.read_text()
            current_bg: Optional[str] = None
            current_color: Optional[str] = None

            for line in content.split('\n'):
                bg_match = re.search(r'background(?:-color)?:\s*(#[0-9a-fA-F]{3,8})', line)
                if bg_match:
                    current_bg = bg_match.group(1)
                color_match = re.search(r'(?<!background-)color:\s*(#[0-9a-fA-F]{3,8})', line)
                if color_match:
                    current_color = color_match.group(1)
                if current_bg and current_color:
                    pairs.append({'foreground': current_color, 'background': current_bg})
                    current_bg = None
                    current_color = None
        except Exception:
            pass

    return pairs


def check_contrast(foreground_hex: str, background_hex: str) -> Dict[str, Any]:
    """Calculate WCAG contrast ratio between two hex colors."""
    def hex_to_rgb(h):
        h = h.lstrip('#')
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    def relative_luminance(rgb):
        vals = []
        for c in rgb:
            s = c / 255.0
            vals.append(s / 12.92 if s <= 0.03928 else ((s + 0.055) / 1.055) ** 2.4)
        return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2]

    fg_rgb = hex_to_rgb(foreground_hex)
    bg_rgb = hex_to_rgb(background_hex)
