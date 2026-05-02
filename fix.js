const fs = require("fs");
const files = [
  "src/components/Baccarat.tsx",
  "src/components/Blackjack.tsx",
  "src/components/Chicken.tsx",
  "src/components/Crash.tsx",
  "src/components/Dice.tsx",
  "src/components/DragonTower.tsx",
  "src/components/Flip.tsx",
  "src/components/Hilo.tsx",
  "src/components/Keno.tsx",
  "src/components/Leaderboard.tsx",
  "src/components/Limbo.tsx",
  "src/components/Moles.tsx",
  "src/components/Plinko.tsx",
  "src/components/Slide.tsx",
  "src/components/Slots.tsx",
  "src/components/TomeOfLife.tsx",
  "src/components/VideoPoker.tsx",
  "src/components/Wheel.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("formatCurrency")) {
    if (content.includes("import { cn } from \"../lib/utils\";")) {
      content = content.replace("import { cn } from \"../lib/utils\";", "import { cn, formatCurrency } from \"../lib/utils\";");
    } else if (content.includes("import { cn } from '\''../lib/utils'\'';")) {
      content = content.replace("import { cn } from '\''../lib/utils'\'';", "import { cn, formatCurrency } from \"../lib/utils\";");
    } else if (content.includes("import { cn } from \"../../lib/utils\";")) {
      content = content.replace("import { cn } from \"../../lib/utils\";", "import { cn, formatCurrency } from \"../../lib/utils\";");
    } else {
      content = "import { formatCurrency } from \"../lib/utils\";\n" + content;
    }
    fs.writeFileSync(file, content, "utf8");
  }
}
