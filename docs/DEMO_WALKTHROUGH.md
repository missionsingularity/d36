# Pension demonstration: five scenes

Open http://127.0.0.1:3000/customize. All records are synthetic; no government system, Foundry, email or AI provider is connected.

1. **Incoming:** click **Try pension example**. This creates a new persistent run at `/examples/{actual-run-id}` and a real case whose reference is `DEMO-GRV-2026-0042` (later runs have a distinct suffix). The internal stable case ID is shown under **Open case**. Inspect the complaint and both source records. They retain different statements and timestamps.
2. **Diagnose:** select **Dealing Assistant** in the demonstration role selector. Click **Reconstruct timeline**, then **Attach sample service record**. Open the actual section-addressed originals. Select **Section Reviewer**, inspect them and click **Verify inspected originals**. Return to Dealing Assistant and **Complete record verification**. The task and proof are the same records shown in the case and My Tasks.
3. **Produce:** **Prepare note**, edit its text and **Save new note version**. Expand saved versions to inspect v1 and v2. Download PDF/DOCX or other formats. All outputs are generated from stored Work and retained in the ignored data directory's exports folder. **Submit section review**.
4. **Authorise:** select Section Reviewer, enter comments and **Verify section review** or **Return for correction**. A return creates a real correction task; the assistant edits the note and completes it using verified evidence. After fresh review, the assistant **Requests approval**. Select Approving Officer, enter comments and **Approve exact version 2**. Wrong-role and stale-version requests are rejected by the server.
5. **Resolve:** assistant **Prepares response and follow-up**; approver reviews the response packet. Dispatch Clerk clicks **Dispatch Demo**. The persisted receipt names only the local demonstration inbox. Approver **Verifies local acknowledgement**. Attempting closure before follow-up fails with blockers. Assistant **Completes receipt follow-up**; approver enters the closure reason and **Closes case**. Refresh: the case, originals, versions, review, receipt and history remain.

Resume a closed tab through the saved example list on Customize. Pause/Resume preserves the run. No scene pre-advances without the presenter's action. Source-adapter enable/disable controls are visible to Department Administrator; disabling an adapter blocks reconstruction/new runs honestly.

## Compare micro-demo

Customize's existing Compare card opens the supported operation setup. Start it, open both source passages, inspect the conflicting instructions, then Open in Work and download the comparison. The published template is also available at `/workflows`; **Duplicate** opens an editable six-stage copy, and published runs pin the template version.

## Reconcile micro-demo

Open **Legacy sources** from the example to reach `/projects/grievance/legacy`. Inspect the retained Kritagyata/eOffice source records and their distinct statuses. Existing explicit source association/reconciliation controls preserve original snapshots and require a permitted reviewer. This is a local-file analogue, not a live status correction. A separate full eight-record reconciliation scenario remains pending; the existing tenth card is Outreach and is preserved.
