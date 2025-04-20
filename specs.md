# v0 → Rails Converter — Developer Specification

## 1 Overview
Convert React/JSX + Tailwind UI code (typically produced by **Vercel v0**) into Rails‑native **ViewComponent** classes and **ERB** templates, preserving visual fidelity while minimising JavaScript footprint (Stimulus‑only where unavoidable). A single command should take a directory of `*.jsx/tsx` files and emit ready‑to‑render Rails components.

---
## 2 Goals & Non‑Goals
| | **In Scope** | **Out of Scope (v1)** |
|---|---|---|
| **G‑1** | Accurate JSX → HTML/Tailwind transformation | Automatic i18n extraction |
| **G‑2** | One‑to‑one React component → ViewComponent mapping | Complex React state management conversion |
| **G‑3** | Minimal vanilla‑JS hooks via Stimulus | Conversion of external React libraries (charting, maps) |
| **G‑4** | Idempotent regeneration & diff support | Slim/HAML output |


---
## 3 Architecture Choices
```
 +-------------+        +-----------------+       +-------------------+
 | CLI (Node)  |----+-->| Transformer     |------>| Rails Generator   |
 +-------------+    |   |  Pipeline       |       | (.rb / .erb / js) |
                    |   +-----------------+       +-------------------+
                    |         ^   |
                    |         |   |  <== Babel AST + heuristic passes
 +-------------+    |         |   |
 | IDE Extension|----+---------+---+
 +-------------+
```
* **Language**: Node 20 for CLI & AST transforms (Babel/SWC). Ruby 3.3 for generators.
* **Distribution**: Dual‑package — NPM (`v0‑rails`) and Ruby gem (`v0_rails`).
* **Intermediate Representation (IR)**: JSON schema describing component tree after JSX parsing (props, children, events). Enables language‑agnostic analysis and unit testing.
* **Plugin System**: Each output dialect (ERB, Slim, etc.) registers a `Renderer` class—future extensibility.

---
## 4 Directory Layout (installed in Rails app)
```
my_app/
 ├── app/components/
 │    └── ui/
 │        ├── card_component.rb
 │        ├── card_component.html.erb
 │        └── ...
 ├── app/javascript/controllers/
 │    └── card_controller.js
 ├── spec/components/
 │    └── ui/card_component_spec.rb
 └── config/
      └── tailwind.config.js (patched if needed)
```

---
## 5 Data Handling Details
### 5.1 Input
* **Supported file types**: `*.jsx`, `*.tsx`.
* **Assumptions**: ES modules, functional components, Tailwind classes.

### 5.2 Transforms
1. **Parse** with `@babel/parser` using plugins `jsx`, `typescript`, `classProperties`.
2. **Analyse** tree to extract:
   * Component name
   * Prop list & default values
   * Static v. dynamic JSX; warn on hooks/state.
3. **Generate IR** (JSON) per component.
4. **Renderers** consume IR to output:
   * **Ruby class** inheriting `ViewComponent::Base`.
   * **ERB template** — props become `@` ivars; `<slot>` mapped to `content` or named slots via `with_slot`.
   * **Stimulus controller** when event handlers detected (`onClick`, etc.).
5. **Post‑process**
   * Merge/append `tailwind.config.js` safelist.
   * Produce diff patch if files exist and `--update` flag set.

### 5.3 Output Conventions
* File names snake‑cased: `CardComponent` → `card_component.*`.
* Components nested under namespace folder (default `ui/`).
* Tests use `ViewComponent::TestCase` snapshots.

---
## 6 Error Handling Strategy
| Category | Detection | Response |
|----------|-----------|----------|
| **ParserError** (invalid JSX) | Babel throws | Exit code **10**; display line/col; skip file if `--continue` |
| **UnsupportedSyntax** (hooks, portals) | Heuristic scan | Warn; generate TODO comments; exit code **11** if blocking |
| **NameCollision** (duplicate components) | Check dest path | Add numeric suffix unless `--abort-on-collision` |
| **FileWriteConflict** (local edits) | Git diff detection | Write `.conflict` file + hint to merge; exit **12** |
| **TelemetryFailure** | Network error | Silent fail; continue |

