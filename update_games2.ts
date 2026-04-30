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

    content = content.replace(/\+\(prev \/ 2\)\.toFixed\(8\)/g, 'Math.floor(prev / 2 * 100) / 100');
    content = content.replace(/\+\(prev \* 2\)\.toFixed\(8\)/g, 'Math.floor(prev * 2 * 100) / 100');
    
    // Also replace `+(prev / 2).toFixed(2)` which might have been generated
    content = content.replace(/\+\(prev \/ 2\)\.toFixed\(2\)/g, 'Math.floor(prev / 2 * 100) / 100');
    content = content.replace(/\+\(prev \* 2\)\.toFixed\(2\)/g, 'Math.floor(prev * 2 * 100) / 100');

    // Make sure we change the display of `potentialWin` and `multiplier * betAmount` to 2 decimals
    content = content.replace(/potentialWin\.toFixed\(8\)/g, '(Math.floor(potentialWin * 100) / 100).toFixed(2)');
    content = content.replace(/\(betAmount \* multiplier\)\.toFixed\(8\)/g, '(Math.floor(betAmount * multiplier * 100) / 100).toFixed(2)');

    // Ensure input `step` is 0.01 instead of 0.00000001
    content = content.replace(/step="0.00000001"/g, 'step="0.01"');

    // Ensure Montant de la mise input label has standard right suffix with $ (it previously had `{balance.toFixed(8)} {crypto}` which got transformed. 
    // Wait, the screenshot shows $ 100.00. We can just display the activeCrypto icon if activeCrypto is set, or $. Wait, the screenshot explicitly has $ 100.00 but with a bitcoin symbol in the input!
    // The user's balance is likely passed from context.
    content = content.replace(/\{\(Math\.floor\(\(balance\)\|\|0 \* 100\) \/ 100\)\.toFixed\(2\)\} \{renderCryptoIcon\(activeCrypto, "w-3 h-3"\)\}/g, '$\{(Math.floor(balance * 100) / 100).toFixed(2)\}');
    content = content.replace(/\{\(Math\.floor\(\(balance\)\|\|0 \* 100\) \/ 100\)\.toFixed\(2\)\}/g, '$\{(Math.floor(balance * 100) / 100).toFixed(2)\}');
    content = content.replace(/\{\(Math\.floor\(balance \* 100\) \/ 100\)\.toFixed\(2\)\} \{renderCryptoIcon\(activeCrypto, "w-3 h-3"\)\}/g, '$ {(Math.floor(balance * 100) / 100).toFixed(2)}');
    content = content.replace(/\{\(Math\.floor\(\(balance \|\| 0\) \* 100\) \/ 100\)\.toFixed\(2\)\} \{renderCryptoIcon\(activeCrypto, "w-3 h-3"\)\}/g, '$ {(Math.floor((balance || 0) * 100) / 100).toFixed(2)}');

    content = content.replace(/\{\(Math\.floor\(balance \* 100\) \/ 100\)\.toFixed\(2\)\}/g, '{(Math.floor(balance * 100) / 100).toFixed(2)}');

    fs.writeFileSync(file, content);
});
console.log("Done phase 2");
