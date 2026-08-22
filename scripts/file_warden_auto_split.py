#!/usr/bin/env python3
"""File Warden Auto-Split Tool — automatically splits files exceeding 500 lines.

Usage:
    python file_warden_auto_split.py <filepath>
    python file_warden_auto_split.py --scan <directory>
    python file_warden_auto_split.py --audit <directory> --report
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Any


# ── Configuration ─────────────────────────────────────────────────────

MAX_LINES = 500
WARN_LINES = 450
MIN_LINES = 10
TARGET_LINES = 400

SPLIT_STRATEGIES = {
    ".py": "python",
    ".js": "javascript",
    ".ts": "typescript",
    ".jsx": "react",
    ".tsx": "react",
    ".html": "html",
    ".css": "css",
    ".md": "markdown",
}


# ── File Analysis ─────────────────────────────────────────────────────

def analyze_file(filepath: str) -> dict[str, Any]:
    """Analyze a file for structure and size metrics.
    
    Returns dict with line count, structure info, and split recommendations.
    """
    path = Path(filepath)
    if not path.exists():
        return {"error": f"File not found: {filepath}"}
    
    content = path.read_text(encoding="utf-8", errors="replace")
    lines = content.split("\n")
    line_count = len(lines)
    extension = path.suffix.lower()
    
    result = {
        "filepath": str(path),
        "filename": path.name,
        "extension": extension,
        "line_count": line_count,
        "status": "OK" if line_count <= MAX_LINES else "OVER_LIMIT",
        "strategy": SPLIT_STRATEGIES.get(extension, "unknown"),
    }
    
    if line_count > MAX_LINES:
        result["split_recommendations"] = recommend_split(content, path, extension)
    
    return result


def recommend_split(content: str, path: Path, extension: str) -> list[dict[str, Any]]:
    """Recommend how to split a file based on its type and structure."""
    recommendations = []
    lines = content.split("\n")
    
    if extension == ".py":
        recommendations = _recommend_python_split(lines, path)
    elif extension in (".js", ".ts", ".jsx", ".tsx"):
        recommendations = _recommend_js_split(lines, path, extension)
    elif extension == ".html":
        recommendations = _recommend_html_split(lines, path)
    elif extension == ".css":
        recommendations = _recommend_css_split(lines, path)
    elif extension == ".md":
        recommendations = _recommend_markdown_split(lines, path)
    
    return recommendations


def _recommend_python_split(lines: list[str], path: Path) -> list[dict[str, Any]]:
    """Recommend splits for Python files based on class/function boundaries."""
    recommendations = []
    current_class = None
    class_start = None
    class_lines = []
    
    for i, line in enumerate(lines):
        class_match = re.match(r"^class\s+(\w+)", line)
        def_match = re.match(r"^def\s+(\w+)", line)
        
        if class_match:
            # Save previous class
            if current_class and len(class_lines) > 100:
                recommendations.append({
                    "type": "class",
                    "name": current_class,
                    "start_line": class_start + 1,
                    "end_line": i,
                    "line_count": len(class_lines),
                    "suggested_file": f"{path.stem}_{current_class.lower()}{path.suffix}",
                })
            current_class = class_match.group(1)
            class_start = i
            class_lines = [line]
        elif class_match is None:
            if class_start is not None:
                class_lines.append(line)
    
    # Save last class
    if current_class and class_lines and len(class_lines) > 100:
        recommendations.append({
            "type": "class",
            "name": current_class,
            "start_line": class_start + 1,
            "end_line": len(lines),
            "line_count": len(class_lines),
            "suggested_file": f"{path.stem}_{current_class.lower()}{path.suffix}",
        })
    
    # If no clear class boundaries, suggest splitting by line count
    if not recommendations:
        num_splits = (len(lines) // TARGET_LINES) + 1
        lines_per_split = len(lines) // num_splits
        for i in range(num_splits):
            start = i * lines_per_split
            end = start + lines_per_split if i < num_splits - 1 else len(lines)
            recommendations.append({
                "type": "segment",
                "name": f"part_{i + 1}",
                "start_line": start + 1,
                "end_line": end,
                "line_count": end - start,
                "suggested_file": f"{path.stem}_part_{i + 1}{path.suffix}",
            })
    
    return recommendations


def _recommend_js_split(lines: list[str], path: Path, extension: str) -> list[dict[str, Any]]:
    """Recommend splits for JS/TS files based on component/function boundaries."""
    recommendations = []
    exports = []
    
    for i, line in enumerate(lines):
        # Detect React components (function declarations starting with capital)
        func_match = re.match(r"^(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w*)", line)
        const_match = re.match(r"^(?:export\s+)?(?:default\s+)?const\s+([A-Z]\w*)", line)
        
        if func_match:
            exports.append({
                "name": func_match.group(1),
                "type": "function",
                "line": i + 1,
            })
        elif const_match:
            exports.append({
                "name": const_match.group(1),
                "type": "const",
                "line": i + 1,
            })
    
    if exports:
        for exp in exports:
            recommendations.append({
                "type": "component",
                "name": exp["name"],
                "start_line": exp["line"],
                "end_line": exp["line"] + 100,
                "line_count": None,
                "suggested_file": f"{exp['name']}{extension}",
            })
    
    return recommendations


def _recommend_html_split(lines: list[str], path: Path) -> list[dict[str, Any]]:
    """Recommend splits for HTML files — extract inline CSS/JS."""
    recommendations = []
    
    # Check for inline styles
    style_start = None
    for i, line in enumerate(lines):
        if "<style" in line.lower() and style_start is None:
            style_start = i
        elif "</style>" in line.lower() and style_start is not None:
            style_lines = i - style_start + 1
            if style_lines > 50:
                recommendations.append({
                    "type": "inline_css",
                    "name": "styles",
                    "start_line": style_start + 1,
                    "end_line": i + 1,
                    "line_count": style_lines,
                    "suggested_file": f"{path.stem}.css",
                })
            style_start = None
    
    # Check for inline scripts
    script_start = None
    for i, line in enumerate(lines):
        if "<script" in line.lower() and "src=" not in line.lower() and script_start is None:
            script_start = i
        elif "</script>" in line.lower() and script_start is not None:
            script_lines = i - script_start + 1
            if script_lines > 50:
                recommendations.append({
                    "type": "inline_js",
                    "name": "scripts",
                    "start_line": script_start + 1,
                    "end_line": i + 1,
                    "line_count": script_lines,
                    "suggested_file": f"{path.stem}.js",
                })
            script_start = None
    
    return recommendations


def _recommend_css_split(lines: list[str], path: Path) -> list[dict[str, Any]]:
    """Recommend splits for CSS files by component/media query."""
    recommendations = []
    
    # Try to split by CSS comment sections
    section_start = None
    section_name = None
    
    for i, line in enumerate(lines):
        comment_match = re.match(r"/\*\s*(.+?)\s*\*/", line)
        media_match = re.match(r"@media\s+", line)
        
        if comment_match:
            if section_name and section_start and (i - section_start) > 100:
                recommendations.append({
                    "type": "section",
                    "name": section_name,
                    "start_line": section_start + 1,
                    "end_line": i,
                    "line_count": i - section_start,
                    "suggested_file": f"{path.stem}_{section_name.lower().replace(' ', '_')}{path.suffix}",
                })
            section_start = i
            section_name = comment_match.group(1).strip()
        
        if media_match and not section_name:
            section_name = f"media_{len(recommendations) + 1}"
    
    if not recommendations:
        # Split by line count
        num_splits = (len(lines) // TARGET_LINES) + 1
        lines_per_split = len(lines) // num_splits
        for i in range(num_splits):
            start = i * lines_per_split
            end = start + lines_per_split if i < num_splits - 1 else len(lines)
            recommendations.append({
                "type": "segment",
                "name": f"part_{i + 1}",
                "start_line": start + 1,
                "end_line": end,
                "line_count": end - start,
                "suggested_file": f"{path.stem}_part_{i + 1}{path.suffix}",
            })
    
    return recommendations


def _recommend_markdown_split(lines: list[str], path: Path) -> list[dict[str, Any]]:
    """Recommend splits for Markdown files by section heading."""
    recommendations = []
    section_start = None
    section_name = None
    section_level = None
    
    for i, line in enumerate(lines):
        heading_match = re.match(r"^(#{1,3})\s+(.+)$", line)
        
        if heading_match:
            level = len(heading_match.group(1))
            name = heading_match.group(2).strip()
            
            if section_name and section_start and (i - section_start) > 100:
                recommendations.append({
                    "type": "section",
                    "name": section_name,
                    "start_line": section_start + 1,
                    "end_line": i,
                    "line_count": i - section_start,
                    "suggested_file": f"{path.stem}_{section_name.lower().replace(' ', '_')[:30]}.md",
                })
            
            section_start = i
            section_name = name
            section_level = level
    
    if not recommendations:
        # Split by line count
        num_splits = (len(lines) // TARGET_LINES) + 1
        lines_per_split = len(lines) // num_splits
        for i in range(num_splits):
            start = i * lines_per_split
            end = start + lines_per_split if i < num_splits - 1 else len(lines)
            recommendations.append({
                "type": "segment",
                "name": f"part_{i + 1}",
                "start_line": start + 1,
                "end_line": end,
                "line_count": end - start,
                "suggested_file": f"{path.stem}_part_{i + 1}.md",
            })
    
    return recommendations


# ── Reporting ─────────────────────────────────────────────────────────

def generate_audit_report(directory: str) -> dict[str, Any]:
    """Generate a comprehensive governance audit report for a directory."""
    path = Path(directory)
    if not path.exists():
        return {"error": f"Directory not found: {directory}"}
    
    results = []
    total_files = 0
    over_limit = 0
    warn_limit = 0
    
    for ext in SPLIT_STRATEGIES:
        for filepath in path.rglob(f"*{ext}"):
            if any(p.startswith(".") for p in filepath.parts):
                continue
            if "node_modules" in filepath.parts or "__pycache__" in filepath.parts:
                continue
            result = analyze_file(str(filepath))
            results.append(result)
            total_files += 1
            if result.get("status") == "OVER_LIMIT":
                over_limit += 1
            elif result.get("line_count", 0) > WARN_LINES:
                warn_limit += 1
    
    score = 10.0
    if total_files > 0:
        score -= (over_limit / total_files) * 5
        score -= (warn_limit / total_files) * 2
        score = max(0, round(score, 1))
    
    return {
        "directory": directory,
        "total_files": total_files,
        "over_limit": over_limit,
        "warning": warn_limit,
        "governance_score": score,
        "files": results,
    }


def print_audit_report(report: dict[str, Any]) -> None:
    """Print a formatted audit report to stdout."""
    print(f"\n{'='*60}")
    print(f"  File Warden Governance Audit Report")
    print(f"{'='*60}")
    print(f"  Directory: {report.get('directory', 'N/A')}")
    print(f"  Total files: {report.get('total_files', 0)}")
    print(f"  Over limit (>500 lines): {report.get('over_limit', 0)}")
    print(f"  Warning (>450 lines): {report.get('warning', 0)}")
    print(f"  Governance Score: {report.get('governance_score', 0)}/10")
    print(f"{'='*60}")
    
    for file_result in report.get("files", []):
        status_icon = "✅" if file_result.get("status") == "OK" else "❌"
        print(f"\n  {status_icon} {file_result['filepath']}")
        print(f"     Lines: {file_result.get('line_count', 0)}")
        print(f"     Status: {file_result.get('status', 'UNKNOWN')}")
        
        splits = file_result.get("split_recommendations", [])
        if splits:
            print(f"     Split Recommendations:")
            for split in splits[:3]:
                print(f"       - {split['suggested_file']} ({split.get('type', 'unknown')})")
    
    print(f"\n{'='*60}")
    if report.get("over_limit", 0) > 0:
        print(f"  ❌ ACTION REQUIRED: Split {report['over_limit']} bloated file(s)")
    else:
        print(f"  ✅ All files within 500-line limit — GOVERNANCE PASSED")
    print(f"{'='*60}\n")


# ── CLI Entry Point ───────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="File Warden — Auto-Split and Governance Audit Tool"
    )
    parser.add_argument("target", nargs="?", help="File or directory to analyze")
    parser.add_argument("--scan", help="Scan a directory for oversized files")
    parser.add_argument("--audit", help="Generate full governance audit report")
    parser.add_argument("--report", action="store_true", help="Print detailed report")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be split without making changes")
    
    args = parser.parse_args()
    
    if args.audit:
        report = generate_audit_report(args.audit)
        print_audit_report(report)
    elif args.scan:
        path = Path(args.scan)
        over_limit = []
        for ext in SPLIT_STRATEGIES:
            for filepath in path.rglob(f"*{ext}"):
                result = analyze_file(str(filepath))
                if result.get("status") == "OVER_LIMIT":
                    over_limit.append(result)
        
        print(f"\nFound {len(over_limit)} file(s) over {MAX_LINES} lines:")
        for r in over_limit:
            print(f"  - {r['filepath']} ({r['line_count']} lines)")
            for split in r.get("split_recommendations", [])[:2]:
                print(f"    → Split into: {split['suggested_file']}")
    elif args.target:
        path = Path(args.target)
        if path.is_file():
            result = analyze_file(str(path))
            print(f"\nAnalysis of {result['filepath']}:")
            print(f"  Lines: {result.get('line_count', 0)}")
            print(f"  Status: {result.get('status', 'UNKNOWN')}")
            for split in result.get("split_recommendations", []):
                print(f"  → Split: {split['suggested_file']} ({split.get('type', '')})")
        else:
            report = generate_audit_report(str(path))
            print_audit_report(report)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
