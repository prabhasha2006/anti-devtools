
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '../dist');

console.log('Starting obfuscation...');

if (!fs.existsSync(distDir)) {
    console.error('dist directory not found!');
    process.exit(1);
}

function obfuscateDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            obfuscateDir(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
            // Skip .d.ts files (though they end in .ts, sometimes .d.js if weird config, but mostly .js checks cover it)
            // But verify it's not a source map or something else

            console.log(`Obfuscating ${filePath}...`);
            const content = fs.readFileSync(filePath, 'utf8');
            const obfuscationResult = JavaScriptObfuscator.obfuscate(content, {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.75,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.4,
                debugProtection: false,
                debugProtectionInterval: 0,
                disableConsoleOutput: true,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                numbersToExpressions: true,
                renameGlobals: false,
                selfDefending: true,
                simplify: true,
                splitStrings: true,
                splitStringsChunkLength: 10,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayEncoding: ['base64'],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 1,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersParametersMaxCount: 2,
                stringArrayThreshold: 0.75,
                transformObjectKeys: true,
                unicodeEscapeSequence: false
            });

            fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
        }
    });
}

try {
    obfuscateDir(distDir);
    console.log('Obfuscation complete!');
} catch (error) {
    console.error('Obfuscation failed:', error);
    process.exit(1);
}
