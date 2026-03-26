namespace IntelCaseScribe.Api.Domain;

public enum RequestType
{
    Access,
    Issue,
    Information,
    Change,
    Other
}

public enum SourceChannel
{
    Email,
    Portal,
    Chat
}

public enum Priority
{
    Low,
    Medium,
    High
}

public enum RequestStatus
{
    Draft,
    Reviewed,
    Approved,
    Finalized
}

public sealed record AiNotes(
    string Summary,
    string Details,
    string ProposedAction,
    IReadOnlyList<string> SuggestedTags);

public sealed record FollowUp(
    Guid Id,
    string Content,
    DateTimeOffset CreatedAt,
    bool Completed,
    DateTimeOffset? CompletedAt);

public sealed record ServiceRequest(
    Guid Id,
    string ExternalId,
    string RequestorName,
    string RequestorEmail,
    string RequestorId,
    RequestType RequestType,
    SourceChannel SourceChannel,
    Priority Priority,
    RequestStatus Status,
    string RawDescription,
    DateOnly DueDate,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    AiNotes? AiNotes,
    IReadOnlyList<string> Tags,
    IReadOnlyList<FollowUp> FollowUps);
