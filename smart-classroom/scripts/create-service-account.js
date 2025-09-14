const fs = require('fs');
const path = require('path');

console.log('🔧 Google Service Account Setup Guide');
console.log('=====================================\n');

console.log('📋 Step-by-Step Instructions:');
console.log('1. Go to: https://console.cloud.google.com/');
console.log('2. Select your project: "smart-classroom-platform"');
console.log('3. Go to: "APIs & Services" → "Credentials"');
console.log('4. Click: "Create Credentials" → "Service Account"');
console.log('5. Fill in:');
console.log('   - Service account name: smart-classroom-service');
console.log('   - Description: Service account for Google Sheets integration');
console.log('6. Click "Create and Continue"');
console.log('7. Skip role assignment (click "Continue")');
console.log('8. Click "Done"');
console.log('9. Find your service account in the list');
console.log('10. Click on the service account email');
console.log('11. Go to "Keys" tab');
console.log('12. Click "Add Key" → "Create new key"');
console.log('13. Choose "JSON" format');
console.log('14. Download the JSON file');
console.log('15. Replace the current credentials.json with the downloaded file\n');

console.log('📊 After getting the service account JSON:');
console.log('1. Copy the service account email (looks like: xxx@smart-classroom-platform.iam.gserviceaccount.com)');
console.log('2. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1yQq6znf_s_fIb--qovoAwVnWeFwP9ZZVaJ_3jpCuVKA/edit');
console.log('3. Click "Share" button');
console.log('4. Add the service account email with "Editor" permissions');
console.log('5. Click "Send"\n');

console.log('🎯 Expected Service Account JSON Structure:');
console.log('{');
console.log('  "type": "service_account",');
console.log('  "project_id": "smart-classroom-platform",');
console.log('  "private_key_id": "...",');
console.log('  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",');
console.log('  "client_email": "smart-classroom-service@smart-classroom-platform.iam.gserviceaccount.com",');
console.log('  "client_id": "...",');
console.log('  "auth_uri": "https://accounts.google.com/o/oauth2/auth",');
console.log('  "token_uri": "https://oauth2.googleapis.com/token"');
console.log('}\n');

console.log('⚠️  Current credentials are OAuth (for user login), but we need Service Account (for server access)');
console.log('✅ Once you have the service account JSON, replace: sheet-sync/credentials/credentials.json');
