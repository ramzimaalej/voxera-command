# Voxera — workspace setup

Three sibling repos under one folder. `voxera-command` (this repo) is the source of truth.

```
voxera/
├── voxera-command/   # strategy, decisions, babysitter processes  (this repo)
├── voxera-website/
└── voxera-crm/
```

## One-time setup
```bash
# 1. clone all three as siblings
git clone <command-url> voxera-command
git clone <website-url> voxera-website
git clone <crm-url>     voxera-crm

# 2. install babysitter (Claude Code plugin)
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
# restart Claude Code, then verify:  /skills   (look for "babysit")

# 3. profile + per-project setup (run project-install inside EACH repo)
/babysitter:user-install
cd voxera-command && /babysitter:project-install
cd ../voxera-website && /babysitter:project-install   # then merge .gitignore.babysitter
cd ../voxera-crm     && /babysitter:project-install   # then merge .gitignore.babysitter
```

During each `project-install`, define the repo's real quality-gate commands
(lint/test/build) so the `verify` step in the processes actually enforces them.

## Daily loops
| You want to… | From | Command |
|---|---|---|
| Evolve vision/brand/roadmap | `voxera-command` | `/babysitter:call iterate the vision: <change>` |
| Build a CRM feature | `voxera-crm` | `/babysitter:call --process ../voxera-command/.a5c/processes/implement-feature.js#process -- spec ../voxera-command/docs/product/features/FEAT-xxx.md` |
| Fix a website bug | `voxera-website` | `/babysitter:call --process ../voxera-command/.a5c/processes/fix-bug.js#process -- spec ../voxera-command/docs/product/bugs/BUG-xxx.md` |
| Plan only, no edits | any | `/babysitter:plan ...` |
| Resume / inspect | any | `/babysitter:resume`, `/babysitter:doctor`, `/babysitter:observe` |

## Versioning docs
- One canonical file per doc + frontmatter (`version`, `status`, `updated`) + `## Changelog`.
- Bump version on substantive edits (the iterate process does this for you).
- Freeze milestones: `git tag -a vision-v2 -m "post-launch positioning"`.

## Two decision layers
- **ADRs** (`decisions/`) — strategic "why". You/processes write these.
- **Babysitter journal** (`.a5c/runs/`) — execution "what", per run, immutable, gitignored.

## ⚠️ Process API note
`.a5c/processes/*.js` use babysitter's documented primitives (`process(inputs, ctx)`,
`ctx.task`, `ctx.breakpoint`, score gates). The exact task-spec field names can differ
by version — after `project-install`, compare with babysitter's generated processes /
its "Process Definitions" doc and adjust the descriptors if needed.
