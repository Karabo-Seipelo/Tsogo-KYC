# 00 · Product brief

*Why this journey exists, who it serves, and how we'd know it works. The take-home brief gives only technical requirements, so the business requirements below are **my assumptions**, stated openly with the questions I'd ask to confirm them.*

## Problem

Tsogo Sun Digital can't let a player deposit or play until their identity is verified: FICA requires it. Every verification that's abandoned or wrongly failed is a lost player plus support or review effort. So KYC is two things at once:

- a **compliance gate**: it must be thorough, auditable and lawful;
- a **conversion funnel**: it sits between sign-up and first deposit, so friction costs revenue.

The design has to serve both: strict where the law needs it, effortless everywhere else.

## Business requirements

| ID | Requirement | How we'd measure it | Owner |
|---|---|---|---|
| BR-1 | Verify identity to FICA standard before a player can deposit | 100% of depositing players verified; every decision reconstructable from an audit trail | Compliance |
| BR-2 | Maximise verification completion | Completion rate; drop-off per step | Product / Marketing |
| BR-3 | Verify quickly | Median time to verify ≤ 5 min (the promise made on the start screen) | Product |
| BR-4 | Keep fraud out without blocking honest players | Rejection rate; false-reject appeals | Compliance / Risk |
| BR-5 | Route uncertain cases to people, never to a dead end | Manual-review rate; review turnaround | Operations |
| BR-6 | Show where and why players drop off | Funnel events per step and per failure reason | BI |
| BR-7 | Control the cost of verification | Provider calls per completed verification | Finance |
| BR-8 | Handle personal data lawfully | Data minimisation and retention limits (POPIA) | Compliance / Legal |
| BR-9 | Change copy without a code release (legal wording, tone, new languages) | Time from approved wording to live; no deploys needed for copy | Compliance / Marketing |

## Users and stakeholders

| Who | What they need from this journey |
|---|---|
| **Player** | Clear expectations, no dead ends, works on their device and data plan, feels safe |
| **Compliance** | Verified identity before deposit, an audit trail, no over-retention of data |
| **Operations** | A defined handoff for cases the system can't decide (manual review) |
| **BI** | Consistent funnel events to measure completion and failure reasons |
| **Marketing / Product** | High completion, short time to verify, freedom to tune copy |
| **Finance** | Few wasted provider calls (e.g. blurry uploads caught before a paid check) |

## How the design serves the business

| Design decision | Serves |
|---|---|
| Time estimate + requirements up front (D1) | BR-2, BR-3: setting expectations reduces abandonment |
| Phone handoff via QR (D3) | BR-2, BR-4, BR-7: better photos → fewer failures and fewer repeat checks |
| Per-check feedback on failure (M3b, E3) | BR-2, BR-7: fixable failures fixed on the spot |
| Resilience everywhere (E1–E8) | BR-2: every dead end is a lost player |
| Retry limits → manual review (E9) | BR-4, BR-5: fraud attempts are capped; honest edge cases go to a person |
| Funnel events (spec 08) | BR-6, BR-7 |
| Audit trail of every transition (spec 08) | BR-1, BR-4 |
| No full-size images stored; everything expires (constitution §5) | BR-8 |
| All copy delivered as a JSON payload, CMS-ready (spec 09) | BR-9, BR-2: wording can be fixed or tested without a release |

## Scope of the demo

**In scope:** the player's journey end to end, with mocked verification, funnel events, an audit trail, a manual-review handoff, and copy served as a CMS-ready JSON payload.

**Out of scope (named on purpose):** a real verification provider, the operations back office for working the review queue, live BI dashboards, proof of address, and multi-language copy.

## Assumptions and open questions

These are what I'd confirm with the business before building the real thing:

1. **Where does KYC sit?** Before the first deposit (assumed), or before the first withdrawal? That changes where it appears in onboarding and how much friction is acceptable.
2. **Which documents are accepted?** Passport, Smart ID and driver's licence assumed. Is the green ID book still accepted? Is proof of address required?
3. **What does a provider check cost**, and is there a volume commitment? That decides how hard we work to catch bad photos before a paid check.
4. **Who works the manual-review queue**, in what hours, and with what target turnaround?
5. **What's today's completion rate**, if a flow exists, so improvements can be measured?
6. **How long must verification records be kept** under FICA, and what may be deleted sooner under POPIA?
7. **Is there a CMS already**, and who approves changes to compliance wording before it goes live?
