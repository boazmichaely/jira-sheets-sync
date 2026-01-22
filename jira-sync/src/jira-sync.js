/**
 * === Enhanced Jira to Google Sheets Sync ===
 * 
 * Professional solution with issue key matching for data preservation.
 * Syncs your RFE filter to Google Sheets while preserving custom prioritization columns.
 * 
 * Features:
 * - Issue key matching preserves custom data during sync
 * - Handles new/deleted issues gracefully
 * - Maintains your sheet ordering (new issues at end)
 * - Converts LexoRank to human-readable ranking (1, 2, 3...)
 * - Preserves custom prioritization columns
 * 
 * Setup:
 * 1. Update token.js with your Jira Personal Access Token
 * 2. Run syncJiraIssues() to test
 * 3. Manual sync only - run when needed
 */

/**
 * Main sync function - fetches Jira issues and updates Google Sheet
 * 
 * Sync logic:
 * 1. Maintain user's sort order
 * 2. Delete rows for issues no longer in Jira
 * 3. Update Jira columns for existing issues (preserve RICE)
 * 4. Add new issues at end with default RICE values
 */
function syncJiraIssues() {
  try {
    Logger.log('=== Starting Jira Sync ===');
    
    // Get or create the sheet
    const sheet = getSheet();
    
    // Show confirmation before sync
    const ui = SpreadsheetApp.getUi();
    const sheetName = getUserSheetName();
    const response = ui.alert(
      'Confirm Sync',
      `Ready to sync Jira issues to:\n"${sheetName}"\n\nThis will update the sheet with your current Jira filter results.\n\nProceed?`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response !== ui.Button.OK) {
      Logger.log('Sync cancelled by user');
      return;
    }
    
    // Clear any active filter criteria but keep filter dropdowns
    const filter = sheet.getFilter();
    if (filter) {
      const filterRange = filter.getRange();
      filter.remove();
      sheet.getRange(filterRange.getA1Notation()).createFilter();
      logDebug(' Cleared filter criteria');
    }
    
    // Step 1: Fetch issues from Jira
    logDebug(' Step 1 - Fetching issues from Jira...');
    const jiraIssues = fetchJiraIssues();
    if (!jiraIssues || jiraIssues.length === 0) {
      Logger.log('No issues found in Jira filter');
      return;
    }
    logDebug(' Fetched %s issues from Jira', jiraIssues.length);
    
    // Build Jira issue map and rank map
    const jiraIssueMap = {};
    const jiraRankMap = {};
    jiraIssues.forEach((issue, index) => {
      jiraIssueMap[issue.key] = issue;
      jiraRankMap[issue.key] = index + 1;
    });
    logDebug(' Built Jira maps for %s issues', Object.keys(jiraIssueMap).length);
    
    // Step 2: Read current sheet state
    logDebug(' Step 2 - Reading current sheet state...');
    const sheetState = readSheetState(sheet);
    logDebug(' Found %s existing issues in sheet', Object.keys(sheetState.issueRows).length);
    
    // Step 3: Determine what to do with each issue
    logDebug(' Step 3 - Categorizing issues...');
    const existingKeys = Object.keys(sheetState.issueRows);
    const jiraKeys = new Set(Object.keys(jiraIssueMap));
    
    const toDelete = existingKeys.filter(key => !jiraKeys.has(key));
    const toUpdate = existingKeys.filter(key => jiraKeys.has(key));
    const toAdd = [...jiraKeys].filter(key => !sheetState.issueRows[key]);
    
    logDebug(' To DELETE: %s issues (%s)', toDelete.length, toDelete.join(', ') || 'none');
    logDebug(' To UPDATE: %s issues', toUpdate.length);
    logDebug(' To ADD: %s issues (%s)', toAdd.length, toAdd.join(', ') || 'none');
    
    // Step 4: Delete rows for removed issues (from bottom to top to preserve row numbers)
    logDebug(' Step 4 - Deleting removed issues...');
    if (toDelete.length > 0) {
      const rowsToDelete = toDelete.map(key => sheetState.issueRows[key]).sort((a, b) => b - a);
      logDebug(' Deleting rows (bottom to top): %s', rowsToDelete.join(', '));
      rowsToDelete.forEach(row => {
        sheet.deleteRow(row);
        logDebug(' Deleted row %s', row);
      });
    }
    
    // Step 5: Re-read sheet state after deletions (row numbers have changed)
    logDebug(' Step 5 - Re-reading sheet state after deletions...');
    const updatedSheetState = readSheetState(sheet);
    logDebug(' Sheet now has %s issues', Object.keys(updatedSheetState.issueRows).length);
    
    // Step 6: Update existing issues in place (Jira columns only, preserve RICE)
    logDebug(' Step 6 - Updating existing issues in place...');
    toUpdate.forEach(key => {
      const row = updatedSheetState.issueRows[key];
      if (row) {
        const issue = jiraIssueMap[key];
        const rowData = buildJiraRowData(issue, jiraRankMap[key]);
        sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
        logDebug(' Updated row %s for %s', row, key);
      }
    });
    
    // Step 7: Add new issues at the end with default RICE values (batched for performance)
    logDebug(' Step 7 - Adding new issues...');
    if (toAdd.length > 0) {
      const lastRow = sheet.getLastRow();
      const startRow = lastRow > 0 ? lastRow + 1 : 2; // Start at row 2 if sheet is empty
      const rowCount = toAdd.length;
      logDebug(' Adding %s new issues starting at row %s (batched)', rowCount, startRow);
      
      // Build all row data at once
      const allRowData = toAdd.map(key => {
        const issue = jiraIssueMap[key];
        return buildJiraRowData(issue, jiraRankMap[key]);
      });
      
      // Write all Jira data in one batch
      sheet.getRange(startRow, 1, rowCount, allRowData[0].length).setValues(allRowData);
      logDebug(' Wrote %s rows of Jira data', rowCount);
      
      // Apply RICE to all new rows in batch
      applyRiceToRows(sheet, startRow, rowCount);
      logDebug(' Applied RICE to %s new rows', rowCount);
    }
    
    // Step 8: Ensure headers are present
    logDebug(' Step 8 - Ensuring headers...');
    writeHeaders(sheet);
    
    Logger.log('=== Sync Complete: %s updated, %s added, %s deleted ===', 
               toUpdate.length, toAdd.length, toDelete.length);
    
  } catch (error) {
    Logger.log('ERROR: Sync failed: %s', error.message);
    throw error;
  }
}

