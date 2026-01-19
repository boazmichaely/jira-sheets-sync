/**
 * Red Hat Customer Portal API Test Script
 * 
 * This script tests authentication and fetches a sample case
 * to understand the API response structure.
 * 
 * Before running:
 * 1. Replace YOUR_USERNAME and YOUR_PASSWORD below
 * 2. Run this as a standalone script to test the API
 * 3. Once working, we'll integrate into the full solution
 */

// Configuration
const TEST_CASE_NUMBER = '04257923'; // Sample case from requirements
const API_BASE_URL = 'https://access.redhat.com';
const API_ENDPOINT = `/hydra/rest/cases/${TEST_CASE_NUMBER}`;

// Credentials - Replace these with your Red Hat credentials
const RH_USERNAME = 'YOUR_USERNAME';  // Your Red Hat username (e.g., bmichael@redhat.com)
const RH_PASSWORD = 'YOUR_PASSWORD';  // Your Red Hat password or app-specific password

/**
 * Test the API connection and fetch a case
 */
function testCaseAPI() {
  Logger.log('Testing Red Hat Customer Portal API...');
  Logger.log('='.repeat(50));
  
  try {
    // Create Basic Auth header
    const credentials = Utilities.base64Encode(RH_USERNAME + ':' + RH_PASSWORD);
    const authHeader = 'Basic ' + credentials;
    
    // Set up request options
    const options = {
      method: 'get',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': 'Google Apps Script'
      },
      muteHttpExceptions: true // Don't throw errors, we'll handle them
    };
    
    // Make the API request
    const url = API_BASE_URL + API_ENDPOINT;
    Logger.log('Requesting: ' + url);
    Logger.log('');
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    Logger.log('Status Code: ' + statusCode);
    Logger.log('');
    
    if (statusCode === 200) {
      Logger.log('✅ SUCCESS! API authentication working!');
      Logger.log('');
      Logger.log('Response:');
      Logger.log('='.repeat(50));
      
      // Parse and pretty-print the JSON response
      const data = JSON.parse(responseText);
      Logger.log(JSON.stringify(data, null, 2));
      
      // Analyze available fields
      Logger.log('');
      Logger.log('Available fields in response:');
      Logger.log('='.repeat(50));
      for (const key in data) {
        Logger.log(`- ${key}: ${typeof data[key]}`);
      }
      
      return data;
      
    } else if (statusCode === 401) {
      Logger.log('❌ AUTHENTICATION FAILED');
      Logger.log('');
      Logger.log('Response: ' + responseText);
      Logger.log('');
      Logger.log('Possible solutions:');
      Logger.log('1. Check your username and password are correct');
      Logger.log('2. If you use SSO, you may need to generate an app-specific password');
      Logger.log('3. Check if your account has API access permissions');
      
    } else if (statusCode === 404) {
      Logger.log('❌ CASE NOT FOUND');
      Logger.log('Case number ' + TEST_CASE_NUMBER + ' does not exist or you don\'t have access to it.');
      Logger.log('Try a different case number that you know exists.');
      
    } else {
      Logger.log('❌ UNEXPECTED ERROR');
      Logger.log('Status: ' + statusCode);
      Logger.log('Response: ' + responseText);
    }
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
  }
}

/**
 * Test fetching multiple cases
 */
function testMultipleCases() {
  const caseNumbers = ['04257923', '04163027']; // Add more case numbers to test
  
  Logger.log('Testing multiple case fetches...');
  Logger.log('='.repeat(50));
  
  for (const caseNum of caseNumbers) {
    Logger.log(`\nFetching case: ${caseNum}`);
    Logger.log('-'.repeat(30));
    
    try {
      const credentials = Utilities.base64Encode(RH_USERNAME + ':' + RH_PASSWORD);
      const options = {
        method: 'get',
        headers: {
          'Authorization': 'Basic ' + credentials,
          'Accept': 'application/json'
        },
        muteHttpExceptions: true
      };
      
      const url = `${API_BASE_URL}/hydra/rest/cases/${caseNum}`;
      const response = UrlFetchApp.fetch(url, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode === 200) {
        const data = JSON.parse(response.getContentText());
        Logger.log(`✅ ${caseNum}: ${data.status || 'N/A'} - ${data.summary || data.description || 'N/A'}`);
      } else {
        Logger.log(`❌ ${caseNum}: Failed with status ${statusCode}`);
      }
      
      // Rate limiting - wait 500ms between requests
      Utilities.sleep(500);
      
    } catch (error) {
      Logger.log(`❌ ${caseNum}: Error - ${error.message}`);
    }
  }
}

/**
 * Menu function to add this to your Google Sheets menu
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧪 API Test')
    .addItem('Test Single Case', 'testCaseAPI')
    .addItem('Test Multiple Cases', 'testMultipleCases')
    .addToUi();
}

