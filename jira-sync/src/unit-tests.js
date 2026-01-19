/**
 * Unit Tests for Multi-User Jira Sync
 * Run each function individually to identify issues
 */

/**
 * Test 1: Check if we can get user information
 */
function testGetUser() {
  try {
    Logger.log('=== TEST 1: Get User ===');
    
    // Step 1: Get user object
    const user = Session.getActiveUser();
    const userExists = !!user;
    Logger.log('User object exists: %s', userExists);
    
    // Step 2: Get username
    let userName = null;
    
    if (user) {
      try {
        userName = user.getUsername();
      } catch (e) {
        userName = 'ERROR: ' + e.message;
      }
    }
    
    // Log results (multiple ways to ensure we see the value)
    Logger.log('Username: ' + userName);
    Logger.log('Username type: ' + typeof userName);
    Logger.log('Username length: ' + (userName ? userName.length : 'null'));
    console.log('Username console: ' + userName);
    
    // Return results
    const result = {
      success: true,
      user: user,
      username: userName,
      userExists: userExists
    };
    
    return result;
    
  } catch (error) {
    const errorMessage = error.message;
    const errorStack = error.stack;
    Logger.log('❌ TEST 1 FAILED: %s', errorMessage);
    Logger.log('Error stack: %s', errorStack);
    
    return {
      success: false,
      error: errorMessage,
      stack: errorStack
    };
  }
}

/**
 * Test 2: Check if getUserSheetName function works
 */
function testGetUserSheetName() {
  try {
    Logger.log('=== TEST 2: Get User Sheet Name ===');
    
    // Step 1: Check if function exists
    const functionExists = typeof getUserSheetName === 'function';
    Logger.log('getUserSheetName function exists: %s', functionExists);
    
    if (!functionExists) {
      const errorMsg = 'getUserSheetName function not found - check if config.js is loaded';
      throw new Error(errorMsg);
    }
    
    // Step 2: Check constants first
    const sheetBaseName = typeof SHEET_BASE_NAME !== 'undefined' ? SHEET_BASE_NAME : 'UNDEFINED';
    Logger.log('SHEET_BASE_NAME constant: %s', sheetBaseName);
    
    // Step 3: Try to get sheet name
    let sheetName = null;
    let sheetNameError = null;
    
    try {
      sheetName = getUserSheetName();
    } catch (e) {
      sheetNameError = e.message;
    }
    
    Logger.log('Sheet name result: %s', sheetName);
    Logger.log('Sheet name error: %s', sheetNameError);
    
    // Step 4: Return results
    const result = {
      success: sheetName !== null && !sheetNameError,
      sheetName: sheetName,
      error: sheetNameError,
      functionExists: functionExists,
      sheetBaseName: sheetBaseName
    };
    
    return result;
    
  } catch (error) {
    const errorMessage = error.message;
    const errorStack = error.stack;
    Logger.log('❌ TEST 2 FAILED: %s', errorMessage);
    Logger.log('Error stack: %s', errorStack);
    
    return {
      success: false,
      error: errorMessage,
      stack: errorStack
    };
  }
}

/**
 * Test 3: Check if config constants are accessible
 */
function testConfigConstants() {
  try {
    Logger.log('=== TEST 3: Config Constants ===');
    
    // Step 1: Check each constant individually
    const jiraBaseUrl = typeof JIRA_BASE_URL !== 'undefined' ? JIRA_BASE_URL : 'UNDEFINED';
    const filterId = typeof FILTER_ID !== 'undefined' ? FILTER_ID : 'UNDEFINED';
    const sheetBaseName = typeof SHEET_BASE_NAME !== 'undefined' ? SHEET_BASE_NAME : 'UNDEFINED';
    const maxResults = typeof MAX_RESULTS !== 'undefined' ? MAX_RESULTS : 'UNDEFINED';
    
    // Step 2: Log each constant
    Logger.log('JIRA_BASE_URL: %s', jiraBaseUrl);
    Logger.log('FILTER_ID: %s', filterId);
    Logger.log('SHEET_BASE_NAME: %s', sheetBaseName);
    Logger.log('MAX_RESULTS: %s', maxResults);
    
    // Step 3: Build constants object
    const constants = {
      JIRA_BASE_URL: jiraBaseUrl,
      FILTER_ID: filterId,
      SHEET_BASE_NAME: sheetBaseName,
      MAX_RESULTS: maxResults
    };
    
    // Step 4: Check for missing constants
    const missingConstants = Object.entries(constants)
      .filter(([key, value]) => value === 'UNDEFINED')
      .map(([key]) => key);
    
    const allConstantsFound = missingConstants.length === 0;
    Logger.log('Missing constants: %s', JSON.stringify(missingConstants));
    Logger.log('All constants found: %s', allConstantsFound);
    
    // Step 5: Return results
    const result = {
      success: allConstantsFound,
      constants: constants,
      missingConstants: missingConstants,
      jiraBaseUrl: jiraBaseUrl,
      filterId: filterId,
      sheetBaseName: sheetBaseName,
      maxResults: maxResults
    };
    
    if (!allConstantsFound) {
      result.error = `Missing constants: ${missingConstants.join(', ')}`;
    }
    
    return result;
    
  } catch (error) {
    const errorMessage = error.message;
    const errorStack = error.stack;
    Logger.log('❌ TEST 3 FAILED: %s', errorMessage);
    Logger.log('Error stack: %s', errorStack);
    
    return {
      success: false,
      error: errorMessage,
      stack: errorStack
    };
  }
}

