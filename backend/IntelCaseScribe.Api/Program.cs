using IntelCaseScribe.Api.Contracts;
using IntelCaseScribe.Api.Domain;
using IntelCaseScribe.Api.Infrastructure;
using IntelCaseScribe.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SupabaseOptions>(builder.Configuration.GetSection(SupabaseOptions.SectionName));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<IRequestRepository, RequestRepository>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy => policy
        .WithOrigins(builder.Configuration.GetValue<string>("FrontendOrigin") ?? "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("frontend");

var api = app.MapGroup("/api");

api.MapGet("/requests", async (IRequestRepository repo, CancellationToken ct)
    => Results.Ok(await repo.GetListAsync(ct)));

api.MapGet("/requests/{id:guid}", async (Guid id, IRequestRepository repo, CancellationToken ct) =>
{
    var request = await repo.GetByIdAsync(id, ct);
    return request is null ? Results.NotFound() : Results.Ok(request);
});

api.MapPost("/requests", async (CreateRequestDto dto, IRequestRepository repo, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(dto.RequestorName) || string.IsNullOrWhiteSpace(dto.RequestorEmail) || string.IsNullOrWhiteSpace(dto.RawDescription))
    {
        return Results.ValidationProblem(new Dictionary<string, string[]> { ["request"] = ["requestorName, requestorEmail, and rawDescription are required"] });
    }

    var created = await repo.CreateAsync(dto, ct);
    return Results.Created($"/api/requests/{created.Id}", created);
});

api.MapPatch("/requests/{id:guid}/status", async (Guid id, UpdateStatusDto dto, IRequestRepository repo, CancellationToken ct)
    => await repo.UpdateStatusAsync(id, dto.Status, ct) ? Results.NoContent() : Results.NotFound());

api.MapPost("/requests/{id:guid}/ai-notes/generate", async (Guid id, IRequestRepository repo, CancellationToken ct) =>
{
    var request = await repo.GetByIdAsync(id, ct);
    if (request is null) return Results.NotFound();

    var notes = AiNoteService.Generate(request.RawDescription, request.RequestType);
    var ok = await repo.UpsertAiNotesAsync(id, notes, ct);
    return ok ? Results.Ok(notes) : Results.NotFound();
});

api.MapPut("/requests/{id:guid}/ai-notes", async (Guid id, UpsertAiNotesDto dto, IRequestRepository repo, CancellationToken ct) =>
{
    var notes = new AiNotes(dto.Summary, dto.Details, dto.ProposedAction, dto.SuggestedTags);
    var ok = await repo.UpsertAiNotesAsync(id, notes, ct);
    return ok ? Results.NoContent() : Results.NotFound();
});

api.MapPost("/requests/{id:guid}/follow-ups", async (Guid id, AddFollowUpDto dto, IRequestRepository repo, CancellationToken ct) =>
{
    if (string.IsNullOrWhiteSpace(dto.Content)) return Results.BadRequest("Follow-up content is required.");
    var followUp = await repo.AddFollowUpAsync(id, dto.Content.Trim(), ct);
    return followUp is null ? Results.NotFound() : Results.Ok(followUp);
});

api.MapPatch("/requests/{id:guid}/follow-ups/{followUpId:guid}/toggle", async (Guid id, Guid followUpId, IRequestRepository repo, CancellationToken ct)
    => await repo.ToggleFollowUpAsync(id, followUpId, ct) ? Results.NoContent() : Results.NotFound());

api.MapGet("/dashboard", async (IRequestRepository repo, CancellationToken ct)
    => Results.Ok(await repo.GetDashboardSummaryAsync(ct)));

app.Run();