_All fatal exits use distinct non‑zero codes to aid CI pipelines._

---
## 7 CLI Interface
```
Usage: v0-rails <input-glob> [options]

Options
  -d, --dest <path>          Destination root (default: app/components)
  -n, --namespace <ns>       Ruby module namespace (default: Ui)
  -s, --stimulus             Generate Stimulus controllers when needed
  -u, --update               Overwrite existing components diff‑aware
  --ir <file>                Dump intermediate JSON for debugging
  --strict                   Fail on any unsupported syntax
  --no-tests                 Skip test generation
  --dry-run                  Output to stdout only
  -v, --verbose              Verbose logging
  -h, --help                 Show help
```
**Exit Codes**
* `0` Success
* `1` General error
* `10‑19` Specific conversion errors (see §6)

---
## 8 IDE Plug‑in (Cursor)
* Command palette entries:
  * **“Convert JSX → ViewComponent”** — wraps CLI.
  * **“Regenerate Components”** — runs CLI with `--update`.
  * **“Show Rendered Preview”** — open Rails server on temp port + LiveReload.
* Inline annotations for TODO comments from converter.

---
## 9 Testing Plan
### 9.1 JavaScript Side
* **Unit tests** – Jest on every transform util function with hand‑rolled AST fixtures.
* **Golden tests** – Convert sample JSX files & compare IR snapshots.

### 9.2 Ruby Side
* **ViewComponent::TestCase** per component; snapshot (`render_inline` + `assert_matches_snapshot`).
* **System specs** – Capybara renders a page including all converted components; Percy visual diff (≥ 95 % match).

### 9.3 CLI Integration
* Run converter on `examples/` corpus; assert exit code 0 and no `TODO‑BLOCKER` markers.
* Benchmark script ensures ≤ 1 s per 1 kLOC; fails CI if slower by >20 %.

### 9.4 Security
* Static analysis with ESLint security plugin & Brakeman on generated Rails code.

---
## 10 CI/CD Pipeline
* **GitHub Actions**
  * _lint_  → ESLint + RuboCop
  * _unit_  → JS + Ruby tests
  * _integration_  → CLI corpus run
  * _visual_  → Percy snapshots (pull‑request labelled `ui`)
  * _publish_ → on tag push: `npm publish` + `gem push`

---
## 11 Dependencies
| Tool | Version | Purpose |
|------|---------|---------|
| Node | ≥ 20 | CLI runtime |
| npm  | ≥ 10 | package mgr |
| Babel | ^7.24 | JSX/TSX parsing |
| Ruby | ≥ 3.3 | Rails plugin |
| Rails | 7.1 + | target framework |
| ViewComponent | ≥ 3.9 | component base |
| tailwindcss‑rails | ≥ 1.3 | Tailwind in Rails |
| Stimulus | ≥ 3.2 | JS controllers |
| Jest + RSpec | latest | testing |

---
## 12 Security Considerations
1. **Sandbox parsing** – never `eval` JSX; rely on Babel AST.
2. **Path traversal** – sanitise output filenames.
3. **Telemetry** – opt‑in; no source code sent.
4. **License** – MIT for converter; user‑generated code remains unencumbered.

---
## 13 Future Work
* Rich LLM fallback for unsupported syntax blocks (OpenAI function‑calling API) - When the converter encounters React/JSX code patterns it doesn't know how to handle, it can use OpenAI's API to intelligently convert that code to Rails/ViewComponent equivalents.
* Web UI for drag‑and‑drop JSX → Rails conversion.

---
## 14 Reference URLs
* https://vercel.com/v0
* https://github.com/github/view_component
* https://babel.dev/docs/
* https://stimulus.hotwired.dev/
* https://tailwindcss.com/
* https://percy.io/

---
_End of specification._

