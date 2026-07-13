const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'frontend/src'));
let count = 0;
files.forEach(f => {
    let raw = fs.readFileSync(f, 'utf8');
    let mod = raw
        .replace(/FINSIGHTS\s*<span[^>]*>AI<\/span>/g, 'FINSIGHTS')
        .replace(/FINSIGHTS\s+AI/g, 'FINSIGHTS')
        .replace(/Finsights\s+AI/g, 'Finsights')
        .replace(/Finsight\s+AI/ig, 'Finsights');

    if (raw !== mod) {
        fs.writeFileSync(f, mod);
        count++;
        console.log('Updated ' + f);
    }
});
console.log('Total files updated: ' + count);
