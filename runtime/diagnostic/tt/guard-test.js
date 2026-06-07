// Torture test: dispatch-route-guard — direct findForbidden() for Bash patterns
const g = require('../../../scripts/hooks/dispatch-route-guard.js');
const cases = [
  ['BLOCK', 'codex exec "summarize"'],
  ['BLOCK', 'gemini -p "hello"'],
  ['BLOCK', 'cat prompt.txt | claude -p'],
  ['BLOCK', 'cat prompt.txt | codex exec'],
  ['BLOCK', 'claude -p --agent builder < prompt.txt'],          // build-chain raw
  ['BLOCK', 'claude -p --agent backend-builder < prompt.txt'],  // build-chain raw
  ['ALLOW', 'node scripts/dispatch-agent.js qa /tmp/p.txt'],
  ['ALLOW', 'node scripts/dispatch-claude.js builder /tmp/p.txt -w'],
  ['ALLOW', 'claude -p --agent qa < prompt.txt'],               // non-build claude --agent ok
  ['ALLOW', 'gemini --version'],
  ['ALLOW', 'git commit -m "fix: codex exec bug"'],             // quoted literal must not block
  ['BLOCK', 'node scripts/dispatch-claude.js builder p.txt -w; codex exec "x"'], // piggyback
];
let pass=0, fail=0;
for (const [want, cmd] of cases) {
  const hit = g.findForbidden(cmd);
  const got = hit ? 'BLOCK' : 'ALLOW';
  const ok = got === want;
  if (ok) pass++; else fail++;
  console.log(`${ok?'PASS':'!!FAIL'}  want=${want} got=${got}  ${hit?('['+hit.pattern+'] '):''}${cmd}`);
}
console.log(`\nfindForbidden: ${pass} pass / ${fail} fail`);
