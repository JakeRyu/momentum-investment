namespace MomentumInvestment.Api;

/// <summary>
/// Whether the calling app is old enough that we no longer stand behind the
/// answers it renders.
///
/// The app sends its native version in <c>X-App-Version</c>; the server
/// judges. Keeping the comparison here rather than in the app is the whole
/// point: a mistake in this file is fixed by a deploy, a mistake shipped
/// inside the app cannot be fixed without another App Store review.
/// </summary>
public static class ClientVersion
{
    public const string HeaderName = "X-App-Version";

    public const string Current = "current";
    public const string Outdated = "outdated";

    /// <summary>
    /// The oldest version whose answers we still trust — NOT "the latest
    /// version". Most of the time it should lag the shipping version, and
    /// that is healthy: a banner that appears on every release teaches
    /// people to ignore it, and then it is ignored on the release that
    /// actually mattered.
    ///
    /// Raise it only when an older version genuinely gets something wrong —
    /// the UK holders silently served US tickers, say. Raising it applies
    /// retroactively to apps already installed, so a version can be
    /// condemned long after it shipped, with no new release.
    ///
    /// ORDER MATTERS. Raise this only once the newer version is live on the
    /// App Store and has propagated. Otherwise the banner sends people to a
    /// listing that offers them nothing to install, and a banner that has
    /// lied once is a banner nobody reads.
    ///
    /// 1.0 means: nothing shipped so far is distrusted.
    /// </summary>
    public static readonly Version OldestTrusted = new(1, 0);

    /// <summary>
    /// Fails open, deliberately. A missing header is the website or an app
    /// built before this existed; an unparseable one is a bug somewhere.
    /// Neither is evidence that the caller is stale, and a version check
    /// that breaks the app when it misfires is worse than no check.
    /// </summary>
    /// <param name="oldestTrusted">
    /// Defaults to <see cref="OldestTrusted"/>. Only the tests pass this,
    /// and only so the comparison can be exercised against a line that
    /// actually distinguishes numeric ordering from text ordering — with
    /// the real line at 1.0 every plausible version sits above it, and a
    /// string comparison would pass the suite just as happily.
    /// </param>
    public static string Status(string? header, Version? oldestTrusted = null)
    {
        if (string.IsNullOrWhiteSpace(header)) return Current;
        if (!Version.TryParse(header.Trim(), out var reported)) return Current;

        // Version compares numerically, so 1.10 correctly beats 1.9 —
        // which string comparison gets backwards.
        return reported < (oldestTrusted ?? OldestTrusted) ? Outdated : Current;
    }
}
