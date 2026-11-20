# Demonstration permissions

The current app resolves Officer, Reviewer and Guest from an opaque server-issued session. The session token is stored in an HttpOnly, SameSite cookie and resolves to a persisted server record. The labelled demo switch endpoint can issue each persona locally. Production identity is outside this configuration.

| Operation | Officer | Reviewer | Guest |
|---|---|---|---|
| Read permitted source or record | Yes | Yes | Yes |
| Query own saved conversations | Yes | Yes | Yes |
| Create or edit work | Yes | Yes | No |
| Approve a submitted workflow version | No | Yes | No |
| Restrict or restore source access | No | Yes | No |
| Edit shared local project members | Yes | Yes | No |

Source restrictions are checked when searching, opening citations, reading a work record and exporting it. Stored answers with source dependencies become unavailable if those sources become inaccessible. Conversation ownership is checked on follow-up queries.

Project member access labels are currently local project metadata. Department isolation, membership-based record authorization, a distinct Approver and Admin identity, and broader two-person approval controls remain pending. The existing workflow approval tests describe the currently implemented reviewer mechanism.
