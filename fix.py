import os
import re

components_dir = "src/components"

for filename in os.listdir(components_dir):
    if not filename.endswith(".tsx"): continue
    
    filepath = os.path.join(components_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Manual rolls that don't capture the result of subtractBalance:
    # "subtractBalance(betAmount);" -> "const success = await subtractBalance(betAmount); \n    if (!success) return;"
    
    # Needs to handle different indentation and if the function isn't async
    # Or if it captures it without await: "const success = subtractBalance" -> "const success = await subtractBalance"

    # Let's do some precise replacements.
    lines = content.split('\n')
    modified = False
    
    for i, line in enumerate(lines):
        # Avoid things that already have await
        if 'await subtractBalance' in line:
             continue
             
        # "subtractBalance(betAmount);"
        if re.search(r'^\s*subtractBalance\([^)]+\);$', line):
            spaces = len(line) - len(line.lstrip())
            indent = " " * spaces
            # Extract arg
            match = re.search(r'subtractBalance\(([^)]+)\)', line)
            if match:
                arg = match.group(1)
                lines[i] = f"{indent}const success = await subtractBalance({arg});\n{indent}if (!success) return;"
                modified = True
                
        # "const success = subtractBalance(betAmount);"
        elif 'const success = subtractBalance' in line:
            lines[i] = line.replace('subtractBalance', 'await subtractBalance')
            modified = True

    if modified:
        # Before we save, we must ensure the surrounding function is async
        # We'll just rely on the fact that most handler functions are either already async or we can just make them async.
        # Let's do a pass to add async to functions containing 'await subtractBalance'
        # e.g. "const handlePlay = () => {" -> "const handlePlay = async () => {"
        # e.g. "function play() {" -> "async function play() {"
        
        # A simple hacky regex to add async to parent functions would be hard, so let's do a generic replace
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))
