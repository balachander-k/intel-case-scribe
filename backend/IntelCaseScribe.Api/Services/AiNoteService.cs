using IntelCaseScribe.Api.Domain;

namespace IntelCaseScribe.Api.Services;

public static class AiNoteService
{
    private static readonly IReadOnlyDictionary<string, string[]> TagMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["access"] = ["Access", "Permissions"],
        ["password"] = ["Credentials", "Access"],
        ["database"] = ["Database", "Infrastructure"],
        ["deploy"] = ["Deployment", "Release"],
        ["timeout"] = ["Performance", "Infrastructure"],
        ["dashboard"] = ["Dashboard", "UI"],
        ["vpn"] = ["VPN", "Network", "Remote"],
        ["email"] = ["Email", "Communications"],
        ["license"] = ["Licensing", "Procurement"],
        ["urgent"] = ["Urgent"],
        ["critical"] = ["Urgent", "Critical"],
        ["team"] = ["Team-Wide"]
    };

    public static AiNotes Generate(string rawDescription, RequestType requestType)
    {
        var cleaned = rawDescription
            .Replace("pls", "please", StringComparison.OrdinalIgnoreCase)
            .Replace("plz", "please", StringComparison.OrdinalIgnoreCase)
            .Replace("cant", "cannot", StringComparison.OrdinalIgnoreCase)
            .Replace("asap", "as soon as possible", StringComparison.OrdinalIgnoreCase)
            .Replace("tmrw", "tomorrow", StringComparison.OrdinalIgnoreCase)
            .Replace("pw", "password", StringComparison.OrdinalIgnoreCase)
            .Replace("db", "database", StringComparison.OrdinalIgnoreCase)
            .Replace("prod", "production", StringComparison.OrdinalIgnoreCase);

        var firstSentence = cleaned.Split(['.', '!', '?'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault() ?? cleaned[..Math.Min(cleaned.Length, 100)];
        if (string.IsNullOrWhiteSpace(firstSentence))
        {
            firstSentence = "Request submitted";
        }

        var tags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (keyword, mappedTags) in TagMap)
        {
            if (!rawDescription.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            foreach (var tag in mappedTags)
            {
                tags.Add(tag);
            }
        }

        if (tags.Count == 0)
        {
            tags.Add(requestType.ToString());
        }

        return new AiNotes(
            Summary: $"{requestType} request: {char.ToUpper(firstSentence[0])}{(firstSentence.Length > 1 ? firstSentence[1..] : string.Empty)}",
            Details: $"The requestor reported: {cleaned}. Categorized as {requestType.ToString().ToLowerInvariant()} and queued for triage.",
            ProposedAction: $"Review this {requestType.ToString().ToLowerInvariant()} request, assign an owner, and update the requester with ETA.",
            SuggestedTags: tags.ToArray());
    }
}
