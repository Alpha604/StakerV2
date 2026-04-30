import fs from 'fs';
import path from 'path';

function fixInputs() {
    const files = [
        'Flip.tsx', 'Hilo.tsx', 'Chicken.tsx', 'Moles.tsx', 'DragonTower.tsx', 'Wheel.tsx'
    ];

    files.forEach(game => {
        const file = path.join('src/components', game);
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');

        // Input container class
        content = content.replace(/bg-bg-inner rounded-md border border-border-medium p-1 transition-colors focus-within:border-border-hover/g, 'bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden');
        content = content.replace(/bg-bg-inner border border-border-medium rounded flex items-center hover:border-text-secondary transition-colors focus-within:border-accent/g, 'bg-[#0f212e] rounded hover:border-[#334b5c] focus-within:border-[#557086] transition-colors border border-[#2f4553] h-[40px] overflow-hidden');

        // Coins icon inner wrapper
        content = content.replace(/<div className="pl-3 pr-2 flex items-center justify-center">\s*<Coins size=\{16\} className="text-\[#8b9ba5\]" \/>\s*<\/div>/g, '<span className="pl-3 absolute flex items-center justify-center">{renderCryptoIcon(activeCrypto, "w-4 h-4")}</span>');

        // Input padding
        content = content.replace(/className="w-full bg-transparent text-white font-bold outline-none tabular-nums"/g, 'className="w-full bg-transparent p-2 pl-9 text-white font-bold outline-none focus:ring-0 disabled:opacity-50 text-[13px]"');

        // Half / double buttons if they don't exist
        // I will use edit_file if this node script gets too complex.

        fs.writeFileSync(file, content);
    });
}
fixInputs();
console.log("Done phase 5");
