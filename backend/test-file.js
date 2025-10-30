// Simple test to check what error occurs during upload
const fs = require('fs');
const path = require('path');

// Test script content
const testScript = `INT. COFFEE SHOP - DAY

SARAH sits alone at a corner table, staring at her phone.

SARAH
(worried)
He hasn't called back...

JOHN enters the coffee shop.

JOHN
Sarah! There you are!

SARAH
(relieved)
John! I was so worried!

FADE OUT.`;

// Create a test file
const testFilePath = path.join(__dirname, 'uploads', 'test-script.txt');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Write test script
fs.writeFileSync(testFilePath, testScript);

console.log('Test script created at:', testFilePath);
console.log('File size:', fs.statSync(testFilePath).size, 'bytes');
console.log('File exists:', fs.existsSync(testFilePath));

// Test reading the file
const readContent = fs.readFileSync(testFilePath, 'utf8');
console.log('Successfully read file, content length:', readContent.length);
console.log('First 100 characters:', readContent.substring(0, 100));