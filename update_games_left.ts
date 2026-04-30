import fs from 'fs';
import path from 'path';

function replaceLeftPanel(gameCode, gameName, leftPanelJSX) {
    const file = path.join('src/components', `${gameCode}.tsx`);
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // we will find the entire left side control div
    // We can just manually replace using multi_edit format but running regex or simple string replacement.
    // It is easier to use regex or match brace.
}
