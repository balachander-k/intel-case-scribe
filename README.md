# Intel Case Scribe

This repo currently contains a React/Vite frontend for internal service request operations.

## Frontend workflow scan (what exists today)

The UI expects backend support for:

1. **Request intake** from manual form, email, chat, or ticket paste.
2. **Request register** with search/filter/sort.
3. **Request detail** with status transitions.
4. **AI notes** generation + manual edits.
5. **Follow-up checklist** add/toggle completion.
6. **Dashboard metrics** (open, overdue, on-time, totals + breakdowns).

## Added backend

A complete .NET 8 minimal API backend has been added under:

- `backend/IntelCaseScribe.Api`
- Supabase schema/migration SQL under `supabase/001_initial_schema.sql`

See `backend/README.md` for setup and run instructions.
