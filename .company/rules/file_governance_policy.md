# File Governance Policy

## Hard Limits

| Metric | Minimum | Target | Maximum | Action |
|--------|---------|--------|---------|--------|
| Lines per file | 10 | 400 | **500** | Auto-split at 500 |
| Files per directory | 1 | 10 | 20 | Restructure at 20 |
| Directory nesting depth | 1 | 3 | **5** | Flatten at 5 |
| Function length (lines) | 1 | 20 | 50 | Refactor at 50 |
| Class length (lines) | 1 | 150 | 300 | Split at 300 |

## File Type Specific Rules

### Python (.py)
- One primary class or logical group per file
- `__init__.py` for re-exports only (max 50 lines)
- Imports: standard library → third-party → local (alphabetical within groups)
- Docstrings required for all public functions and classes

### JavaScript/TypeScript (.js, .ts, .jsx, .tsx)
- One component per file (React/Vue/Svelte)
- One utility group per file
- Exports at the bottom of the file
- No inline styles in JSX (use CSS modules or styled-components)

### HTML (.html)
- Max 300 lines per file
- Inline CSS/JS extracted to separate files if exceeding 100 lines combined
- Semantic HTML5 elements required

### CSS/SCSS (.css, .scss)
- One component/page per file
- No nesting beyond 3 levels (SCSS)
- Variables in separate `_variables.css` file

### Markdown (.md)
- One major section per file
- Max 300 lines per file
- Table of contents for files over 100 lines

## Auto-Split Protocol

When a file exceeds 500 lines, the File Warden MUST:

1. **Analyze** the file structure (classes, functions, sections)
2. **Identify** logical split points
3. **Create** new files with appropriate names
4. **Update** imports across the project
5. **Verify** no functionality is broken
6. **Report** the split in the governance audit

### Split Decision Tree

```
File exceeds 500 lines?
├── Is it a Python file?
│   ├── Multiple classes? → One file per class
│   ├── Single large class? → Split into base + mixins
│   └── Utility functions? → Group by domain
├── Is it a JS/TS file?
│   ├── Multiple components? → One file per component
│   ├── Single large component? → Split into container + presentational
│   └── Utility functions? → Group by domain
├── Is it an HTML file?
│   ├── Extract inline CSS → .css file
│   ├── Extract inline JS → .js file
│   └── Split by section → multiple .html partials
└── Is it a Markdown file?
    └── Split by heading level → multiple .md files
```

## Naming Conventions

| Language | Convention | Example |
|----------|-----------|---------|
| Python | snake_case | `user_profile.py` |
| JavaScript | camelCase | `userProfile.js` |
| React Components | PascalCase | `UserProfile.jsx` |
| CSS Classes | kebab-case | `.user-profile-card` |
| HTML Files | kebab-case | `user-profile.html` |
| Markdown | kebab-case | `user-guide.md` |
| Directories | kebab-case | `user-profiles/` |
| Tests | `test_<name>.py` | `test_user_profile.py` |

## Banned Directory Names

```
misc, other, random, temp, tmp, old, backup, archive, 
deprecated, unused, test_data, sample, examples, playground
```

## Required Files Per Directory

| Directory | Required Files |
|-----------|---------------|
| `src/` | `__init__.py` (Python), `main.py` or `index.js` |
| `tests/` | `__init__.py` (Python), `conftest.py` (Python) |
| `docs/` | `README.md`, `index.md` |
| Root | `README.md`, `LICENSE`, `.gitignore` |

## Enforcement

- **Pre-commit hook**: Check file sizes before every commit
- **CI gate**: Block PR if any file exceeds 500 lines
- **Weekly audit**: Full governance scan every Monday
- **Monthly review**: Governance policy review and update
