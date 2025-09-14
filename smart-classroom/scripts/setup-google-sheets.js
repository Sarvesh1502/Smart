const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupGoogleSheets() {
  console.log('📊 Google Sheets Integration Setup\n');
  
  try {
    console.log('To set up Google Sheets integration, you need to:');
    console.log('1. Go to Google Cloud Console (https://console.cloud.google.com/)');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable Google Sheets API and Google Drive API');
    console.log('4. Create credentials (OAuth 2.0 Client ID)');
    console.log('5. Download the credentials JSON file\n');
    
    const hasCredentials = await question('Do you have the Google credentials JSON file? (y/N): ');
    
    if (hasCredentials.toLowerCase() === 'y' || hasCredentials.toLowerCase() === 'yes') {
      const credentialsPath = await question('Enter the path to your credentials JSON file: ');
      
      try {
        const credentials = await fs.readJson(credentialsPath);
        
        // Create credentials directory
        const credsDir = path.join(__dirname, '..', 'sheet-sync', 'credentials');
        await fs.ensureDir(credsDir);
        
        // Copy credentials file
        await fs.copy(credentialsPath, path.join(credsDir, 'credentials.json'));
        console.log('✅ Credentials file copied successfully');
        
        // Update environment variables
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = await fs.readFile(envPath, 'utf8');
        
        const updatedEnv = envContent.replace(
          /GOOGLE_CLIENT_ID=.*/,
          `GOOGLE_CLIENT_ID=${credentials.client_id}`
        ).replace(
          /GOOGLE_CLIENT_SECRET=.*/,
          `GOOGLE_CLIENT_SECRET=${credentials.client_secret}`
        );
        
        await fs.writeFile(envPath, updatedEnv);
        console.log('✅ Environment variables updated');
        
        // Create sample Google Sheet
        const sheetId = await question('Enter your Google Sheet ID (from the URL): ');
        if (sheetId) {
          const sheetEnv = updatedEnv + `\nGOOGLE_SHEET_ID=${sheetId}`;
          await fs.writeFile(envPath, sheetEnv);
          console.log('✅ Google Sheet ID configured');
        }
        
        console.log('\n🎉 Google Sheets integration setup completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Make sure your Google Sheet has the following columns:');
        console.log('   - Student Name');
        console.log('   - Email');
        console.log('   - Roll Number');
        console.log('   - Class');
        console.log('   - Section');
        console.log('   - Parent Name');
        console.log('   - Parent Phone');
        console.log('2. Share the sheet with the service account email');
        console.log('3. Test the integration by running: npm run test:sheets');
        
      } catch (error) {
        console.error('❌ Error processing credentials file:', error.message);
      }
    } else {
      console.log('\n📝 Manual Setup Instructions:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create a new project');
      console.log('3. Enable Google Sheets API and Google Drive API');
      console.log('4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID');
      console.log('5. Set application type to "Web application"');
      console.log('6. Add authorized redirect URI: http://localhost:5003/auth/google/callback');
      console.log('7. Download the JSON file and run this script again');
      console.log('8. Create a Google Sheet with student data');
      console.log('9. Share the sheet with your service account email');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  setupGoogleSheets();
}

module.exports = { setupGoogleSheets };
