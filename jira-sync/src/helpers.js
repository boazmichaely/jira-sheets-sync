/**
 * Helper functions for Jira Sync
 */

// ===========================================
// LOGGING FUNCTIONS
// ===========================================

/**
 * Log debug message (only if DEBUG is true in config.js)
 */
function logDebug(message, ...args) {
  if (DEBUG) {
    Logger.log(message, ...args);
  }
}

// ===========================================
// USER & CONFIGURATION FUNCTIONS
// ===========================================

/**
 * Get the current user's username (from Google account)
 * Returns the part before @ in their email
 * If TESTUSER is set in config.js, returns that instead (for testing)
 */
function getCurrentUsername() {
  // Use TESTUSER if set (for testing), otherwise real user
  if (typeof TESTUSER !== 'undefined' && TESTUSER) {
    // Validate TESTUSER exists in User_Mapping
    const filterId = validateAndGetFilterId(TESTUSER);
    Logger.log('⚠️ TEST MODE: Simulating user "%s" (filter ID: %s)', TESTUSER, filterId);
    return TESTUSER;
  }
  
  const userName = Session.getActiveUser().getUsername();
  if (!userName) {
    throw new Error('Unable to determine current user name');
  }
  return userName;
}

/**
 * Validate a username exists in User_Mapping and return their filter ID
 * Used for TESTUSER validation
 */
function validateAndGetFilterId(userName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  const mappingRange = spreadsheet.getRangeByName('User_Mapping');
  if (!mappingRange) {
    throw new Error('User_Mapping named range not found.');
  }
  
  const mappingData = mappingRange.getValues();
  
  for (let i = 0; i < mappingData.length; i++) {
    const mappedUser = mappingData[i][0];
    const filterId = mappingData[i][1];
    
    if (mappedUser && mappedUser.toString().toLowerCase() === userName.toLowerCase()) {
      return filterId;
    }
  }
  
  throw new Error(`TESTUSER "${userName}" not found in User_Mapping. Please add this user to the Guidance sheet.`);
}

/**
 * Get user-specific sheet name (e.g., "Jira - bmichael")
 */
function getUserSheetName() {
  return `${SHEET_BASE_NAME} - ${getCurrentUsername()}`;
}

/**
 * Get a filter ID from User_Mapping by key (username or special key like 'definition')
 * Returns the filter ID or throws an error if key not found
 */
function getFilterIdByKey(key) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const mappingRange = spreadsheet.getRangeByName('User_Mapping');
    if (!mappingRange) {
      throw new Error('User_Mapping named range not found. Please create it in the Guidance sheet.');
    }
    
    const mappingData = mappingRange.getValues();
    
    // Search for the key in the mapping
    for (let i = 0; i < mappingData.length; i++) {
      const mappedKey = mappingData[i][0];
      const filterId = mappingData[i][1];
      
      if (mappedKey && mappedKey.toString().toLowerCase() === key.toLowerCase()) {
        Logger.log('Found filter ID %s for key %s', filterId, key);
        return filterId;
      }
    }
    
    // Key not found in mapping
    throw new Error(`No Jira filter configured for "${key}". Please add it to the User_Mapping range in the Guidance sheet.`);
    
  } catch (error) {
    Logger.log('Error looking up filter for key "%s": %s', key, error.message);
    throw error;
  }
}

/**
 * Get the Jira filter ID for the current user from User_Mapping named range
 * Returns the filter ID or throws an error if user not found
 */
function getUserFilterId() {
  const userName = getCurrentUsername();
  return getFilterIdByKey(userName);
}

/**
 * Get the Jira filter ID for the team sheet from User_Mapping
 * Uses the TEAM_USER_KEY constant from config.js
 */
function getTeamFilterId() {
  return getFilterIdByKey(TEAM_USER_KEY);
}

// ===========================================
// FIELD DISCOVERY FUNCTIONS
// ===========================================

/**
 * Discover available Jira fields (run once to configure JIRA_FIELDS)
 * Uses the current user's filter ID from User_Mapping
 */
function discoverFields() {
  try {
    const filterId = getUserFilterId();
    const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${filterId}&maxResults=1`;
    
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('❌ Failed to fetch sample issue');
      return;
    }
    
    const data = JSON.parse(response.getContentText());
    if (!data.issues || data.issues.length === 0) {
      Logger.log('❌ No issues found in filter');
      return;
    }
    
    const issue = data.issues[0];
    Logger.log(`📋 Available fields for ${issue.key}:`);
    
    // Sort fields for easier reading
    const sortedFields = Object.keys(issue.fields).sort();
    
    sortedFields.forEach(fieldKey => {
      const fieldValue = issue.fields[fieldKey];
      let sample = 'null';
      
      if (fieldValue !== null && fieldValue !== undefined) {
        if (Array.isArray(fieldValue)) {
          sample = `[${fieldValue.length} items]`;
        } else if (typeof fieldValue === 'object') {
          sample = fieldValue.name || fieldValue.displayName || '{object}';
        } else {
          sample = fieldValue.toString().substring(0, 50);
        }
      }
      
      Logger.log(`  ${fieldKey} = ${sample}`);
    });
    
    Logger.log('\n💡 Update JIRA_FIELDS in config.js with the field names you need');
    
  } catch (error) {
    Logger.log(`❌ Field discovery failed: ${error.message}`);
  }
}
