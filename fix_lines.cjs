const fs = require('fs');

const file = 'src/lib/alchemyData.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const linesToRemove = [319, 321, 322, 324, 325, 326, 327, 328, 333, 335, 344, 376, 386, 392, 395, 396, 397, 420, 433, 440, 464, 493, 498].map(l => l - 1);

const newLines = lines.filter((_, idx) => !linesToRemove.includes(idx));
fs.writeFileSync(file, newLines.join('\n'));
