# Local source import guide

No government credentials are needed. CPGRAMS sample, Kritagyata sample and eOffice sample are three local file adapters. They do not log in, poll, send messages or write back to those services.

1. Open Grievance and select the demo admin, supervisor or scoped integration persona.
2. Open source imports, choose an adapter and download/load its synthetic CSV. JSON arrays are also accepted. Keep real personal data out of this demonstration.
3. Review the saved column mapping and preview. Each row is New, Duplicate, Changed, Stale or Quarantined with a reason. Confirm the approved synthetic payload to import.
4. Inspect the job report and retained payload. Bad rows remain in quarantine while valid rows persist. Correct the source payload and preview again rather than editing the store.
5. Import the same external ID again: the canonical record is reused. Older snapshots are retained without replacing the latest authoritative timestamp. Changed source information is held for explicit reconciliation.
6. Pension and eOffice records need a human-confirmed case link. Ambiguous candidates are not silently merged. An independent permitted reviewer reconciles conflicting snapshots with a reason.

The CPGRAMS sample contains a pending record and a historical disposed record. The latter retains its original receipt, disposal date and source ATR reference. It is not a newly received grievance. To archive it internally, independently verify its source snapshot, inspect and verify proof, complete any independent appeal, then use the source-finalization action. This records internal verification, not an external closure.

Limits: 100 rows and 100 KB submitted text per local import. Canonical keys are adapter plus external ID. Jobs retain mapping, hashes, actor, timestamps and row outcomes. Scope is checked again when reading a job or source. The older fixed-format CSV intake/reversal feature remains separate; reversal is denied after subsequent case activity. No destructive deletion is provided.
