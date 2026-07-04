const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace api.xxx(`${getBasePath()}/...`) with api.xxx(`/admin/...`)
  // Regex looks for: api.get( `${getBasePath()}/something` )
  content = content.replace(/api\.(get|post|put|delete|patch)\(\s*`\$\{getBasePath\(\)\}\/(.*?)`/g, 'api.$1(`/admin/$2`');
  
  // Also replace fetch URLs
  content = content.replace(/\$\{window\.location\.origin\}\/api\/\$\{getBasePath\(\)\}\//g, '${window.location.origin}/api/admin/');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated: ' + file);
    changedCount++;
  }
});

console.log('Total files updated: ' + changedCount);
