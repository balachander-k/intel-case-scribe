# Intel Case Scribe Backend (.NET + Supabase)

This backend maps directly to the existing React UI workflows:

- Create request
- Request register list
- Request detail view
- Status transitions
- AI notes generation/edit
- Follow-up add/toggle
- Dashboard summary counts

## 1) Configure Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/001_initial_schema.sql`.
3. Copy `backend/IntelCaseScribe.Api/appsettings.json` and replace:
   - `Supabase:ProjectUrl`
   - `Supabase:ServiceRoleKey`
   - `Supabase:ConnectionString`

## 2) Run API

```bash
cd backend/IntelCaseScribe.Api
dotnet restore
dotnet run
```

Swagger will be available at `https://localhost:5001/swagger` (or the printed URL).

## 3) API Endpoints

- `GET /api/requests`
- `GET /api/requests/{id}`
- `POST /api/requests`
- `PATCH /api/requests/{id}/status`
- `POST /api/requests/{id}/ai-notes/generate`
- `PUT /api/requests/{id}/ai-notes`
- `POST /api/requests/{id}/follow-ups`
- `PATCH /api/requests/{id}/follow-ups/{followUpId}/toggle`
- `GET /api/dashboard`

## Notes

- SLA due-date logic and AI heuristic generation are implemented server-side to mirror frontend behavior.
- For production, replace `AiNoteService` with OpenAI/Supabase Edge Function integration.
