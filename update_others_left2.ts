import fs from 'fs';
import path from 'path';

function updateUI() {
    const files = [
        'Flip.tsx', 'Hilo.tsx', 'Keno.tsx', 'Roulette.tsx', 'Chicken.tsx', 'Moles.tsx', 'DragonTower.tsx', 'Wheel.tsx', 'Limbo.tsx'
    ];

    files.forEach(game => {
        const file = path.join('src/components', game);
        if (!fs.existsSync(file)) return;
        let content = fs.readFileSync(file, 'utf8');

        // We will make sure the manual/auto toggle exists. If not, inject.
        const manualAutoToggle = `          <div className="bg-[#0f212e] rounded-full p-1 flex">
            <button className="flex-1 text-[13px] font-bold text-white bg-[#2f4553] rounded-full py-1.5 transition-colors shadow-sm">Manuel</button>
            <button className="flex-1 text-[13px] font-bold text-[#8b9ba5] hover:text-white rounded-full py-1.5 transition-colors">Auto</button>
          </div>
`;
        if(!content.includes("Manuel</button>")) {
             // Let's inject it right after the left panel start
             content = content.replace(/(<div className="md:col-span-3 bg-\[#213743\][^>]*>|w-full md:w-\[320px\] bg-\[#213743\][^>]*>)/, `$1\n${manualAutoToggle}`);
        }

        // And for the bet buttons, replace any bg-[#00e676] or such with the standard one
        // Wait, already did that.

        fs.writeFileSync(file, content);
    });
}
updateUI();
console.log("Done phase 4");
