# product-refactor-roadmap — flow diagram

```mermaid
flowchart TD
    subgraph DISCOVER["Discover (target vs. current)"]
        P1["P1 · Define target product<br/>vision + strategy + demo App.jsx<br/>→ capability inventory"]
        P2["P2 · Map current CRM<br/>schema · modules · frontend · AI layer<br/>+ engineering-os phases & tech-debt"]
        P1 --> P2
    end

    P2 --> BP1{{"BREAKPOINT 1<br/>Approve target ↔ current framing"}}

    BP1 -->|approved| P3["P3 · Gap analysis<br/>target − current = categorized,<br/>sized, risk-tagged GAP backlog"]
    BP1 -->|rejected| P1

    subgraph GAPLOOP["Gap quality gate (≤2 refines)"]
        P3 --> P3R["P3b · Adversarial review<br/>completeness vs whole demo +<br/>strategy-fit (no invented scope)"]
        P3R -->|"score < 85"| P3F["Refine backlog"]
        P3F --> P3R
    end

    P3R -->|"score ≥ 85"| BP2{{"BREAKPOINT 2<br/>Approve gap backlog"}}

    BP2 -->|approved| P4["P4 · RICE prioritization<br/>Reach×Impact×Confidence÷Effort<br/>vs two motions + bootstrapped + moat"]
    BP2 -->|rejected| P3

    P4 --> P5["P5 · Shape-Up sequencing<br/>RICE rank → appetite BETS,<br/>dependency-ordered, reuse S1–S9 phases<br/>→ Now / Next / Later"]

    P5 --> BP3{{"BREAKPOINT 3<br/>Approve bet sequencing (betting table)<br/>— the load-bearing architecture decision"}}

    BP3 -->|approved| P6A["P6 · Draft gap-analysis dossier"]
    BP3 -->|rejected| P5

    P6A --> P6B["P6 · Draft rewritten roadmap.md<br/>(bets across Now/Next/Later,<br/>two-motion structure preserved)"]

    subgraph DOCLOOP["Docs quality gate (≤2 refines)"]
        P6B --> P6R["P6b · Consistency + brand-voice<br/>+ brownfield feasibility review"]
        P6R -->|"score < 85"| P6F["Refine drafts"]
        P6F --> P6R
    end

    P6R -->|"score ≥ 85"| BP4{{"BREAKPOINT 4<br/>Approve & apply roadmap + dossier"}}

    BP4 -->|"approved (not dry-run)"| P7["P7 · Apply both docs<br/>frontmatter bump + changelog"]
    BP4 -->|rejected| P6B
    BP4 -->|dry-run| END_DRY([return: applied=false])

    P7 --> P8["P8 · Decision check<br/>detect 0–3 ADR-worthy build-order bets<br/>+ owning repo (federation rule)"]

    P8 -->|"decisions found"| BP5{{"BREAKPOINT 5<br/>Record ADR(s)?"}}
    P8 -->|none| END([return: roadmap + dossier])

    BP5 -->|approved| P8W["P8 · Write federated ADR(s)<br/>global numbering + registry + backlink"]
    BP5 -->|rejected| END
    P8W --> END

    classDef gate fill:#fff3cd,stroke:#e8a33b,color:#0a0a0c;
    classDef task fill:#eef4ff,stroke:#4a78c8,color:#0a0a0c;
    classDef done fill:#e6f4ea,stroke:#0a4f2a,color:#0a0a0c;
    class BP1,BP2,BP3,BP4,BP5 gate;
    class P1,P2,P3,P3R,P3F,P4,P5,P6A,P6B,P6R,P6F,P7,P8,P8W task;
    class END,END_DRY done;
```

## Legend

- **Rounded amber** = human breakpoints (5 total: 3 phase gates + 1 final apply gate + 1 ADR gate).
- **Blue** = agent tasks (`general-purpose`).
- **Two refine loops** (gap backlog, drafts) each capped at 2 iterations, gated at score ≥ 85.
- Every task writes to `artifacts/<effectId>-*.md`; the canonical docs are touched only after **Breakpoint 4**.
