using System.Text.Json;
using IntelCaseScribe.Api.Contracts;
using IntelCaseScribe.Api.Domain;
using Npgsql;

namespace IntelCaseScribe.Api.Infrastructure;

public interface IRequestRepository
{
    Task<IReadOnlyList<RequestListItemDto>> GetListAsync(CancellationToken ct);
    Task<ServiceRequest?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<ServiceRequest> CreateAsync(CreateRequestDto dto, CancellationToken ct);
    Task<bool> UpdateStatusAsync(Guid id, RequestStatus status, CancellationToken ct);
    Task<bool> UpsertAiNotesAsync(Guid id, AiNotes notes, CancellationToken ct);
    Task<FollowUp?> AddFollowUpAsync(Guid requestId, string content, CancellationToken ct);
    Task<bool> ToggleFollowUpAsync(Guid requestId, Guid followUpId, CancellationToken ct);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct);
}

public sealed class RequestRepository : IRequestRepository
{
    private readonly string _connectionString;

    public RequestRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetSection(SupabaseOptions.SectionName)["ConnectionString"]
            ?? throw new InvalidOperationException("Supabase:ConnectionString is required");
    }

    public async Task<IReadOnlyList<RequestListItemDto>> GetListAsync(CancellationToken ct)
    {
        const string sql = """
            select id, external_id, requestor_name, requestor_email, request_type, priority, status, due_date, created_at
            from app_requests
            order by created_at desc;
            """;

        var items = new List<RequestListItemDto>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        while (await reader.ReadAsync(ct))
        {
            items.Add(new RequestListItemDto(
                reader.GetGuid(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                Enum.Parse<RequestType>(reader.GetString(4), true),
                Enum.Parse<Priority>(reader.GetString(5), true),
                Enum.Parse<RequestStatus>(reader.GetString(6), true),
                DateOnly.FromDateTime(reader.GetDateTime(7)),
                reader.GetFieldValue<DateTimeOffset>(8)));
        }

        return items;
    }

    public async Task<ServiceRequest?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        const string sql = "select * from app_requests where id = @id";
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", id);
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        return await reader.ReadAsync(ct) ? MapRequest(reader) : null;
    }

    public async Task<ServiceRequest> CreateAsync(CreateRequestDto dto, CancellationToken ct)
    {
        var createdAt = DateTimeOffset.UtcNow;
        var dueDate = Services.SlaPolicy.GetDueDate(dto.RequestType, dto.Priority, createdAt);

        const string sql = """
            insert into app_requests
            (requestor_name, requestor_email, requestor_id, request_type, source_channel, priority, raw_description, due_date)
            values (@requestor_name, @requestor_email, @requestor_id, @request_type, @source_channel, @priority, @raw_description, @due_date)
            returning *;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("requestor_name", dto.RequestorName);
        cmd.Parameters.AddWithValue("requestor_email", dto.RequestorEmail);
        cmd.Parameters.AddWithValue("requestor_id", dto.RequestorId ?? string.Empty);
        cmd.Parameters.AddWithValue("request_type", dto.RequestType.ToString());
        cmd.Parameters.AddWithValue("source_channel", dto.SourceChannel.ToString());
        cmd.Parameters.AddWithValue("priority", dto.Priority.ToString());
        cmd.Parameters.AddWithValue("raw_description", dto.RawDescription);
        cmd.Parameters.AddWithValue("due_date", dueDate.ToDateTime(TimeOnly.MinValue));

        await using var reader = await cmd.ExecuteReaderAsync(ct);
        await reader.ReadAsync(ct);
        return MapRequest(reader);
    }

    public async Task<bool> UpdateStatusAsync(Guid id, RequestStatus status, CancellationToken ct)
        => await ExecuteAsync("update app_requests set status = @status, updated_at = timezone('utc'::text, now()) where id = @id", ("status", status.ToString()), ("id", id), ct);

    public async Task<bool> UpsertAiNotesAsync(Guid id, AiNotes notes, CancellationToken ct)
    {
        var aiJson = JsonSerializer.Serialize(notes);
        var tags = notes.SuggestedTags.ToArray();

        const string sql = "update app_requests set ai_notes = @ai_notes::jsonb, tags = @tags, updated_at = timezone('utc'::text, now()) where id = @id";
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("ai_notes", aiJson);
        cmd.Parameters.AddWithValue("tags", tags);
        cmd.Parameters.AddWithValue("id", id);
        return await cmd.ExecuteNonQueryAsync(ct) > 0;
    }

    public async Task<FollowUp?> AddFollowUpAsync(Guid requestId, string content, CancellationToken ct)
    {
        const string sql = """
            update app_requests
            set follow_ups = follow_ups || jsonb_build_array(jsonb_build_object(
                'id', gen_random_uuid(),
                'content', @content,
                'createdAt', timezone('utc'::text, now()),
                'completed', false,
                'completedAt', null
            )), updated_at = timezone('utc'::text, now())
            where id = @id
            returning follow_ups;
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("id", requestId);
        cmd.Parameters.AddWithValue("content", content);
        var result = await cmd.ExecuteScalarAsync(ct);
        if (result is null) return null;

        var followUps = JsonSerializer.Deserialize<List<FollowUp>>(result.ToString() ?? "[]") ?? [];
        return followUps.LastOrDefault();
    }

    public async Task<bool> ToggleFollowUpAsync(Guid requestId, Guid followUpId, CancellationToken ct)
    {
        const string sql = "select toggle_follow_up(@request_id, @follow_up_id)";
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("request_id", requestId);
        cmd.Parameters.AddWithValue("follow_up_id", followUpId);
        return (bool?)await cmd.ExecuteScalarAsync(ct) ?? false;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(CancellationToken ct)
    {
        var requests = await GetListAsync(ct);
        var totalOpen = requests.Count(r => r.Status != RequestStatus.Finalized);
        var overdue = requests.Count(r => r.Status != RequestStatus.Finalized && r.DueDate < DateOnly.FromDateTime(DateTime.UtcNow));

        return new DashboardSummaryDto(
            TotalOpen: totalOpen,
            Overdue: overdue,
            OnTime: totalOpen - overdue,
            TotalRequests: requests.Count,
            ByStatus: requests.GroupBy(x => x.Status.ToString()).ToDictionary(g => g.Key, g => g.Count()),
            ByType: requests.GroupBy(x => x.RequestType.ToString()).ToDictionary(g => g.Key, g => g.Count()),
            ByPriority: requests.Where(x => x.Status != RequestStatus.Finalized).GroupBy(x => x.Priority.ToString()).ToDictionary(g => g.Key, g => g.Count()));
    }

    private async Task<bool> ExecuteAsync(string sql, (string Name, object Value) p1, (string Name, object Value) p2, CancellationToken ct)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue(p1.Name, p1.Value);
        cmd.Parameters.AddWithValue(p2.Name, p2.Value);
        return await cmd.ExecuteNonQueryAsync(ct) > 0;
    }

    private static ServiceRequest MapRequest(NpgsqlDataReader reader)
    {
        var aiNotesJson = reader["ai_notes"]?.ToString();
        var followUpsJson = reader["follow_ups"]?.ToString() ?? "[]";
        var tags = reader["tags"] as string[] ?? [];

        return new ServiceRequest(
            Id: reader.GetGuid(reader.GetOrdinal("id")),
            ExternalId: reader.GetString(reader.GetOrdinal("external_id")),
            RequestorName: reader.GetString(reader.GetOrdinal("requestor_name")),
            RequestorEmail: reader.GetString(reader.GetOrdinal("requestor_email")),
            RequestorId: reader.GetString(reader.GetOrdinal("requestor_id")),
            RequestType: Enum.Parse<RequestType>(reader.GetString(reader.GetOrdinal("request_type")), true),
            SourceChannel: Enum.Parse<SourceChannel>(reader.GetString(reader.GetOrdinal("source_channel")), true),
            Priority: Enum.Parse<Priority>(reader.GetString(reader.GetOrdinal("priority")), true),
            Status: Enum.Parse<RequestStatus>(reader.GetString(reader.GetOrdinal("status")), true),
            RawDescription: reader.GetString(reader.GetOrdinal("raw_description")),
            DueDate: DateOnly.FromDateTime(reader.GetDateTime(reader.GetOrdinal("due_date"))),
            CreatedAt: reader.GetFieldValue<DateTimeOffset>(reader.GetOrdinal("created_at")),
            UpdatedAt: reader.GetFieldValue<DateTimeOffset>(reader.GetOrdinal("updated_at")),
            AiNotes: string.IsNullOrWhiteSpace(aiNotesJson) ? null : JsonSerializer.Deserialize<AiNotes>(aiNotesJson),
            Tags: tags,
            FollowUps: JsonSerializer.Deserialize<List<FollowUp>>(followUpsJson) ?? []);
    }
}
