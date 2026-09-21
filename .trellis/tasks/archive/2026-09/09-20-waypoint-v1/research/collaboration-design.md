# Collaboration Design Assessment

## Product Interpretation

The user's priority is quality-oriented, on-demand collaboration between ordinary and strong models. Price differences are useful, but minimizing token count is not the objective. Waypoint has no intelligence, no difficulty classifier, and no authority to decide when a Strong Model is needed.

Use **guidance**, not mechanical hints. A stable routing policy gives the main agent another available action. No failure counter, text detector, confidence estimate, task size, timer, or execution event should trigger "call Strong now". Deterministic checks are appropriate only for factual configuration/runtime diagnostics and UI projection.

Temporary Todo and generic subagent plugins are development aids, not part of this product's architecture. The final maintenance baseline is Pi + Trellis + Waypoint. Do not derive requirements from those temporary tools or copy their runtime/task models.

## 1. Trellis Addresses Information Quality, Not Intelligence

A reproducible issue with logs, constraints, expected behavior, and executable acceptance needs less guesswork than a screenshot and "fix this". Trellis supplies places to retain that evidence and boundaries for work; merely creating markdown files does not supply the evidence itself.

An ordinary main agent may gather missing facts, ask the user, or ask a Strong research agent to investigate. Strong reasoning is not a replacement for unavailable product intent or missing observations. The main agent must retain the freedom to choose among those actions.

Planning and task decomposition reduce unbounded context and restore points after compaction. They are helpful only when each task has coherent scope and a verifiable outcome. Arbitrarily splitting by file count or filling forms for every small change can increase coordination work without reducing uncertainty.

## 2. Delegate A Bounded Question, Not An Entire Conversation

The useful handoff is an unresolved question or bounded implementation, with the relevant evidence and constraints already in the native Trellis artifacts. A good dispatch does not need to replay the main session or copy the whole PRD into its prompt.

Examples of main-agent choices, not automatic triggers:

- Screenshot with unknown lifecycle behavior: reproduce/gather evidence; use Strong research when the remaining causal explanation needs deeper reasoning.
- Well-specified migration: ordinary implement and check may be sufficient even across many files.
- Known algorithm with difficult invariant preservation: direct Strong implement is legitimate; a failed cheap attempt is not a prerequisite.
- State/lifecycle changes with tests passing: Strong check may be worthwhile for semantic review; Check can fix within scope.

Never reserve Strong for analysis. Its role and allowed writes remain those of Trellis research/implement/check. A Strong research agent should not fix code outside research/ merely because it is more capable.

## 3. Findings Must Survive The Strong Run

Strong research can produce evidence, rejected hypotheses, constraints, and reproduction notes in the existing research/ directory. Strong implementation/check can leave code fixes and focused regression tests. The main agent may incorporate conclusions into native task artifacts during the normal workflow.

This lets an ordinary agent continue using the result rather than re-solving it. These are benefits of Trellis's existing process, not additional Waypoint instructions. Do not add mandatory handoff fields, new spec-update guidance, a memory database or another context-injection path. Waypoint does not write these findings or compete with Trellis's artifact/workflow prompts.

## 4. Self-Assessment Is The Main Residual Risk

An ordinary model can confidently miss a reason to seek stronger help. Static guidance improves the available decision vocabulary, but cannot guarantee good routing. Strong agents can also be wrong. No runtime design in this PRD removes the need for reproducible evidence and checks.

Do not "solve" this limitation with regex confidence scoring or mechanically triggered escalation messages. Keep the user able to configure Strong or switch the main Pi model directly. Observe real maintenance outcomes and revise the short policy only when evidence warrants it.

No lower-cost role is assumed in On mode: when the main model is already Strong, there is no separately configured workerModel. Waypoint must not claim that On automatically routes mundane work to a cheaper model.

## 5. Cost And Tokens Are Different Measures

A smaller model can cost less per token while using more tokens through exploration, failed changes, or repeated verification. Additional Strong dispatches add their own task-context and output costs. A strong implementation that ends rework may be cheaper overall than repeated unsuccessful ordinary runs.

