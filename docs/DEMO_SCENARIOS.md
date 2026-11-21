# Ten demonstrations

All people, policies and records are fictional. Start as Maya Rao. Switch local identities in Settings. Service tests use a temporary isolated database; browser tests use `.test-data/` and save screenshots in `.qa/`. Every mutation writes audit history.

| # | Input and validation | Real reads / outputs / writes | Permission and persistence |
|---|---|---|---|
| 1 | Search `replacement`, Documents tab | FTS5 returns laptop policy; open source preview | Same access checks as planner context; history saved on Enter |
| 2 | Ask for unresolved Alpha laptop incidents | Reads project, laptop, two incidents and policy | Permitted saved records only; chat and tool events persisted |
| 3 | Ask to prepare laptop replacement requests and submit for approval | Draft v1 and approval; switch Arjun, approve then execute; procurement row and receipt | Independent IT reviewer; eligibility and exact version rechecked; repeated execution returns same receipt |
| 4 | Projects → Create project → select multiple people | Employee validation; project plus membership edges | Acting session owner; survives reload |
| 5 | Ask for an Alpha progress report | Reads real tasks; 1/3 = 33%; saves report draft | Deterministic calculation and persisted citations |
| 6 | Customize → Meeting notes → Save | Template produces a real editable document | Owner-restricted editing, audit and version v1 |
| 7 | Change content, explain revision, Save version | New version; original unchanged; compare/history available | Optimistic version check; SQL prevents version update/delete |
| 8 | HR → Request leave → valid weekday range | Draft; HR approval then execution deducts balance and creates HR record | Other employees/IT cannot read private HR drafts; no double deduction |
| 9 | Switch Sam → Customize → Legacy import | Map headers, validate, preview, confirm; records and receipt | Admin only; malformed CSV and duplicate IDs rejected transactionally |
| 10 | Leave `GEMINI_API_KEY` blank | Explicit OFFLINE LOCAL MODE; predefined tools still operate | No fabricated Gemini response; live failures are saved as failures |

Additional checks: unauthorized conversations; stale base version; old approval after a new draft; task dependencies; bad leave dates; search type filter; cross-origin request rejection; PDF/DOCX signature bytes; refresh persistence; dark theme; mobile drawer and overflow.

Service scenario checks have passed. Browser verification is in progress; consult IMPLEMENTATION_PROGRESS.md for final results. Live Gemini planning cannot pass until a user key is supplied.
