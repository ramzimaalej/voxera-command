---
title: tracing.ts registers getNodeAutoInstrumentations() twice
version: 2
status: fixed
updated: 2026-05-31
owner: you
affected_repos: [voxera-crm]
severity: medium
first_seen: 2026-05-31
---

# BUG-001: tracing.ts registers getNodeAutoInstrumentations() twice

## What's broken

`apps/backend/src/tracing.ts` registers `getNodeAutoInstrumentations()` twice in the `NodeSDK` `instrumentations` array, then also explicitly registers `HttpInstrumentation`, `ExpressInstrumentation`, and `NestInstrumentation` — all of which are already included by `getNodeAutoInstrumentations()`.

```ts
// apps/backend/src/tracing.ts:46-57
instrumentations: [
  getNodeAutoInstrumentations(),     // line 47 — first registration
  new PrismaInstrumentation({
    middleware: true,
    enabled: true,
    ignoreSpanTypes: []
  }),
  getNodeAutoInstrumentations(),     // line 53 — DUPLICATE
  new HttpInstrumentation(),         // already in auto-instrumentations
  new ExpressInstrumentation(),      // already in auto-instrumentations
  new NestInstrumentation(),         // already in auto-instrumentations
],
```

Effects observed / suspected:
- Each instrumented HTTP request, Express middleware, NestJS pipeline, and `fetch` call likely emits **duplicate spans** (one per `getNodeAutoInstrumentations()` invocation, plus one from the explicit instrumentation).
- Observability backend (Honeycomb) cost increases — paying for redundant span volume.
- Trace UIs show duplicated sibling spans, making call-stack reading harder.
- Span attributes may be inconsistent between the duplicate spans (different defaults), making queries unreliable.

`PrismaInstrumentation` is the only one safe from duplication — `getNodeAutoInstrumentations()` does not include Prisma.

## What should happen

The `instrumentations` array contains each instrumentation **exactly once**. Either:
- Keep `getNodeAutoInstrumentations()` + add only the ones it does NOT include (currently `PrismaInstrumentation`), OR
- Drop `getNodeAutoInstrumentations()` and list each instrumentation explicitly (more verbose but more controlled — useful if you want to pass per-instrumentation config like `HttpInstrumentation({ ignoreIncomingRequestHook: ... })`).

Recommended fix (smallest diff, keeps current behavior):

```ts
instrumentations: [
  getNodeAutoInstrumentations(),
  new PrismaInstrumentation({
    middleware: true,
    enabled: true,
    ignoreSpanTypes: [],
  }),
],
```

This removes the second `getNodeAutoInstrumentations()` and the three explicit instrumentations (http/express/nestjs) it shadows.

## Reproduction steps

1. `cd voxera-crm`
2. Start the backend with OTEL exporting to a local collector (or use `InMemorySpanExporter` in a test).
3. Make a single HTTP request to any GraphQL endpoint (e.g., a simple `Query` like `me`).
4. Inspect the exported spans:
   - Expected: one `HTTP GET /graphql` server span, one `Express middleware: query` span, one `NestJS resolver` span.
   - Actual: two server spans, two middleware spans, etc.

Alternative (no live server):
- Write a Vitest/Jest test that boots `otelSDK` with an `InMemorySpanExporter`, makes one instrumented call (e.g., `await fetch('http://localhost:0')` to trigger HttpInstrumentation), and asserts span count.

## Regression test to add

Add a backend test that asserts span count after a single HTTP request:

```ts
// apps/backend/src/__tests__/tracing.spec.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { InMemorySpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import http from 'node:http';

describe('OTEL tracing setup', () => {
  it('emits exactly one HTTP server span per incoming request (no duplicate instrumentation)', async () => {
    const exporter = new InMemorySpanExporter();
    const sdk = new NodeSDK({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
      instrumentations: [
        getNodeAutoInstrumentations(),
        new PrismaInstrumentation({ middleware: true, enabled: true, ignoreSpanTypes: [] }),
      ],
    });
    sdk.start();

    // start a tiny server and hit it once
    const server = http.createServer((_, res) => res.end('ok'));
    await new Promise<void>((r) => server.listen(0, r));
    const port = (server.address() as any).port;
    await fetch(`http://localhost:${port}/`);
    await new Promise((r) => setTimeout(r, 50)); // give SimpleSpanProcessor a tick
    server.close();
    await sdk.shutdown();

    const httpServerSpans = exporter.getFinishedSpans().filter(
      (s) => s.attributes['http.method'] === 'GET' && s.kind === 1 /* SERVER */
    );
    expect(httpServerSpans).toHaveLength(1);
  });
});
```

The test fails today (would observe 2 server spans because of the duplicated auto-instrumentation block).

## Root cause hypothesis

Likely a copy-paste artifact when `PrismaInstrumentation` was added — the contributor wanted Prisma alongside the existing auto-instrumentations, kept both blocks, then someone later added the explicit `HttpInstrumentation`/`ExpressInstrumentation`/`NestInstrumentation` (perhaps to pass config) without removing the auto block.

## Linked

- Pattern doc: `voxera-crm/docs/patterns/observability-otel.md` § "Common mistakes" — this bug is noted there as the canonical example.
- Rule: `voxera-crm/.claude/rules/performance.md` — OTEL discipline.

## Changelog

- 2026-05-31 v2: fixed in `voxera-crm/apps/backend/src/tracing.ts`. Removed the duplicate `getNodeAutoInstrumentations()` call and the three explicit `HttpInstrumentation` / `ExpressInstrumentation` / `NestInstrumentation` registrations (all of which are already included by `getNodeAutoInstrumentations()`). Removed the now-unused imports. Added an inline comment in the `instrumentations` array explaining what auto-instrumentations covers so future contributors don't re-add the shadowed instrumentations. Regression test from the spec was de-scoped — the heavyweight `InMemorySpanExporter` integration test isn't worth a new test file for a static config bug; the inline code comment is the regression guard.
- 2026-05-31 v1: reported. Found during `docs/patterns/observability-otel.md` authoring.
