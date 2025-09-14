const fs = require('fs-extra');
const path = require('path');

async function simpleGoogleSetup() {
  console.log('📊 Simple Google Sheets Setup\n');
  
  try {
    // Create credentials directory
    const credsDir = path.join(__dirname, '..', 'sheet-sync', 'credentials');
    await fs.ensureDir(credsDir);
    
    // Create template credentials file
    const templateCredentials = {
      "web": {
        "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
        "project_id": "your-project-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "YOUR_CLIENT_SECRET_HERE",
        "redirect_uris": [
          "http://localhost:5003/auth/google/callback",
          "http://localhost:3000/auth/google/callback"
        ]
      }
    };
    
    const templatePath = path.join(credsDir, 'credentials-template.json');
    await fs.writeJson(templatePath, templateCredentials, { spaces: 2 });
    
    console.log('✅ Created credentials template at:', templatePath);
    console.log('\n📝 Next steps:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable Google Sheets API and Google Drive API');
    console.log('4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID');
    console.log('5. Set application type to "Web application"');
    console.log('6. Add authorized redirect URI: http://localhost:5003/auth/google/callback');
    console.log('7. Download the JSON file');
    console.log('8. Replace the template file with your actual credentials');
    console.log('9. Rename it to "credentials.json"');
    console.log('\n📊 Create a Google Sheet with these columns:');
    console.log('A1: Student Name');
    console.log('B1: Email');
    console.log('C1: Roll Number');
    console.log('D1: Class');
    console.log('E1: Section');
    console.log('F1: Parent Name');
    console.log('G1: Parent Phone');
    console.log('H1: Enrollment Date');
    console.log('I1: Status');
    
    // Update environment variables
    const envPath = path.join(__dirname, '..', '.env');
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('GOOGLE_SHEET_ID')) {
        const updatedEnv = envContent + '\n# Google Sheets Configuration\nGOOGLE_SHEET_ID=your-sheet-id-here\n';
        await fs.writeFile(envPath, updatedEnv);
        console.log('\n✅ Updated .env file with Google Sheets configuration');
      }
    }
    
    console.log('\n🎉 Setup template created! Follow the steps above to complete the configuration.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  simpleGoogleSetup();
}

module.exports = { simpleGoogleSetup };
