import fs from 'fs';
import path from 'path';

function standardizeLeftPanel() {
    const files = [
        'Flip.tsx', 'Hilo.tsx', 'Keno.tsx', 'Roulette.tsx', 'Chicken.tsx', 'Moles.tsx', 'DragonTower.tsx', 'Wheel.tsx', 'Limbo.tsx'
    ];

    files.forEach(game => {
        const file = path.join('src/components', game);
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');

        // replace the main container class to match
        content = content.replace(/bg-bg-panel lg:bg-\[#213743\] p-4 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-border-medium z-10/g, 'bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e] w-full md:w-[320px]');
        content = content.replace(/w-full md:w-\[320px\] bg-bg-panel border border-border-subtle rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col h-fit order-2 md:order-1 overflow-hidden z-10 p-4 gap-4/g, 'w-full md:w-[320px] bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e]');
        content = content.replace(/md:col-span-3 bg-\[#213743\] p-4 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-medium z-10 relative/g, 'md:col-span-3 bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e]');

        // Bet Button matching for Flip
        // className={cn("w-full py-4 rounded-md font-extrabold text-base transition-all bg-[#00e676] hover:bg-[#00c853] text-[#0f1116] ...
        content = content.replace(/bg-\[#00e676\] hover:bg-\[#00c853\]/g, 'bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black');
        content = content.replace(/bg-\[#1475e1\] hover:bg-\[#1b80f0\]/g, 'bg-[#1bc86a] hover:bg-[#1bc86a]/80 text-black');

        // text-text-secondary to text-[#8b9ba5]
        content = content.replace(/text-text-secondary/g, 'text-[#8b9ba5]');
        
        fs.writeFileSync(file, content);
    });
}

standardizeLeftPanel();
console.log("Done phase 3");
