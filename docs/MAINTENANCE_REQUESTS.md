# Maintenance Requests

A guide to reporting, tracking, and managing asset maintenance/repair requests in AMS.

This feature is controlled by the **Maintenance tracking** toggle in Admin → Settings. When it's
off, all pages and links described below are hidden for everyone.

## For staff

### Submitting a request

1. Go to **My Maintenance Requests** in the sidebar (`/maintenance`).
2. Click **Create Request**.
3. Fill in:
   - **Asset** — any asset currently allocated to you, or any asset that's `Available`.
   - **Title** — a short summary (e.g. "Laptop won't charge").
   - **Issue Type** — free text, e.g. "Hardware fault", "Preventive".
   - **Priority** — Low / Medium / High / Critical.
   - **Description** — what's wrong and what needs doing.
   - **Notes** — optional extra context.
4. Click **Create Request**. Every admin is notified (in-app and by email) so it can be triaged.

### Tracking status

Your request moves through these states, in order:

| Status | Meaning |
|---|---|
| **Open** | Submitted, not yet picked up. |
| **In Progress** | An admin has started work on it. |
| **Resolved** | The work is done. |
| **Closed** | The admin has finished out the ticket after it was resolved. |
| **Cancelled** | The request was withdrawn (by you, while still Open) or cancelled by an admin. |

You'll get an in-app notification (bell icon) and an email each time your request moves between
these states, and when a handler is assigned to it.

You can cancel your own request yourself from its detail page, but only while it's still **Open**.

### Attachments and discussion

From a request's detail page (`/maintenance/<id>`), the reporter and any assigned handler can:
- **Upload** supporting documents or photos (5MB max per file; images, PDF, Word/Excel, and plain
  text are accepted).
- Post **comments** and reply to existing ones (one level of nesting) — this is an internal
  conversation thread attached to the request.

### Viewing history

`/maintenance` also lists **History For My Assets** — every maintenance request (open or closed)
against any asset currently allocated to you, regardless of who reported it.

An asset's own page (`/assets/<id>`) shows its full **Maintenance history**, with search and
Status/Priority filters, for anyone who can view that asset.

## For administrators

### The dashboard

`/admin/maintenance` (Admin → Maintenance) shows:
- **Stat cards** — Total, Open, In Progress, Resolved, Closed, Cancelled, Critical, High Priority.
- **Filters** — free-text search (title, description, asset name/tag, assignee), Asset, Status,
  Priority, Assignee, Reporter, and an opened-date range — all shareable as URL query params, with
  adjustable page size.
- The **request table**, with View/Edit actions and pagination.

### Managing a request

From a request's detail page (`/admin/maintenance/<id>`):

| Action | Available when | Effect |
|---|---|---|
| **Assign Handler** | Any status | Sets (or clears) who's working the ticket; notifies them in-app and by email. |
| **Start** | Open | Moves to In Progress. If the asset is currently `Available`, it's flipped to `In Maintenance`. |
| **Resolve** | Open or In Progress | Moves to Resolved (optionally with resolution notes). If the asset was `In Maintenance`, it reverts to `Available`. |
| **Close** | Resolved | Moves to Closed — the terminal state for a completed ticket. |
| **Cancel** | Open or In Progress | Moves to Cancelled. Reverts the asset's status the same way Resolve does. |
| **Delete** | Any status | Permanently removes the request, its attachments, and its comments. |

Every transition (except one you trigger on your own request as its reporter) emails and
in-app-notifies the reporter; assignment emails/notifies the handler.

**Edit** (title/issue type/priority/description/notes) is only available while a request is
**Open** — either the reporter or an admin can edit it at that point.

### Attachments and discussion

Same as the staff view above — admins can always upload attachments and post/reply to comments on
any request.

## Email notifications

Emails are sent via [Resend](https://resend.com) and require `RESEND_API_KEY` and
`RESEND_FROM_EMAIL` to be set (see the main `README.md`). If they aren't configured, email sending
is silently skipped — in-app notifications still work regardless.

| Event | Who's emailed |
|---|---|
| Request submitted | Every admin |
| Handler assigned | The assigned handler |
| Request started / resolved / closed / cancelled | The reporter (skipped if the reporter caused the change themselves) |
