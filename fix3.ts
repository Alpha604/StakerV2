import fs from 'fs';
let content = fs.readFileSync('src/components/Crash.tsx', 'utf8');
content = content.replace('const handleBet = () => {', 'const handleBet = async () => {');
fs.writeFileSync('src/components/Crash.tsx', content);
