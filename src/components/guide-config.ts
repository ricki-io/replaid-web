export function createGuideConfig(input: string) {
  const value = input.trim();
  if (!value || /\s/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || url.search || url.hash) return null;
    const quoted = "'" + url.href.replaceAll("'", "'\"'\"'") + "'";
    return {
      url: url.href,
      codex: `codex mcp add replaid --url ${quoted}\ncodex mcp login replaid`,
      hermes: JSON.stringify({ url: url.href, auth: 'oauth' }, null, 2),
    };
  } catch {
    return null;
  }
}