/**
 * Test 4: Test getCurrentConfig function
 */
function testGetCurrentConfig() {
  try {
    Logger.log('=== TEST 4: Get Current Config ===');
    
    // Step 1: Check if function exists
    const functionExists = typeof getCurrentConfig === 'function';
    Logger.log('getCurrentConfig function exists: %s', functionExists);
    
    if (!functionExists) {
      const errorMsg = 'getCurrentConfig function not found - check if menu-functions.js is loaded';
      throw new Error(errorMsg);
    }
    
    // Step 2: Try to call the function step by step
    let config = null;
    let configError = null;
    let partialConfig = {};
    
    try {
      // Try to build config manually to see which part fails
      const filterId = FILTER_ID;
      const maxResults = MAX_RESULTS;
      const baseUrl = JIRA_BASE_URL;
      
      partialConfig.filterId = filterId;
      partialConfig.maxResults = maxResults;
      partialConfig.baseUrl = baseUrl;
      
      Logger.log('Partial config (constants): %s', JSON.stringify(partialConfig));
      
      // Now try the problematic parts
      let sheetName = null;
      let userName = null;
      
      try {
        sheetName = getUserSheetName();
      } catch (e) {
        sheetName = 'ERROR: ' + e.message;
      }
      
      try {
        userName = Session.getActiveUser().getUsername();
      } catch (e) {
        userName = 'ERROR: ' + e.message;
      }
      
      partialConfig.sheetName = sheetName;
      partialConfig.userName = userName;
      
      Logger.log('Sheet name result: %s', sheetName);
      Logger.log('User name result: %s', userName);
      
      // Now try the full function
      config = getCurrentConfig();
      
    } catch (e) {
      configError = e.message;
    }
    
    Logger.log('Config result: %s', JSON.stringify(config));
    Logger.log('Config error: %s', configError);
    Logger.log('Partial config built: %s', JSON.stringify(partialConfig));
    
    // Step 3: Return results
    const result = {
      success: config !== null && !configError,
      config: config,
      error: configError,
      functionExists: functionExists,
      partialConfig: partialConfig,
      sheetName: partialConfig.sheetName,
      userName: partialConfig.userName
    };
    
    return result;
    
  } catch (error) {
    const errorMessage = error.message;
    const errorStack = error.stack;
    Logger.log('❌ TEST 4 FAILED: %s', errorMessage);
    Logger.log('Error stack: %s', errorStack);
    
    return {
      success: false,
      error: errorMessage,
      stack: errorStack
    };
  }
}

/**
 * Test 5: Test spreadsheet access
 */
function testSpreadsheetAccess() {
  try {
    Logger.log('=== TEST 5: Spreadsheet Access ===');
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet accessible');
    Logger.log('Spreadsheet name: %s', spreadsheet.getName());
    Logger.log('Spreadsheet ID: %s', spreadsheet.getId());
    
    const sheets = spreadsheet.getSheets();
    Logger.log('Available sheets: %s', JSON.stringify(sheets.map(sheet => sheet.getName())));
    
    return {
      success: true,
      spreadsheetName: spreadsheet.getName(),
      sheetNames: sheets.map(sheet => sheet.getName())
    };
  } catch (error) {
    Logger.log('❌ TEST 5 FAILED: %s', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test 6: Test UI access (this might be limited in script editor)
 */
function testUIAccess() {
  try {
    Logger.log('=== TEST 6: UI Access ===');
    
    const ui = SpreadsheetApp.getUi();
    Logger.log('✅ UI accessible');
    
    // Note: Can't actually show dialog in script editor, just test access
    Logger.log('UI object exists: %s', !!ui);
    Logger.log('ButtonSet accessible: %s', !!ui.ButtonSet);
    
    return {
      success: true,
      uiAccessible: true
    };
  } catch (error) {
    Logger.log('❌ TEST 6 FAILED: %s', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Run all tests in sequence
 */
function runAllTests() {
  Logger.log('🧪 Starting All Unit Tests...\n');
  
  const results = {
    test1: testGetUser(),
    test2: testGetUserSheetName(),
    test3: testConfigConstants(),
    test4: testGetCurrentConfig(),
    test5: testSpreadsheetAccess(),
    test6: testUIAccess()
  };
  
  Logger.log('\n📊 TEST SUMMARY:');
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    Logger.log(`${testName}: ${status}`);
    if (!result.success) {
      Logger.log(`  Error: ${result.error}`);
    }
  });
  
  const passedTests = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.values(results).length;
  Logger.log(`\nResults: ${passedTests}/${totalTests} tests passed`);
  
  return results;
}

/**
 * Simplified config test without getUserSheetName
 */
function testSimpleConfig() {
  try {
    Logger.log('=== TEST: Simple Config (no user functions) ===');
    
    const config = {
      filterId: FILTER_ID,
      maxResults: MAX_RESULTS,
      baseUrl: JIRA_BASE_URL,
      // Skip user-dependent functions for now
      sheetName: 'TEST-SHEET',
      userName: 'TEST-USER'
    };
    
    Logger.log('✅ Simple config works: %s', JSON.stringify(config, null, 2));
    return { success: true, config: config };
  } catch (error) {
    Logger.log('❌ Simple config failed: %s', error.message);
    return { success: false, error: error.message };
  }
}
