import assert from 'node:assert/strict';
import test from 'node:test';
import { createGuideConfig } from './guide-config.ts';

test('builds OAuth setup from the supplied endpoint without adding an MCP path', () => {
  const result = createGuideConfig('  https://mcp.example.com  ');
  assert.equal(result.url, 'https://mcp.example.com/');
  assert.equal(result.codex, "codex mcp add replaid --url 'https://mcp.example.com/'\ncodex mcp login replaid");
  assert.deepEqual(JSON.parse(result.hermes), { url: result.url, auth: 'oauth' });
});

test('preserves a supplied endpoint path', () => {
  assert.equal(createGuideConfig('https://example.com/agent/mcp').url, 'https://example.com/agent/mcp');
});

test('rejects incomplete, unsafe, and credential-bearing URLs', () => {
  for (const url of ['', 'not a URL', 'https://', 'http://example.com', 'javascript:alert(1)', 'https://user:secret@example.com', 'https://example.com/?token=secret', 'https://example.com/#secret', 'https://exam\nple.com']) {
    assert.equal(createGuideConfig(url), null, url);
  }
});

test('quotes URL punctuation as literal shell text', () => {
  const result = createGuideConfig("https://example.com/a'b/$(echo)");
  assert.equal(result.codex, `codex mcp add replaid --url 'https://example.com/a'"'"'b/$(echo)'\ncodex mcp login replaid`);
});