The relevant manual evaluation is the total effort to reach a verified result, not minimum Strong calls or minimum tokens on an isolated turn. Capture task outcome, user corrections, rework, latency, and provider-reported spend/tokens when available. Compare similar completed work; do not promise a percentage saving from architecture alone.

Native context curation and provider caching influence cost. Keep Waypoint guidance byte-stable while configuration is unchanged. UI refreshes and task phase changes must not churn the routing prompt. Do not add budgets, telemetry, an optimizer, or a cost scheduler to v1.

## 6. Visibility Should Be An Evidence Display

A useful Task View answers: what task is active, which native operation is running, which model was requested/observed, what completed, and what remains unconfirmed.

It should not turn an execution success into proof of correctness. Four phases can remain stable while run details distinguish completed passes, failed/cancelled work, and unconfirmed final verification. The user has accepted this native evidence boundary: it is not a problem Waypoint needs to solve through a new protocol, and it is not a release blocker.

## 7. Per-Invocation Guidance Without Additional Workflow

Use Pi's actual `context` event to project the current short policy before each main-agent invocation, including every tool continuation. It is not merely a chat-start notice. Source verification and a no-network runtime probe are recorded in runtime-contracts.md.

Distinguish **hook frequency** from **context visibility**: `before_agent_start` can set a system prompt that is still sent on every subsequent request even though the hook is not rerun for each tool exchange. `context` is chosen to refresh/remove Waypoint guidance from live configuration per invocation, not because system instructions otherwise vanish. Official Pi examples use both approaches; they do not establish that most ecosystem plugins use one pattern.

The user's intended design already supplies exact model/thinking strings through the TUI preset and guidance. The main agent chooses and calls native `trellis_subagent`. No named-preset dispatch API, tool wrapper, tool metadata edit, extra status tool or automatic parameter resolution is necessary. The previous interface proposal is withdrawn, not a future requirement.

An explicit user model/thinking instruction overrides the default Strong preset within its stated scope. Waypoint does not parse natural language or persist an inferred setting; the main agent interprets the instruction and supplies its dispatch arguments. Do not rewrite it to the configured Strong.

No custom summary handling is required, as clarified by the user. Leave normal Pi compaction in place. Reconstructing the policy from settings makes the default option available after context rebuilding; preservation of oral choices remains subject to Pi's ordinary conversation/summary handling and is not guaranteed by policy reinjection.

No added spec/handoff/checklist instructions: Trellis already owns those. Dogfooding should test multiple tool continuations, reload/rebuilt contexts, live preset changes, Off/Auto behavior, oral model precedence and ordinary continuation after a Strong result. Check that exactly one current policy reaches the request, other context remains intact and no copies accumulate in history. No task/failure signal changes this into an upgrade recommendation.

## Suggested Stable Policy

The following is a candidate for review, not an implemented system prompt:

```text
Waypoint
Default Strong model: <provider>/<id>, thinking=<level>.
Explicit user model/thinking instructions take precedence within
their stated scope; this preset does not override them.
Follow the normal Trellis workflow. For trellis-research,
trellis-implement and trellis-check, dispatch through trellis_subagent
and use the normal/current model by default.
Choose Strong when you judge that this specific subtask materially
benefits from stronger reasoning: ambiguous requirements, difficult
reasoning or implementation, an insufficient cheaper attempt, or
semantic/architectural verification. Strong may research, implement,
or check; do not reserve it for analysis or review.
Use the preset model/thinking arguments when choosing the default
Strong option; use the user's explicit choice when applicable.
Task size or token volume alone is not a reason to select Strong.
```

Avoid growing this into an agent handbook. The discussion above informs product design; the injected policy should remain short. The native workflow already owns evidence gathering, persistence, and dispatch protocols.

## Dogfooding Gate

After functional tests, run a real Waypoint maintenance task in an isolated Pi profile with only native Trellis and Waypoint loaded. Exercise ordinary default work, one main-agent-selected Strong research/implement/check as appropriate, a rerun, and final native finish/archive. Verify that routing choices are made by the agent, the UI follows actual evidence, and no generic Todo/subagent tool is required.

This is product validation, not a permanent model benchmark feature. Keep the existing development tools installed until the user decides stability is sufficient to remove them.
