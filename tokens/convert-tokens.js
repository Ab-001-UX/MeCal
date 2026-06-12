const fs = require('fs');
const path = require('path');

// Helper to convert camelCase or spaces to kebab-case
function toKebabCase(str) {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}

// Helper to resolve references like "{color.palette.primary.100}"
function resolveValue(value, data) {
    if (typeof value !== 'string') return value;
    
    const match = value.match(/^\{(.*)\}$/);
    if (!match) return value;
    
    const path = match[1].split('.');
    let current = data;
    
    for (const part of path) {
        if (current && current[part] !== undefined) {
            current = current[part];
        } else {
            console.warn(`Could not resolve reference: ${value} at ${part}`);
            return value; // Return original if not found
        }
    }
    
    return current;
}

function convert() {
    const colorPath = path.join(__dirname, 'color.json');
    const typoPath = path.join(__dirname, 'design-tokens.tokens (2).json');
    const outputPath = path.join(__dirname, 'tokens.css');

    if (!fs.existsSync(colorPath)) {
        console.error(`Error: ${colorPath} does not exist.`);
        return;
    }
    if (!fs.existsSync(typoPath)) {
        console.error(`Error: ${typoPath} does not exist.`);
        return;
    }

    const colorData = JSON.parse(fs.readFileSync(colorPath, 'utf8'));
    const typoData = JSON.parse(fs.readFileSync(typoPath, 'utf8'));

    let cssContent = ':root {\n';

    // 1. Process Typography
    cssContent += '  /* Typography */\n';
    const fontSection = typoData.font; // Using the simpler 'font' section
    if (fontSection) {
        for (const [name, token] of Object.entries(fontSection)) {
            const baseName = toKebabCase(name);
            const values = token.value;
            
            for (const [prop, val] of Object.entries(values)) {
                let cssVal = val;
                // Add units for dimensions if they are numbers
                if (['fontSize', 'lineHeight', 'letterSpacing', 'paragraphSpacing', 'paragraphIndent'].includes(prop) && typeof val === 'number') {
                    cssVal = `${val}px`;
                }
                
                // Map properties to standard CSS or custom names
                let cssProp = toKebabCase(prop);
                cssContent += `  --font-${baseName}-${cssProp}: ${cssVal};\n`;
            }
            cssContent += '\n';
        }
    }

    // 2. Process Color Roles (Light Theme)
    cssContent += '  /* Color Roles - Light Theme */\n';
    const lightRoles = colorData.color.role.light;
    if (lightRoles) {
        for (const [role, valueRef] of Object.entries(lightRoles)) {
            const resolvedValue = resolveValue(valueRef, colorData);
            cssContent += `  --color-${toKebabCase(role)}: ${resolvedValue};\n`;
        }
    }

    cssContent += '}\n\n';

    // 3. Process Color Roles (Dark Theme)
    cssContent += '/* Color Roles - Dark Theme */\n';
    cssContent += '[data-theme="dark"] {\n';
    const darkRoles = colorData.color.role.dark;
    if (darkRoles) {
        for (const [role, valueRef] of Object.entries(darkRoles)) {
            const resolvedValue = resolveValue(valueRef, colorData);
            cssContent += `  --color-${toKebabCase(role)}: ${resolvedValue};\n`;
        }
    }
    cssContent += '}\n';

    fs.writeFileSync(outputPath, cssContent);
    console.log(`Successfully generated ${outputPath}`);
}

convert();
