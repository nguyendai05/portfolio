import fs from 'node:fs';
import path from 'node:path';

const roots = ['dist'];
const forbidden = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /SYSTEM_INSTRUCTION/,
  /You are ["']XUNI_CORE/,
  /api\.emailjs\.com\/api\/v1\.0\/email\/send/,
  /generativelanguage\.googleapis\.com/,
];
const failures = [];

for (const [name, value] of Object.entries(process.env)) {
  if (!value || value.length < 8) continue;
  if (/^(?:GEMINI|EMAILJS|ADMIN_SESSION|ADMIN_PASSWORD|RATE_LIMIT_HMAC|MYSQL_PASSWORD)/.test(name)) {
    forbidden.push(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
}

function visit(file) {
  const stat = fs.statSync(file);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(file)) visit(path.join(file, child));
    return;
  }
  if (!/\.(?:js|css|html|map|json)$/.test(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const pattern of forbidden) if (pattern.test(content)) failures.push(`${file}: ${pattern}`);
}

for (const root of roots) if (fs.existsSync(root)) visit(root);

const clientRoots = ['components', 'pages', 'context', 'routing', 'services'];
const serverOnlyImport = /(?:@google\/genai|server[\\/]providers[\\/]gemini|geminiService|geminiKeyManager)/;
function scanClientImports(file) {
  const stat = fs.statSync(file);
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(file)) scanClientImports(path.join(file, child));
    return;
  }
  if (!/\.(?:ts|tsx|js|jsx)$/.test(file)) return;
  const normalized = file.replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  if (serverOnlyImport.test(content)) failures.push(`${file}: imports a server-only AI provider`);
}
for (const root of clientRoots) if (fs.existsSync(root)) scanClientImports(root);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Client artifact secret/provider scan passed.');
