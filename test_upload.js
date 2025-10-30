// Test script upload functionality
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  try {
    console.log('Testing script upload with image style...');
    
    // Create a test script file
    const testScript = `INT. COFFEE SHOP - DAY

SARAH sits alone at a corner table, staring at her phone with a worried expression.

SARAH
(whispering to herself)
He hasn't called back...

JOHN enters the coffee shop, looking around frantically.

JOHN
Sarah! There you are!

SARAH
(relieved, standing up)
John! I was so worried!

They embrace.

FADE OUT.`;

    // Write test script to a temporary file
    const testFilePath = path.join(__dirname, 'temp_test_script.txt');
    fs.writeFileSync(testFilePath, testScript);

    // Create form data
    const formData = new FormData();
    formData.append('script', fs.createReadStream(testFilePath));
    formData.append('title', 'Test Script Upload');
    formData.append('language', 'en');
    formData.append('imageStyle', 'cinematic');

    // Make the upload request
    const response = await axios.post('http://localhost:5000/api/upload-script', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });

    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    // Clean up temp file
    fs.unlinkSync(testFilePath);

  } catch (error) {
    console.error('Upload failed:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testUpload();