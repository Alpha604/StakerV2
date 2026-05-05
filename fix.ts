import fs from 'fs';
import path from 'path';

const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fast replace for `const handleRoll = () => {` to `const handleRoll = async () => {` if needed.
    const handlersToMakeAsync = ['handlePlay', 'handleRoll', 'playTick', 'handleSpin', 'startGame', 'playAutoRound', 'playRound'];
    
    for (const h of handlersToMakeAsync) {
        content = content.replace(new RegExp(`const ${h} = \\(\\) => {`, 'g'), `const ${h} = async () => {`);
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('await subtractBalance')) continue;
        
        if (lines[i].match(/^\s*subtractBalance\([^)]+\);/)) {
            const spaces = lines[i].match(/^\s*/)?.[0] || '';
            const arg = lines[i].match(/subtractBalance\(([^)]+)\)/)?.[1];
            if (arg) {
                 lines[i] = `${spaces}const success = await subtractBalance(${arg});\n${spaces}if (!success) return;`;
                 modified = true;
            }
        } else if (lines[i].includes('const success = subtractBalance')) {
            lines[i] = lines[i].replace('subtractBalance', 'await subtractBalance');
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, lines.join('\n'));
    }
}