/**
 * Read the current state of the sheet
 * Returns map of {issueKey -> rowNumber}
 */
function readSheetState(sheet) {
  const state = {
    issueRows: {},  // {issueKey -> rowNumber}
    lastRow: sheet.getLastRow()
  };
  
  if (state.lastRow <= 1) {
    logDebug(' Sheet is empty (no data rows)');
    return state;
  }
  
  // Read the Key column (column A)
  const keyRange = sheet.getRange(2, 1, state.lastRow - 1, 1);
  const keys = keyRange.getValues();
  
  keys.forEach((row, index) => {
    const cellValue = row[0];
    if (cellValue) {
      // Extract issue key from hyperlink formula if needed
      let issueKey = cellValue;
      if (typeof cellValue === 'string' && cellValue.includes('HYPERLINK')) {
        const match = cellValue.match(/"([^"]+)"\s*\)$/);
        if (match) issueKey = match[1];
      }
      state.issueRows[issueKey] = index + 2; // +2 for header row and 0-indexing
    }
  });
  
  return state;
}

/**
 * Build a row of Jira data for an issue
 */
function buildJiraRowData(issue, rank) {
  return JIRA_FIELDS.map(fieldName => {
    if (fieldName === 'key') {
      // Return hyperlink formula for the key
      const url = `${JIRA_BASE_URL}/browse/${issue.key}`;
      return `=HYPERLINK("${url}","${issue.key}")`;
    } else if (fieldName === 'customfield_12311940') {
      // Replace LexoRank with position number
      return rank || '';
    } else {
      let value = issue.fields[fieldName];
      return extractSimpleValue(value);
    }
  });
}

/**
 * Apply RICE columns (dropdowns, formula, defaults) to multiple rows at once (batched for performance)
 */
