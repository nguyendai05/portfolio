const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/verify-hosting-spike.mjs <vercel-preview-url> <cloudflare-preview-url>');
  process.exit(2);
}

const paths = ['/', '/work', '/about', '/gallery', '/contact', '/admin/login'];
const failures = [];
for (const target of targets) {
  for (const pathname of paths) {
    const url = new URL(pathname, target);
    const response = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
    });
    const html = await response.text();
    const ok = response.status < 400 && /<div id=["']root["']><\/div>/.test(html);
    console.log(`${ok ? 'PASS' : 'FAIL'} ${response.status} ${url}`);
    if (!ok) failures.push(`${response.status} ${url}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
