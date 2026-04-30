import fs from 'fs';
import path from 'path';

const games = [
    'Baccarat.tsx', 'Blackjack.tsx', 'Chicken.tsx', 'Crash.tsx', 'Dice.tsx', 
    'DragonTower.tsx', 'Flip.tsx', 'Hilo.tsx', 'Keno.tsx', 'Limbo.tsx', 
    'Mines.tsx', 'Moles.tsx', 'Plinko.tsx', 'Roulette.tsx', 'Slide.tsx', 
    'Slots.tsx', 'TomeOfLife.tsx', 'VideoPoker.tsx', 'Wheel.tsx'
];

games.forEach(game => {
    const file = path.join('src/components', game);
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Make sure we apply rounding down to nearest centime in payouts/wins if applicable.
    // e.g., payout = Math.floor(payout * 100) / 100
    // We will do this via a regex replacing `const payout = isWin ? potentialWin : 0;` to `const payout = isWin ? Math.floor(potentialWin * 100) / 100 : 0;`
    content = content.replace(/const payout = isWin \? .*? : 0;/g, 'const payout = isWin ? Math.floor(potentialWin * 100) / 100 : 0;');
    
    // Also handling `toFixed(8)` in UI mostly changing to `.toFixed(2)` and floor.
    content = content.replace(/\{\((balance)\)\.toFixed\(\d+\)\}/g, '{(Math.floor($1 * 100) / 100).toFixed(2)}');
    content = content.replace(/\{balance\.toFixed\(\d+\)\}/g, '{(Math.floor(balance * 100) / 100).toFixed(2)}');
    content = content.replace(/\{\(balance \|\| 0\)\.toFixed\(\d+\)\}/g, '{(Math.floor((balance || 0) * 100) / 100).toFixed(2)}');
    
    // For left-side controls
    // Standardize Left Side Container: className="w-full md:w-[320px] bg-[#213743] md:rounded-l-lg md:rounded-r-none rounded-t-lg flex flex-col p-4 z-10 relative order-2 md:order-1 border-r border-[#0f212e]"
    // Notice some games use `lg:w-[320px]` or `md:col-span-3` (Flip, Wheel etc.)
    // We will try our best, but might need manual tweaks for complex ones. Let's do string replacement for the general style

    // Manuel / Auto toggle:
    const autoManualToggle = `<div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
            <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors">Auto</button>
          </div>`;
          
    // Replace old auto manual toggles
    content = content.replace(/<div className="bg-\[#0d1b24\] rounded-lg p-1 flex border border-\[#233845\]">[\s\S]*?<\/div>/g, autoManualToggle);
    content = content.replace(/<div className="bg-\[#0d1b24\] rounded-lg p-1 flex border border-\[#233845\]">[\s\S]*?<\/div>/g, autoManualToggle);

    fs.writeFileSync(file, content);
});
console.log("Done phase 1");
