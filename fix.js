const fs = require('fs');
let raw = fs.readFileSync('src/db/profiles.json', 'utf8');
raw = raw.replace(/[\x00-\x1F\x7F]/g, '');
const parsed = JSON.parse(raw);
const profiles = Array.isArray(parsed) ? parsed : parsed.profiles;

const bad = profiles.filter(p => !p.country_name || p.country_name.trim() === '');
console.log('Bad profiles:', bad.length);
console.log(JSON.stringify(bad.slice(0, 3), null, 2));

// Fix them by removing bad profiles or giving fallback
const fixed = profiles.filter(p => p.country_name && p.country_name.trim() !== '');
console.log('Remaining after fix:', fixed.length);

const out = Array.isArray(parsed) ? fixed : { profiles: fixed };
fs.writeFileSync('src/db/profiles.json', JSON.stringify(out, null, 2));
console.log('Written');