function applyRiceToRows(sheet, startRow, rowCount) {
  const riceStartColumn = JIRA_FIELDS.length + 1;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Default values
  const defaults = {
    reach: 1,
    impact: 'Nice to have',
    confidence: 'Very low',
    effort: 'XL'
  };
  
  // Build default values array for all rows
  const defaultData = [];
  for (let i = 0; i < rowCount; i++) {
    defaultData.push([defaults.reach, defaults.impact, defaults.confidence, defaults.effort]);
  }
  
  // Set default values for all rows at once
  sheet.getRange(startRow, riceStartColumn, rowCount, 4).setValues(defaultData);
  
  // Setup dropdowns for all rows at once using named ranges (first column only)
  const impactMapping = spreadsheet.getRangeByName('Impact_Mapping');
  const impactRange = impactMapping.offset(0, 0, impactMapping.getNumRows(), 1);
  const impactRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(impactRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, riceStartColumn + 1, rowCount).setDataValidation(impactRule);
  
  const confidenceMapping = spreadsheet.getRangeByName('Confidence_Mapping');
  const confidenceRange = confidenceMapping.offset(0, 0, confidenceMapping.getNumRows(), 1);
  const confidenceRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(confidenceRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, riceStartColumn + 2, rowCount).setDataValidation(confidenceRule);
  
  const effortMapping = spreadsheet.getRangeByName('Effort_Mapping');
  const effortRange = effortMapping.offset(0, 0, effortMapping.getNumRows(), 1);
  const effortRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(effortRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, riceStartColumn + 3, rowCount).setDataValidation(effortRule);
  
  // Setup RICE Score formula for all rows at once
  const reachCol = columnToLetter(riceStartColumn);
  const impactCol = columnToLetter(riceStartColumn + 1);
  const confidenceCol = columnToLetter(riceStartColumn + 2);
  const effortCol = columnToLetter(riceStartColumn + 3);
  const scoreColumn = riceStartColumn + 4;
  
  // Formula uses row 2 reference - Google Sheets will auto-adjust for each row
  const scoreFormula = `=Score_Weight*(${reachCol}${startRow} * (xlookup(${impactCol}${startRow},INDEX(Impact_Mapping,,1),INDEX(Impact_Mapping,,2))*Impact_Weight) * (xlookup(${confidenceCol}${startRow},INDEX(Confidence_Mapping,,1),INDEX(Confidence_Mapping,,2) ) * Confidence_Weight)) / (xlookup(${effortCol}${startRow},INDEX(Effort_Mapping,,1),INDEX(Effort_Mapping,,2)) * Effort_Weight)`;
  
  const scoreRange = sheet.getRange(startRow, scoreColumn, rowCount);
  scoreRange.setFormula(scoreFormula);
  scoreRange.setNumberFormat('0.00');
  
  logDebug(' Applied RICE (defaults, dropdowns, formula) to rows %s-%s', startRow, startRow + rowCount - 1);
}
  
  /**
   * Get the target sheet, create if it doesn't exist
   */
  function getSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const currentUser = getCurrentUsername();
    const sheetName = getUserSheetName();
    
    Logger.log('Current user: %s, Target sheet: %s', currentUser, sheetName);
    
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Show confirmation before creating new sheet
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        'Create New Sheet?',
        `Sheet "${sheetName}" does not exist.\n\nDo you want to create it for your Jira sync?`,
        ui.ButtonSet.OK_CANCEL
      );
      
      if (response !== ui.Button.OK) {
        throw new Error('Sheet creation cancelled by user');
      }
      
      sheet = spreadsheet.insertSheet(sheetName);
      Logger.log(`Created new sheet: ${sheetName}`);
      
      // Initialize the new sheet with proper formatting
      initializeNewSheet(sheet);
    }
    
    return sheet;
  }

  /**
   * Initialize a new sheet with proper formatting and setup
   */
  function initializeNewSheet(sheet) {
    try {
      Logger.log('Initializing new sheet with formatting...');
      
      // Set freeze panes: 1 row (headers) and 2 columns (Key + Summary)
      sheet.setFrozenRows(1);
      sheet.setFrozenColumns(2);
      Logger.log('Applied freeze: 1 row, 2 columns');
      
      // Set basic sheet properties
      sheet.getRange('A1').activate(); // Set active cell to A1
      Logger.log('Set active cell to A1');
      
      // Setup RICE column headers only (dropdowns/formulas applied after data is written)
      Logger.log('Setting up RICE headers for new sheet...');
      const riceStartColumn = JIRA_FIELDS.length + 1;
      const riceHeaders = ['Reach', 'Impact', 'Confidence', 'Effort', 'RICE Score'];
      
      // Add RICE headers
      sheet.getRange(1, riceStartColumn, 1, riceHeaders.length).setValues([riceHeaders]);
      Logger.log('Added RICE headers: %s', riceHeaders.join(', '));
      
      // Format RICE headers (Reach, Impact, Confidence, Effort) with yellow background
      sheet.getRange(1, riceStartColumn, 1, 4)
        .setFontWeight('bold')
        .setBackground('#ffff00');
      
      // Format Score header with light magenta orange background
      sheet.getRange(1, riceStartColumn + 4, 1, 1)
        .setFontWeight('bold')
        .setBackground('#ffcc99');
      
      // Note: RICE dropdowns and formulas are applied after data is written
      // by ensureRiceColumnsForDataRows() in syncJiraIssues()
      
      Logger.log('✅ Sheet initialization complete (RICE formulas applied after data sync)');
      
    } catch (error) {
      Logger.log('❌ Sheet initialization failed: %s', error.message);
      // Don't throw - initialization failure shouldn't stop the sync
    }
  }
  
  /**
* Fetch issues from Jira ordered by Rank ASC
* Uses the current user's filter ID from User_Mapping
*/
function fetchJiraIssues() {
  const filterId = getUserFilterId();
  const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${filterId} ORDER BY Rank ASC&maxResults=${MAX_RESULTS}&fields=${JIRA_FIELDS.join(',')}`;
  
  logDebug(' Fetching from Jira with filter ID: %s', filterId);
  
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': `Bearer ${JIRA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Jira API error: ${response.getResponseCode()}`);
  }
  
  const data = JSON.parse(response.getContentText());
  Logger.log(`Fetched ${data.issues.length} issues from Jira (filter: ${filterId}, max: ${MAX_RESULTS})`);
  
  return data.issues;
}
  
  /**
   * Write column headers
   */
  function writeHeaders(sheet) {
    // Use the configured column headers from config.js
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setFontWeight('bold');
    // Note: Freeze panes are now handled in initializeNewSheet() for new sheets
  }
  
  /**
   * Simple value extraction for common Jira field types
   */
  function extractSimpleValue(value) {
    if (!value) return '';
    
    // Handle objects (status, user fields, etc.)
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value.displayName || value.name || value.emailAddress || '';
    }
    
    // Handle arrays (labels, components)
    if (Array.isArray(value)) {
      return value.map(item => item.name || item).join(', ');
    }
    
    return value.toString();
  }
  
/**
 * Convert column number to letter (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 */
function columnToLetter(column) {
  let result = '';
  while (column > 0) {
    column--;
    result = String.fromCharCode(65 + (column % 26)) + result;
    column = Math.floor(column / 26);
  }
  return result;
}

/**
 * Test Jira connection - run this first to verify setup
 * Uses the current user's filter ID from User_Mapping
 */
  function testConnection() {
    try {
      const filterId = getUserFilterId();
      const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${filterId}&maxResults=1`;
      
      Logger.log('Testing connection with filter ID: %s', filterId);
      
      const response = UrlFetchApp.fetch(url, {
        headers: {
          'Authorization': `Bearer ${JIRA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.getResponseCode() === 200) {
        const data = JSON.parse(response.getContentText());
        Logger.log(`✅ Connection successful! Found ${data.total} issues in filter ${filterId} (configured limit: ${MAX_RESULTS})`);
        return true;
      } else {
        Logger.log(`❌ Connection failed: ${response.getResponseCode()}`);
        return false;
      }
    } catch (error) {
      Logger.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }
  
  
  