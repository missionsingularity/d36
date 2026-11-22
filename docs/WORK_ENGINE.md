# Work Engine operations

The supplied white lotus SVG is used in the shared shell, assistant identity and favicon. The original path data is preserved; an indigo background makes the white artwork visible in both themes.

## Start

Run `npm.cmd start` after building, and `npm.cmd run worker` in another terminal. Both use the existing `.env.local` and `.data/enterprise.sqlite`. The worker polls persisted SQLite work every two seconds. It is needed for unattended schedules, continuation after approval and recovery without a browser. Interactive run pages also request bounded execution from the API.

Your key belongs in `C:\Users\spond\Singularity\d36\.env.local` as `GEMINI_API_KEY=...`. `GEMINI_MODEL` selects the model available to your account. Restart the server and worker after changing credentials. Keys are server-only and ignored by Git.

## Launch and build

Home combines enterprise search and the Assistant. New chat is the first sidebar action. Agent cards open a detailed launch interface. Workflow uses the configured version and explicit input fields; editing the instruction alone does not rewrite those steps. Auto sends the instruction, input values, allowed tool schemas and agent instructions to Gemini, then validates the entire plan before invoking tools. Missing credentials produce an explicit local workflow fallback, never a claim of model execution.

The library includes IT Operations, Project, HR, Document, Research and Operations. IT accepts an asset ID; Project accepts a project ID; Document/Research accept a query. HR can review a balance or prepare a leave request with dates and a reason. Every employee can launch a published version within their resource permissions.

Switch to the seeded administrator Sam in workspace Settings to use Agent Builder. Save a draft, test it using the same launch interface, or publish an immutable version. Configure goal, instructions, knowledge scopes, allowed tools, approval policy, input fields and JSON workflow steps. Existing runs retain their original version. Templates reuse published workflows.

Example step:

```json
{"id":"request","tool":"create_replacement_request","arguments":{"id":"$input.assetId"},"dependsOn":["eligibility"],"approvalPolicy":"none","condition":{"stepId":"eligibility","path":"eligible","equals":true}}
```

`$stepId.id` references an earlier result, `$input.field` a validated launch input. Dependencies must point to preceding steps. Optional output keys provide aliases. Branches that do not match skip their downstream chain. A plan is limited to 20 steps. Generated code, SQL and unknown tools are never executed.

Scopes are `workspace`, department names, or stored record types such as `IT`, `Projects`, `Documents`. They narrow resource access and returned evidence; they never expand the employee's permissions. The Tools view documents the actual registry schemas and write classification.

## Approvals and receipts

Drafting a document, replacement request or leave request saves an editable proposal. Submission pins its immutable document version. An independent reviewer can approve, return with comments, or reject. Decisions store actor, reason, version and time. Stale versions cannot execute. After approval, the independent authorized reviewer explicitly executes the document action in Approvals. The waiting run discovers its persisted receipt and continues. This intentionally preserves the existing module authorization boundary.

Other governed writes create an action gate for the exact resolved argument payload and agent version. An independent administrator reviews it in Work → Approvals. Approving allows the worker to continue under the original requesting employee's resource permissions. Rejection stops the action. Returning an action also prevents execution; revise and launch a new run. Draft-returned documents preserve the comment and create an editable revision.

Artifacts show readable source-backed reports, drafts, resources and real action receipts. Completed selected steps do not imply that a draft has been approved or that an external system was changed. Procurement receipts describe local database changes only.

## Durability and recovery

Runs persist `QUEUED`, `PLANNING`, `RUNNING`, `WAITING_FOR_APPROVAL`, `PAUSED`, `COMPLETED`, `FAILED`, or `CANCELLED`. Steps, attempts, inputs, outputs, errors, events, gates and receipts are stored in SQLite. Each registered local write, audit record and successful step receipt commit in the same SQLite transaction, using nested savepoints for shared module services. A crash before commit rolls them all back; a crash after commit leaves the completed step available for recovery. Completed steps are never replayed by retry.

The worker uses database leases, not an in-memory job list. Expired claims recover after restart. Pause and cancel take effect between tools; an already committed action is retained. Safe retry resumes the first incomplete step, checks preconditions again, and stops after three failed attempts for that step. A changed input, rejected action or stale approval requires a revised run. There are no external write tools with uncertain network outcomes in this implementation.

Gemini planning has a 45-second request timeout, at most three attempts for transient errors, and exponential backoff. Invalid plans, authorization, credential, billing and resource errors stay visible. Neither model output nor source documents can bypass registry or service checks.

## Schedules and events

Administrator Work → Settings creates a persisted schedule, first run and interval in hours. For a weekly Friday report select the Project agent, the next Friday at your desired local time, and 168 hours. The browser converts that time to UTC. Schedules can be enabled or disabled. The interval is fixed elapsed time, not a timezone-aware cron expression; missed occurrences coalesce into one run. Scheduled Workflow uses the agent's published default inputs.

Document submission sends existing local reviewer notifications. Approval/execution state is polled from durable records so waiting work can resume after a restart. No Google Calendar, email, Glean account, Redis or cloud worker is required. The machine, app and worker must remain running for unattended execution.

## Verification and product references

`npm.cmd test` covers shared services, Gemini failures and durable engine scenarios. The engine scenarios include actual child-process recovery, write idempotency, reviewer separation, version pinning, HR inputs, branching, schedules, safe retry, scope enforcement and whole-plan validation. `npm.cmd run test:e2e` checks library launches, readable artifacts, builder publication, schedule creation, existing module flows and mobile overflow.

Product concepts were checked against [Glean Agents](https://docs.glean.com/agents/overview/about-agents), [how agents work](https://docs.glean.com/agents/overview/how-agents-work), [building approaches](https://docs.glean.com/agents/overview/choose-how-to-build), [Agent Builder](https://docs.glean.com/agents/concepts/agent-builder) and the [developer platform](https://developers.glean.com/). The supplied actions URL returned no readable content. This local implementation retains Singularity branding and does not connect to Glean.
