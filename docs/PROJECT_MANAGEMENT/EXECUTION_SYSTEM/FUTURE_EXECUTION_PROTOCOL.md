# RIVO — Future Prompt Execution Protocol

> **Document:** `FUTURE_EXECUTION_PROTOCOL.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Lead AI Orchestrator & CTO | **Version:** 1.0.0-EXEC  
> **Target Audience:** Any AI Agent or Human Engineer receiving a development instruction for RIVO.  

---

## 1. Mandatory 10-Step Ingestion Sequence

Whenever an AI agent receives a new prompt or instruction regarding Rivo, it MUST NOT immediately start modifying source code. It must execute the following 10-step context restoration sequence:

```
Step 1: Read 00_MASTER_EXECUTION_INDEX.md ──► Identify current phase, active milestone, and blockers.
Step 2: Read 02_MASTER_PHASE_ROADMAP.md   ──► Check phase scope, prerequisites, and exit criteria.
Step 3: Read Applicable MODULE_*.md      ──► Check technical domain specifications and file targets.
Step 4: Check TASK_REGISTRY.md           ──► Identify exact Task IDs related to the user prompt.
Step 5: Check DEPENDENCY_MAP.md          ──► Verify whether prerequisite tasks are COMPLETED.
Step 6: Check PROGRESS_TRACKER.md        ──► Verify current completion state (avoid redoing work).
Step 7: Check BLOCKER_AND_ESCALATION.md  ──► Verify no active blocker halts the requested task.
Step 8: Check AGENT_ORCHESTRATION.md     ──► Verify assigned agent role and permitted write files.
Step 9: Confirm Scope Alignment          ──► Verify requested task is in approved Master Plan scope.
Step 10: Formulate Atomic Execution Plan ──► Present task IDs, files to edit, and verification command.
```

---

## 2. Determining Task State & Execution Behavior

Before taking any write action, the agent must classify the requested work into one of four states:

1. **State A: Already `COMPLETED`**
   - *Action:* Do NOT rewrite or re-implement. Point the user to the verification evidence in `EXECUTION_LOG.md` and git commit hash.
2. **State B: `BLOCKED`**
   - *Action:* Do NOT attempt to bypass the blocker or fabricate missing credentials. State the blocker ID (e.g. `BLK-001`), reference the escalation report, and request the owner's decision.
3. **State C: `READY` with Prerequisites Met**
   - *Action:* Transition task to `IN_PROGRESS` in `TASK_REGISTRY.md`. Confine file modifications strictly to the assigned files. Execute Gate 1–5 verification and commit.
4. **State D: Unregistered / New Scope Request**
   - *Action:* Follow Section 3 (Handling New Project-Owner Instructions).

---

## 3. Handling New Project-Owner Instructions

If the Project Owner issues an instruction introducing a new requirement or modifying approved architecture:

1. **Impact Assessment:** The agent must analyze:
   - Does this expand MVP launch scope?
   - What existing database models, API contracts, or mobile views are affected?
   - Does this introduce additional third-party costs (SMS, storage, paid APIs)?
2. **Recommendation Formulation:** The agent must recommend:
   - **Option 1 (Accept & Integrate):** If essential for launch and backward-compatible.
   - **Option 2 (Defer to Post-Launch):** If useful but non-essential for initial commercial pilot.
   - **Option 3 (Reject):** If it introduces critical security, regulatory, or concurrency risks.
3. **Execution System Synchronization:** Upon explicit owner approval, the agent adds new Task IDs to `TASK_REGISTRY.md`, updates `DEPENDENCY_MAP.md`, records the decision in `DECISION_LOG.md`, and proceeds.

---

## 4. Execution Completion & Hand-Off Report

Upon completing any task or milestone, the agent MUST update:
1. [`TASK_REGISTRY.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/TASK_REGISTRY.md) (Mark task `COMPLETED` with commit hash).
2. [`PROGRESS_TRACKER.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/PROGRESS_TRACKER.md) (Recalculate percentages).
3. [`EXECUTION_LOG.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/EXECUTION_LOG.md) (Append formal Agent Execution Report with test evidence).

The agent then outputs a concise message to the project owner stating:
- Tasks completed.
- Verified test evidence.
- Any new blockers or checkpoints reached.
- The exact recommended next instruction.
