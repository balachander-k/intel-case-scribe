namespace IntelCaseScribe.Api.Infrastructure;

public sealed class SupabaseOptions
{
    public const string SectionName = "Supabase";

    public required string ProjectUrl { get; init; }
    public required string ServiceRoleKey { get; init; }
    public required string ConnectionString { get; init; }
}
