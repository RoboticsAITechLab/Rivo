# RIVO — Checkpoint & Session Recovery Protocol

> **Document:** `CHECKPOINT_AND_RECOVERY_PROTOCOL.md`  
> **System:** RIVO School Management SaaS Execution Management System  
> **Authority:** Lead Orchestrator & CTO | **Version:** 1.0.0-EXEC  

---

## 1. Formal Milestone Checkpoint Protocol

At the completion of each phase or major milestone, the Lead Orchestrator executes a formal Checkpoint Verification:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CHECKPOINT VERIFICATION CADENCE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Git Tree Audit:      Verify zero uncommitted dirty changes in workspace. │
│ 2. Task Registry Sync:  Confirm every finished task marked VERIFIED.        │
│ 3. Automated Test Run:  Execute full test suite; confirm zero regressions.  │
│ 4. Git Tag Creation:    Tag commit e.g. 'checkpoint-phase-0-complete'.      │
│ 5. Progress Recalculate:Update PROGRESS_TRACKER.md with verified metrics.   │
│ 6. Append Log Record:   Write formal Checkpoint Record to EXECUTION_LOG.md. │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Recovery from Crashed, Stalled, or Restarted Agent Sessions

When an AI agent session is interrupted, restarted, or crashes mid-task (such as the server restart observed in conversation logs):

```mermaid
flowchart TD
    SessionStart["New Invocations / Resumed Agent Session"] --> Step1["Step 1: Check Working Tree\n(git status & git diff)"]
    Step1 --> Step2{"Is working tree clean?"}
    
    Step2 -->|No: Dirty Changes Found| Step3["Step 3: Forensic Inspection\n- Match modified files to TASK_REGISTRY\n- Run npx tsc --noEmit\n- Run relevant test suite"]
    Step3 --> Step4{"Do tests pass?"}
    Step4 -->|Yes| Step5["Commit completed work with TASK-ID reference\nUpdate TASK_REGISTRY to COMPLETED"]
    Step4 -->|No / Corrupted| Step6["Stash or revert unverified broken code\nReset task status to READY in TASK_REGISTRY"]
    
    Step2 -->|Yes: Tree Clean| Step7["Step 7: Inspect EXECUTION_LOG.md\n- Identify last verified entry\n- Identify tasks marked IN_PROGRESS\n- Resume next unstarted task in DAG"]
    Step5 --> Step7
    Step6 --> Step7
```

### Forensic Recovery Steps:
1. **Inspect Working Tree:** Run `git status`. Do not blindly run `git reset --hard`.
2. **Inspect Task Registry:** Identify any task left in `IN_PROGRESS`.
3. **Validate Partial Changes:**
   - If changes compile and pass tests: complete the verification checklist and commit.
   - If changes are broken or half-written: revert the specific file to pre-task state (`git restore <file>`) and reset task to `READY`.
4. **Log the Recovery:** Record a `[SESSION RECOVERY]` entry in [`EXECUTION_LOG.md`](file:///d:/Rivo/docs/PROJECT_MANAGEMENT/EXECUTION_SYSTEM/EXECUTION_LOG.md).
