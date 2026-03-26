using IntelCaseScribe.Api.Domain;

namespace IntelCaseScribe.Api.Services;

public static class SlaPolicy
{
    private static readonly IReadOnlyDictionary<RequestType, IReadOnlyDictionary<Priority, int>> Matrix =
        new Dictionary<RequestType, IReadOnlyDictionary<Priority, int>>
        {
            [RequestType.Access] = new Dictionary<Priority, int> { [Priority.Low] = 5, [Priority.Medium] = 3, [Priority.High] = 1 },
            [RequestType.Issue] = new Dictionary<Priority, int> { [Priority.Low] = 7, [Priority.Medium] = 3, [Priority.High] = 1 },
            [RequestType.Information] = new Dictionary<Priority, int> { [Priority.Low] = 10, [Priority.Medium] = 5, [Priority.High] = 2 },
            [RequestType.Change] = new Dictionary<Priority, int> { [Priority.Low] = 14, [Priority.Medium] = 7, [Priority.High] = 3 },
            [RequestType.Other] = new Dictionary<Priority, int> { [Priority.Low] = 10, [Priority.Medium] = 5, [Priority.High] = 2 }
        };

    public static DateOnly GetDueDate(RequestType type, Priority priority, DateTimeOffset createdAt)
        => DateOnly.FromDateTime(createdAt.UtcDateTime.AddDays(Matrix[type][priority]));
}
