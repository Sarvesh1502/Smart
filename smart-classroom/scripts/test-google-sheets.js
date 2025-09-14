const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

async function testGoogleSheets() {
  console.log('🧪 Testing Google Sheets Integration\n');
  
  try {
    // Check if credentials file exists
    const credsPath = path.join(__dirname, '..', 'sheet-sync', 'credentials', 'credentials.json');
    
    if (!await fs.pathExists(credsPath)) {
      console.log('❌ Credentials file not found at:', credsPath);
      console.log('📝 Please complete the Google Sheets setup first:');
      console.log('1. Run: node scripts/simple-google-setup.js');
      console.log('2. Follow the setup instructions');
      console.log('3. Place your credentials.json file in the correct location');
      return;
    }
    
    console.log('✅ Credentials file found');
    
    // Check environment variables
    const requiredEnvVars = ['GOOGLE_SHEET_ID'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName] || process.env[varName] === 'your-sheet-id-here');
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:', missingVars.join(', '));
      console.log('📝 Please update your .env file with the correct values');
      return;
    }
    
    console.log('✅ Environment variables configured');
    
    // Test Google Sheets API connection
    try {
      const { GoogleAuth } = require('google-auth-library');
      const { google } = require('googleapis');
      
      const auth = new GoogleAuth({
        keyFile: credsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Test reading the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'A1:I1', // Just read the headers
      });
      
      const headers = response.data.values[0];
      console.log('✅ Successfully connected to Google Sheets');
      console.log('📊 Sheet headers:', headers);
      
      // Check if headers match expected format
      const expectedHeaders = [
        'Student Name', 'Email', 'Roll Number', 'Class', 
        'Section', 'Parent Name', 'Parent Phone', 'Enrollment Date', 'Status'
      ];
      
      const headersMatch = expectedHeaders.every((header, index) => 
        headers[index] && headers[index].toLowerCase().includes(header.toLowerCase())
      );
      
      if (headersMatch) {
        console.log('✅ Sheet structure is correct');
      } else {
        console.log('⚠️  Sheet structure may need adjustment');
        console.log('Expected headers:', expectedHeaders);
        console.log('Actual headers:', headers);
      }
      
    } catch (apiError) {
      console.log('❌ Google Sheets API error:', apiError.message);
      console.log('📝 Please check:');
      console.log('1. Your credentials are correct');
      console.log('2. The sheet ID is correct');
      console.log('3. The sheet is shared with your service account');
    }
    
    console.log('\n🎉 Google Sheets integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  testGoogleSheets();
}

module.exports = { testGoogleSheets };
