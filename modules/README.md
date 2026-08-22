# NIRANTAR modules

Canonical map is `docs/architecture/system.md`. Each numbered module lives here.

| Folder | Module | Job |
|---|---|---|
| `m01_citizen_ux` | 1 Citizen UX | Intent, guidance, accessibility |
| `m02_workflow_engine` | 2 Workflow | Intent → actions → tools |
| `m03_portalpulse` | 3 PortalPulse | Predict |
| `m04_kavach` | 4 Kavach | Detect |
| `m05_dhara` | 5 Dhara | Decide |
| `m06_prayog` | 6 Prayog | 1K → 5K → 10K VUs + chaos |
| `m07_command_center` | 7 Command Center | Operator control loop |
| `m08_cairo_trust` | 8 Cairo Trust | **Drop Module 8 files here** |
| `m09_evaluation` | 9 Evaluation | Honest measurement |
| `m10_safety` | 10 Safety / Honesty | Bounds, no live gov data |

Root paths such as `security/`, `orchestrator/`, `simulation/`, `ml/`, `cairo/` are **shims** (symlinks) so existing imports keep working.

Shared (not a module): `contracts/`, `m0_digital_twin/`, `frontend/src` shell (`App`, `Navbar`).
