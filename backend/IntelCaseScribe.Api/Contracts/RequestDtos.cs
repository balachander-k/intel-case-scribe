using IntelCaseScribe.Api.Domain;

namespace IntelCaseScribe.Api.Contracts;

public sealed record CreateRequestDto(
    string RequestorName,
    string RequestorEmail,
    string? RequestorId,
    RequestType RequestType,
    SourceChannel SourceChannel,
    Priority Priority,
    string RawDescription);

public sealed record UpdateStatusDto(RequestStatus Status);

public sealed record AddFollowUpDto(string Content);

public sealed record UpsertAiNotesDto(
    string Summary,
    string Details,
    string ProposedAction,
    IReadOnlyList<string> SuggestedTags);

public sealed record RequestListItemDto(
    Guid Id,
    string ExternalId,
    string RequestorName,
    string RequestorEmail,
    RequestType RequestType,
    Priority Priority,
    RequestStatus Status,
    DateOnly DueDate,
    DateTimeOffset CreatedAt);

public sealed record DashboardSummaryDto(
    int TotalOpen,
    int Overdue,
    int OnTime,
    int TotalRequests,
    IReadOnlyDictionary<string, int> ByStatus,
    IReadOnlyDictionary<string, int> ByType,
    IReadOnlyDictionary<string, int> ByPriority);
