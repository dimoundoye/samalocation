const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../samal2728987.sql');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Cleaning up SQL for MySQL 8 compatibility...');

// Replace DEFAULT json_array() with DEFAULT (JSON_ARRAY())
// And handle the CHECK constraint which might also have different syntax or be unnecessary in MySQL 8 (which has JSON type)
// But let's try specifically what failed.
content = content.replace(/DEFAULT json_array\(\) CHECK \(json_valid\(`(.*?)`\)\)/g, 'DEFAULT (JSON_ARRAY())');

fs.writeFileSync(filePath, content);
console.log('✅ Cleanup complete!');
