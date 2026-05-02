const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const skipFiles = ['App.tsx', 'Login.tsx', 'ProtectedRoute.tsx', 'axios.ts', 'useBasePath.ts', 'StaffDashboard.tsx'];

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    if (skipFiles.some(sf => filePath.endsWith(sf))) return;

    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    // Replace navigate('/admin/...')
    content = content.replace(/navigate\('\/admin\/([^']+)'\)/g, "navigate(`${getBasePath()}/$1`)");
    
    // Replace navigate(`/admin/...`)
    content = content.replace(/navigate\(`\/admin\/([^`]+)`\)/g, "navigate(`${getBasePath()}/$1`)");
    
    // Replace path: '/admin/...'
    content = content.replace(/path:\s*['"]\/admin\/([^'"]+)['"]/g, "path: `${getBasePath()}/$1`");

    // Replace href="/admin/..."
    content = content.replace(/href="\/admin\/([^"]+)"/g, "href={`\\${getBasePath()}/$1`}");
    content = content.replace(/href=\{`\/admin\/([^`]+)`\}/g, "href={`\\${getBasePath()}/$1`}");

    // Replace to="/admin/..."
    content = content.replace(/to="\/admin\/([^"]+)"/g, "to={`\\${getBasePath()}/$1`}");

    if (content !== originalContent) {
        if (!content.includes('getBasePath')) {
            content = "import { getBasePath } from '@/hooks/useBasePath';\n" + content;
        }
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
});
