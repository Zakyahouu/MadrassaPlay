// Debug script to identify malformed routes
const fs = require('fs');
const path = require('path');

// Function to validate route patterns
function validateRoutePattern(pattern) {
  // Check for empty parameter names
  if (pattern.includes('/:') && !pattern.match(/:[\w]+/)) {
    return false;
  }
  
  // Check for malformed patterns
  if (pattern.includes('::') || pattern.includes('//')) {
    return false;
  }
  
  // Check for empty parameters
  if (pattern.match(/:[^a-zA-Z0-9_]/)) {
    return false;
  }
  
  return true;
}

// Function to scan route files
function scanRouteFiles() {
  const routesDir = path.join(__dirname, 'routes');
  const files = fs.readdirSync(routesDir);
  
  console.log('🔍 Scanning route files for malformed patterns...\n');
  
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(routesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Look for router method calls
        const routerMatch = line.match(/router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/);
        if (routerMatch) {
          const pattern = routerMatch[2];
          if (!validateRoutePattern(pattern)) {
            console.log(`❌ MALFORMED ROUTE FOUND:`);
            console.log(`   File: ${file}`);
            console.log(`   Line: ${index + 1}`);
            console.log(`   Pattern: ${pattern}`);
            console.log(`   Content: ${line.trim()}\n`);
          }
        }
      });
    }
  });
  
  console.log('✅ Route scanning completed.');
}

// Run the scan
try {
  scanRouteFiles();
} catch (error) {
  console.error('Error scanning routes:', error);
}
