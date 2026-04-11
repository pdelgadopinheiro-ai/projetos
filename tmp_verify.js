const fs = require('fs');
const app = fs.readFileSync('app.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const ids = new Set();
const idRegex = /document\.getElementById\(['\"]([^'\"]+)['\"]\)/g;
let m;
while ((m = idRegex.exec(app)) !== null) ids.add(m[1]);
const missing = [];
for (const id of ids) {
  if (!new RegExp(`id=["']${id}["']`).test(html)) missing.push(id);
}
console.log('total ids in app.js', ids.size);
console.log('missing ids in index.html', missing.length);
if (missing.length) console.log(missing.join('\n'));
const fetchRegex = /fetch\(['\"]([^'\"]+)['\"]\)/g;
const urlCalls = [];
while ((m = fetchRegex.exec(app)) !== null) urlCalls.push(m[1]);
console.log('\nfetch urls in app.js:');
console.log(urlCalls.join('\n'));
const server = fs.readFileSync('server.js', 'utf8');
const routeRegex = /if \(url\.pathname === '([^']+)'[\s\S]*?req\.method === '([A-Z]+)'/g;
const routes = new Set();
while ((m = routeRegex.exec(server)) !== null) routes.add(`${m[1]} ${m[2]}`);
console.log('\nserver routes found:');
console.log([...routes].sort().join('\n'));
