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
3. In Supabase, open **Project Settings → Database** and copy the connection string (session pooler is fine).
4. In this repo, open `backend/IntelCaseScribe.Api/appsettings.json` and fill:
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

---

## 3) How to test the output end-to-end

### A. Health check by listing requests

```bash
curl -X GET http://localhost:5000/api/requests
```

Expected: `200 OK` and a JSON array (possibly empty).

### B. Create one request

```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requestorName":"Test User",
    "requestorEmail":"test.user@company.com",
    "requestorId":"EMP-9001",
    "requestType":"Issue",
    "sourceChannel":"Portal",
    "priority":"High",
    "rawDescription":"vpn keeps dropping every 10 mins, cant work from home"
  }'
```

Expected:
- `201 Created`
- response includes `id`, `externalId`, `status` (`Draft`), and calculated `dueDate`

### C. Fetch detail by ID

```bash
curl -X GET http://localhost:5000/api/requests/<GUID_FROM_CREATE_RESPONSE>
```

Expected: full request payload with `followUps`, `tags`, `aiNotes` fields.

### D. Update status

```bash
curl -X PATCH http://localhost:5000/api/requests/<GUID>/status \
  -H "Content-Type: application/json" \
  -d '{"status":"Reviewed"}'
```

Expected: `204 No Content`, then GET should show `status: Reviewed`.

### E. Generate AI notes

```bash
curl -X POST http://localhost:5000/api/requests/<GUID>/ai-notes/generate
```

Expected:
- `200 OK`
- payload includes `summary`, `details`, `proposedAction`, `suggestedTags`
- subsequent GET shows `aiNotes` and `tags`

### F. Add follow-up

```bash
curl -X POST http://localhost:5000/api/requests/<GUID>/follow-ups \
  -H "Content-Type: application/json" \
  -d '{"content":"Validated issue is reproducible in staging"}'
```

Expected: `200 OK` with follow-up object containing `id`.

### G. Toggle follow-up completion

```bash
curl -X PATCH http://localhost:5000/api/requests/<GUID>/follow-ups/<FOLLOWUP_GUID>/toggle
```

Expected: `204 No Content`, then GET should show follow-up `completed: true` and `completedAt` set.

### H. Dashboard verification

```bash
curl -X GET http://localhost:5000/api/dashboard
```

Expected fields:
- `totalOpen`
- `overdue`
- `onTime`
- `totalRequests`
- `byStatus`, `byType`, `byPriority`

---

## 4) Validate directly in Supabase SQL Editor

Run:

```sql
select id, external_id, requestor_name, status, due_date, created_at
from public.app_requests
order by created_at desc;
```

You should see records created from API calls.

---

## 5) Frontend wiring test (optional)

The frontend currently uses local store state. To fully test UI + backend together:
1. Replace store calls with API calls to these endpoints.
2. Run frontend (`npm run dev`) and backend (`dotnet run`) together.
3. Verify each UI action maps to one API endpoint from section 3.

## API Endpoints

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
