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
    const sheetBaseName = typeof SHEET_BASE_NAME !== 'undefined' ? SHEET_BASE_NAME : 'UNDEFINED';
    const maxResults = typeof MAX_RESULTS !== 'undefined' ? MAX_RESULTS : 'UNDEFINED';
    const teamSheetName = typeof TEAM_SHEET_NAME !== 'undefined' ? TEAM_SHEET_NAME : 'UNDEFINED';
    
    // Step 2: Log each constant
    Logger.log('JIRA_BASE_URL: %s', jiraBaseUrl);
    Logger.log('SHEET_BASE_NAME: %s', sheetBaseName);
    Logger.log('MAX_RESULTS: %s', maxResults);
    Logger.log('TEAM_SHEET_NAME: %s', teamSheetName);
    
    // Step 3: Build constants object
    const constants = {
      JIRA_BASE_URL: jiraBaseUrl,
      SHEET_BASE_NAME: sheetBaseName,
      MAX_RESULTS: maxResults,
      TEAM_SHEET_NAME: teamSheetName
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
      missingConstants: missingConstants
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
 * Test 4: Test user filter lookup
 */
function testUserFilterLookup() {
  try {
    Logger.log('=== TEST 4: User Filter Lookup ===');
    
    // Step 1: Get username
    let userName = null;
    try {
      userName = getCurrentUsername();
      Logger.log('Current username: %s', userName);
    } catch (e) {
      Logger.log('Error getting username: %s', e.message);
      throw e;
    }
    
    // Step 2: Get filter ID
    let filterId = null;
    try {
      filterId = getUserFilterId();
      Logger.log('User filter ID: %s', filterId);
    } catch (e) {
      Logger.log('Error getting filter ID: %s', e.message);
      throw e;
    }
    
    // Step 3: Get sheet name
    let sheetName = null;
    try {
      sheetName = getUserSheetName();
      Logger.log('User sheet name: %s', sheetName);
    } catch (e) {
      Logger.log('Error getting sheet name: %s', e.message);
      throw e;
    }
    
    Logger.log('✅ User filter lookup successful');
    
    return {
      success: true,
      userName: userName,
      filterId: filterId,
      sheetName: sheetName
    };
    
  } catch (error) {
    const errorMessage = error.message;
    Logger.log('❌ TEST 4 FAILED: %s', errorMessage);
    
    return {
      success: false,
      error: errorMessage
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
    test4: testUserFilterLookup(),
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
 * Simplified config test without user functions
 */
function testSimpleConfig() {
  try {
    Logger.log('=== TEST: Simple Config (no user functions) ===');
    
    const config = {
      maxResults: MAX_RESULTS,
      baseUrl: JIRA_BASE_URL,
      teamSheetName: TEAM_SHEET_NAME,
      sheetBaseName: SHEET_BASE_NAME
    };
    
    Logger.log('✅ Simple config works: %s', JSON.stringify(config, null, 2));
    return { success: true, config: config };
  } catch (error) {
    Logger.log('❌ Simple config failed: %s', error.message);
    return { success: false, error: error.message };
  }
}

// ===========================================
// JIRA WRITE TESTS
// ===========================================

/**
 * Test writing a single field to Jira
 * Uses test issue ROX-31895
 * Currently focused on Confidence field debugging
 * 
 * TO TEST: Uncomment ONE testValue line, comment the others
 */
function testJiraWriteSingleField() {
  const TEST_ISSUE_KEY = 'ROX-31895';
  const fieldId = 'customfield_12320847';  // Jira Confidence
  
  // ===== UNCOMMENT ONE OF THESE =====
  var testValue = '50% (Low)';                    // Format 1: Plain string
  // var testValue = { value: '50% (Low)' };      // Format 2: Object with value
  // var testValue = { name: '50% (Low)' };       // Format 3: Object with name
  // var testValue = { id: '12345' };             // Format 4: Object with id (find actual ID)
  // ===================================
  
  try {
    Logger.log('=== TEST: Jira Write Confidence Field ===');
    Logger.log('Test issue: %s', TEST_ISSUE_KEY);
    Logger.log('Writing field %s with value %s', fieldId, JSON.stringify(testValue));
    
    const result = writeFieldToJira(TEST_ISSUE_KEY, fieldId, testValue);
    
    Logger.log('✅ Write successful! Response code: %s', result.responseCode);
    return { success: true, responseCode: result.responseCode };
    
  } catch (error) {
    Logger.log('❌ Write failed: %s', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test writing all RICE fields to Jira in a SINGLE API call
 * Uses test issue ROX-31895
 */
function testJiraWriteAllRiceFields() {
  const TEST_ISSUE_KEY = 'ROX-31895';
  
  // RICE field IDs from config
  const RICE_FIELD_IDS = {
    reach: 'customfield_12320846',
    impact: 'customfield_12320740',
    confidence: 'customfield_12320847',
    effort: 'customfield_12320848'
  };
  
  try {
    Logger.log('=== TEST: Jira Write All RICE Fields (Single API Call) ===');
    Logger.log('Test issue: %s', TEST_ISSUE_KEY);
    
    // Test values - adjust these as needed
    // Note: Confidence requires { value: '...' } format
    const testValues = {
      reach: 50,
      impact: 100,
      confidence: { value: '50% (Low)' },  // Object format required for Confidence
      effort: 5
    };
    
    // Build payload with all fields
    const payload = {
      fields: {
        [RICE_FIELD_IDS.reach]: testValues.reach,
        [RICE_FIELD_IDS.impact]: testValues.impact,
        [RICE_FIELD_IDS.confidence]: testValues.confidence,
        [RICE_FIELD_IDS.effort]: testValues.effort
      }
    };
    
    Logger.log('Payload: %s', JSON.stringify(payload, null, 2));
    
    const url = `${JIRA_BASE_URL}/rest/api/2/issue/${TEST_ISSUE_KEY}`;
    
    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log('Response code: %s', responseCode);
    if (responseBody) {
      Logger.log('Response body: %s', responseBody);
    }
    
    if (responseCode >= 200 && responseCode < 300) {
      Logger.log('✅ All RICE fields written successfully in single call!');
      return { success: true, responseCode: responseCode };
    } else {
      Logger.log('❌ Write failed with code %s: %s', responseCode, responseBody);
      return { success: false, responseCode: responseCode, error: responseBody };
    }
    
  } catch (error) {
    Logger.log('❌ Test failed: %s', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test writing RICE fields to multiple issues with progress indication
 */
function testJiraWriteMultipleIssues() {
  // Test issues with distinct values for each
  const testIssues = [
    {
      key: 'ROX-31895',
      reach: 6,
      impact: 11,
      confidence: { id: '27779' },  // 50% (Low) - swapped
      effort: 21
    },
    {
      key: 'ROX-32132',
      reach: 51,
      impact: 101,
      confidence: { id: '27778' },  // 75% (Medium) - swapped
      effort: 201
    },
    {
      key: 'ROX-32017',
      reach: 501,
      impact: 1001,
      confidence: { id: '-1' },  // None - swapped
      effort: 2001
    }
  ];
  
  // RICE field IDs
  const RICE_FIELD_IDS = {
    reach: 'customfield_12320846',
    impact: 'customfield_12320740',
    confidence: 'customfield_12320847',
    effort: 'customfield_12320848'
  };
  
  const totalIssues = testIssues.length;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Initial progress notification
  Logger.log('=== TEST: Jira Write Multiple Issues ===');
  Logger.log('Going to update RICE scores for %s issues. This may take a minute...', totalIssues);
  spreadsheet.toast(
    `Going to update RICE scores for ${totalIssues} issues. This may take a minute...`,
    'Push RICE to Jira',
    -1
  );
  
  const results = [];
  
  for (let i = 0; i < testIssues.length; i++) {
    const issue = testIssues[i];
    const issueKey = issue.key;
    const issueNum = i + 1;
    
    // Progress notification for each issue
    Logger.log('Writing issue %s out of %s (%s)...', issueNum, totalIssues, issueKey);
    spreadsheet.toast(
      `Writing issue ${issueNum} out of ${totalIssues} (${issueKey})...`,
      'Push RICE to Jira',
      -1
    );
    
    try {
      const payload = {
        fields: {
          [RICE_FIELD_IDS.reach]: issue.reach,
          [RICE_FIELD_IDS.impact]: issue.impact,
          [RICE_FIELD_IDS.confidence]: issue.confidence,
          [RICE_FIELD_IDS.effort]: issue.effort
        }
      };
      
      const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}`;
      
      const response = UrlFetchApp.fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JIRA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      
      if (responseCode >= 200 && responseCode < 300) {
        Logger.log('  ✅ %s updated successfully', issueKey);
        results.push({ issueKey: issueKey, success: true });
      } else {
        const responseBody = response.getContentText();
        Logger.log('  ❌ %s failed: %s', issueKey, responseBody);
        results.push({ issueKey: issueKey, success: false, error: responseBody });
      }
      
    } catch (error) {
      Logger.log('  ❌ %s error: %s', issueKey, error.message);
      results.push({ issueKey: issueKey, success: false, error: error.message });
    }
  }
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  Logger.log('');
  Logger.log('=== SUMMARY ===');
  Logger.log('Successfully updated: %s out of %s issues', successCount, totalIssues);
  
  if (successCount < totalIssues) {
    Logger.log('Failed issues:');
    results.filter(r => !r.success).forEach(r => {
      Logger.log('  - %s: %s', r.issueKey, r.error);
    });
  }
  
  return {
    success: successCount === totalIssues,
    total: totalIssues,
    successCount: successCount,
    results: results
  };
}

/**
 * Test Confidence "None" value on single issue
 * Try different IDs to find which one is "None"
 */
function testConfidenceNone() {
  const issueKey = 'ROX-31895';
  const fieldId = 'customfield_12320847';  // Jira Confidence
  
  // ===== TRY ONE OF THESE =====
  var testValue = { id: '27776' };   // Try before sequence
  // var testValue = { id: '27780' };   // Try after sequence
  // =============================
  
  Logger.log('=== TEST: Confidence "None" ===');
  Logger.log('Issue: %s', issueKey);
  Logger.log('Value: %s', JSON.stringify(testValue));
  
  try {
    const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}`;
    const payload = {
      fields: {
        [fieldId]: testValue
      }
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    if (responseCode >= 200 && responseCode < 300) {
      Logger.log('✅ SUCCESS! ID %s works', testValue.id);
      return { success: true };
    } else {
      Logger.log('❌ FAILED: %s', responseBody);
      return { success: false, error: responseBody };
    }
    
  } catch (error) {
    Logger.log('❌ ERROR: %s', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Discover available options for the Confidence field
 * Run this to find the option IDs
 */
function discoverConfidenceOptions() {
  const fieldId = 'customfield_12320847';  // Jira Confidence
  const url = `${JIRA_BASE_URL}/rest/api/2/field/${fieldId}/option`;
  
  Logger.log('=== Discovering Confidence Field Options ===');
  Logger.log('Field ID: %s', fieldId);
  Logger.log('URL: %s', url);
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    Logger.log('Response code: %s', responseCode);
    Logger.log('Response: %s', responseBody);
    
    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      Logger.log('\n=== CONFIDENCE OPTIONS ===');
      if (data.values) {
        data.values.forEach(opt => {
          Logger.log('  ID: %s, Value: %s', opt.id, opt.value);
        });
      } else if (Array.isArray(data)) {
        data.forEach(opt => {
          Logger.log('  ID: %s, Value: %s, Name: %s', opt.id, opt.value, opt.name);
        });
      }
      return data;
    } else {
      // Try alternative endpoint
      Logger.log('Trying alternative: fetch issue and inspect field...');
      return discoverConfidenceOptionsFromIssue();
    }
    
  } catch (error) {
    Logger.log('Error: %s', error.message);
    return discoverConfidenceOptionsFromIssue();
  }
}

/**
 * Get Confidence options by fetching an issue with createmeta
 */
function discoverConfidenceOptionsFromIssue() {
  const issueKey = 'ROX-31895';
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}/editmeta`;
  
  Logger.log('Fetching edit metadata for %s...', issueKey);
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    if (responseCode === 200) {
      const data = JSON.parse(responseBody);
      const confidenceField = data.fields && data.fields['customfield_12320847'];
      
      if (confidenceField && confidenceField.allowedValues) {
        Logger.log('\n=== CONFIDENCE OPTIONS ===');
        confidenceField.allowedValues.forEach(opt => {
          Logger.log('  ID: %s, Value: %s', opt.id, opt.value);
        });
        return confidenceField.allowedValues;
      } else {
        Logger.log('Confidence field not found in edit metadata');
        Logger.log('Available fields: %s', Object.keys(data.fields || {}).join(', '));
      }
    } else {
      Logger.log('Error: %s', responseBody);
    }
    
  } catch (error) {
    Logger.log('Error: %s', error.message);
  }
  
  return null;
}

/**
 * Write a single field to a Jira issue
 * @param {string} issueKey - The Jira issue key (e.g., 'ROX-31895')
 * @param {string} fieldId - The Jira field ID (e.g., 'customfield_12320846')
 * @param {*} value - The value to write
 * @returns {object} Response info
 */
function writeFieldToJira(issueKey, fieldId, value) {
  const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issueKey}`;
  
  const payload = {
    fields: {
      [fieldId]: value
    }
  };
  
  Logger.log('PUT %s', url);
  Logger.log('Payload: %s', JSON.stringify(payload));
  
  const response = UrlFetchApp.fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${JIRA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true  // Don't throw on non-2xx responses
  });
  
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();
  
  Logger.log('Response code: %s', responseCode);
  if (responseBody) {
    Logger.log('Response body: %s', responseBody);
  }
  
  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(`Jira API error ${responseCode}: ${responseBody}`);
  }
  
  return {
    responseCode: responseCode,
    body: responseBody
  };
}
