# ADR 001: Defer TanStack Query

Status: accepted for the current roadmap implementation.

The frontend now has one abortable resource-state abstraction with `loading | success | error`, `isStale`, partial Home rendering and explicit mutation refresh. No production measurement currently proves at least two adoption gates: duplicate fetching in one journey, three multi-consumer mutations, or preview API p95 above 200 ms requiring back-navigation cache.

Re-evaluate only with captured network traces and p95 evidence. If two gates are met, use resource key factories, public/admin stale times of five minutes/30 seconds, network-or-5xx retry capped at two, AbortSignal propagation and resource-scoped invalidation.
