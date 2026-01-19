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
 * Uses issue key matching to preserve custom data during sync
 */
function syncJiraIssues() {
  try {
    Logger.log('Starting enhanced Jira sync...');
    
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
      // Get the filter range
      const filterRange = filter.getRange();
      // Remove the old filter and recreate with no criteria (keeps dropdowns)
      filter.remove();
      sheet.getRange(filterRange.getA1Notation()).createFilter();
      Logger.log('Cleared filter criteria but kept filter dropdowns');
    }
    
    // Step 1: Read existing custom data before clearing
    const existingCustomData = readExistingCustomData(sheet);
    Logger.log(`Preserved custom data for ${Object.keys(existingCustomData).length} issues`);
    
    // Step 2: Fetch issues from Jira (ordered by Rank ASC)
    const jiraIssues = fetchJiraIssues();
    if (!jiraIssues || jiraIssues.length === 0) {
      Logger.log('No issues found in filter');
      return;
    }
    
    // Step 3: Merge with existing sheet order, new issues at end
    const orderedIssues = mergeWithExistingOrder(sheet, jiraIssues);
    
    // Step 4: Clear existing Jira data (preserve custom columns)
    clearJiraColumns(sheet);
    
    // Step 5: Write headers and data with ranking
    writeHeaders(sheet);
    writeIssueDataWithRanking(sheet, orderedIssues, jiraIssues);
    
    // Step 6: Restore custom data by issue key
    restoreCustomDataByKey(sheet, existingCustomData);
    
    Logger.log(`Enhanced sync complete: ${jiraIssues.length} issues updated`);
    
  } catch (error) {
    Logger.log(`Sync failed: ${error.message}`);
    throw error;
  }
}
  
  /**
   * Get the target sheet, create if it doesn't exist
   */
  function getSheet() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = getUserSheetName();
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
      
      // Setup RICE columns automatically for new sheets
      Logger.log('Setting up RICE columns for new sheet...');
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
      
      // Set up dropdowns and RICE Score formula
      setupRiceDropdownsAndFormulas(sheet, riceStartColumn);
      Logger.log('✅ RICE columns setup complete for new sheet');
      
      Logger.log('✅ Sheet initialization complete');
      
    } catch (error) {
      Logger.log('❌ Sheet initialization failed: %s', error.message);
      // Don't throw - initialization failure shouldn't stop the sync
    }
  }
  
  /**
* Fetch issues from Jira ordered by Rank ASC
*/
function fetchJiraIssues() {
  const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${FILTER_ID} ORDER BY Rank ASC&maxResults=${MAX_RESULTS}&fields=${JIRA_FIELDS.join(',')}`;
  
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
  Logger.log(`Fetched ${data.issues.length} issues from Jira (ordered by Rank ASC, max: ${MAX_RESULTS})`);
  
  return data.issues;
}
  
  /**
   * Clear only the Jira columns, preserve custom prioritization columns
   */
  function clearJiraColumns(sheet) {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return; // No data to clear
    
    const jiraColumnCount = JIRA_FIELDS.length;
    sheet.getRange(2, 1, lastRow - 1, jiraColumnCount).clear();
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
 * Write issue data to sheet with Jira ranking
 */
function writeIssueDataWithRanking(sheet, orderedIssues, jiraIssues) {
  // Create rank mapping from Jira order (1-based)
  const jiraRankMap = {};
  jiraIssues.forEach((issue, index) => {
    jiraRankMap[issue.key] = index + 1;
  });
  
  const data = orderedIssues.map(issue => {
    return JIRA_FIELDS.map(fieldName => {
      if (fieldName === 'key') {
        return issue.key;
      } else if (fieldName === 'customfield_12311940') {
        // Replace LexoRank with Jira position number
        return jiraRankMap[issue.key] || '';
      } else {
        let value = issue.fields[fieldName];
        return extractSimpleValue(value);
      }
    });
  });
  
  if (data.length > 0) {
    // Write the data
    sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
    
    // Make Key column (column A) clickable URLs
    const keyColumnData = orderedIssues.map(issue => {
      const key = issue.key;
      const url = `${JIRA_BASE_URL}/browse/${key}`;
      return [`=HYPERLINK("${url}","${key}")`];
    });
    
    // Update column A with hyperlinks
    sheet.getRange(2, 1, keyColumnData.length, 1).setValues(keyColumnData);
  }
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
 * Read existing custom data from the sheet
 */
function readExistingCustomData(sheet) {
  const customData = {};
  
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return customData; // No data rows
    
    const customColumnStart = JIRA_FIELDS.length + 1; // Column N (14th column) 
    const customColumnCount = 5; // Reach, Impact, Confidence, Effort, Priority Score
    
    // Read key column (A) and custom columns (N-R)
    const keyRange = sheet.getRange(2, 1, lastRow - 1, 1);
    const customRange = sheet.getRange(2, customColumnStart, lastRow - 1, customColumnCount);
    
    const keys = keyRange.getValues().flat();
    const customValues = customRange.getValues();
    
    keys.forEach((key, index) => {
      if (key && typeof key === 'string') {
        // Extract just the issue key if it's a hyperlink formula
        const issueKey = key.includes('HYPERLINK') ? 
          key.match(/"([^"]+)"\s*\)$/)?.[1] || key : key;
        
        const customRow = customValues[index];
        if (customRow && customRow.some(cell => cell !== '')) {
          customData[issueKey] = {
            reach: customRow[0] || '',
            impact: customRow[1] || '',
            confidence: customRow[2] || '',
            effort: customRow[3] || '',
            score: customRow[4] || ''
          };
        }
      }
    });
    
  } catch (error) {
    Logger.log(`Error reading existing custom data: ${error.message}`);
  }
  
  return customData;
}

/**
 * Merge Jira issues with existing sheet order, new issues at end
 */
function mergeWithExistingOrder(sheet, jiraIssues) {
  const existingOrder = [];
  
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const keyRange = sheet.getRange(2, 1, lastRow - 1, 1);
      const keys = keyRange.getValues().flat();
      
      keys.forEach(key => {
        if (key && typeof key === 'string') {
          // Extract issue key from hyperlink if needed
          const issueKey = key.includes('HYPERLINK') ? 
            key.match(/"([^"]+)"\s*\)$/)?.[1] || key : key;
          existingOrder.push(issueKey);
        }
      });
    }
  } catch (error) {
    Logger.log(`Error reading existing order: ${error.message}`);
  }
  
  // Create map for quick lookup
  const jiraIssuesMap = {};
  jiraIssues.forEach(issue => {
    jiraIssuesMap[issue.key] = issue;
  });
  
  // Build ordered list: existing order first, then new issues
  const orderedIssues = [];
  const usedKeys = new Set();
  
  // Add existing issues in their current order
  existingOrder.forEach(key => {
    if (jiraIssuesMap[key]) {
      orderedIssues.push(jiraIssuesMap[key]);
      usedKeys.add(key);
    }
  });
  
  // Add new issues at the end
  jiraIssues.forEach(issue => {
    if (!usedKeys.has(issue.key)) {
      orderedIssues.push(issue);
    }
  });
  
  Logger.log(`Order: ${existingOrder.length} existing, ${orderedIssues.length - existingOrder.length} new issues`);
  return orderedIssues;
}

/**
 * Restore custom data by matching issue keys
 */
function restoreCustomDataByKey(sheet, customDataMap) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1 || Object.keys(customDataMap).length === 0) return;
    
    const customColumnStart = JIRA_FIELDS.length + 1; // Column M
    const keyRange = sheet.getRange(2, 1, lastRow - 1, 1);
    const keys = keyRange.getValues().flat();
    
    const restoreData = [];
    keys.forEach(key => {
      if (key && typeof key === 'string') {
        // Extract issue key from hyperlink if needed
        const issueKey = key.includes('HYPERLINK') ? 
          key.match(/"([^"]+)"\s*\)$/)?.[1] || key : key;
        
        const customData = customDataMap[issueKey];
        if (customData) {
          restoreData.push([customData.reach, customData.impact, customData.confidence, customData.effort, customData.score]);
        } else {
          restoreData.push(['', '', '', '', '']); // Empty for new issues
        }
      } else {
        restoreData.push(['', '', '', '', '']);
      }
    });
    
    if (restoreData.length > 0) {
      sheet.getRange(2, customColumnStart, restoreData.length, 5).setValues(restoreData);
      Logger.log(`Restored custom data for ${restoreData.filter(row => row.some(cell => cell !== '')).length} issues`);
    }
    
  } catch (error) {
    Logger.log(`Error restoring custom data: ${error.message}`);
  }
}

/**
 * Setup RICE columns for prioritization
 * Run this once for new user sheets to add RICE framework columns
 */
function setupRiceColumns() {
  try {
    Logger.log('Setting up RICE columns...');
    
    // Get the currently active sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    const sheetName = sheet.getName();
    
    // Show confirmation before modifying the active sheet
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Setup RICE Columns',
      `This will add RICE prioritization columns to the current sheet:\n"${sheetName}"\n\nColumns will be added after your existing data.\n\nProceed?`,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response !== ui.Button.OK) {
      Logger.log('RICE setup cancelled by user');
      return { success: false, message: 'Setup cancelled by user' };
    }
    
    // Calculate starting column (after JIRA fields)
    const riceStartColumn = JIRA_FIELDS.length + 1;
    Logger.log('RICE columns starting at column: %s', riceStartColumn);
    
    // RICE column headers
    const riceHeaders = ['Reach', 'Impact', 'Confidence', 'Effort', 'RICE Score'];
    
    // Add headers
    sheet.getRange(1, riceStartColumn, 1, riceHeaders.length).setValues([riceHeaders]);
    Logger.log('Added RICE headers: %s', riceHeaders.join(', '));
    
    // Format RICE headers (Reach, Impact, Confidence, Effort) with yellow background
    const riceHeaderRange = sheet.getRange(1, riceStartColumn, 1, 4); // First 4 columns
    riceHeaderRange
      .setFontWeight('bold')
      .setBackground('#ffff00'); // Yellow
    Logger.log('Applied yellow formatting to RICE headers');
    
    // Format Score header with light magenta orange background  
    const scoreHeaderRange = sheet.getRange(1, riceStartColumn + 4, 1, 1); // 5th column (Score)
    scoreHeaderRange
      .setFontWeight('bold')
      .setBackground('#ffcc99'); // Light magenta orange
    Logger.log('Applied light magenta orange formatting to Score header');
    
    // Set up dropdowns for Impact, Confidence, and Effort, plus RICE Score formula
    setupRiceDropdownsAndFormulas(sheet, riceStartColumn);
    
    Logger.log('✅ RICE columns setup complete!');
    
    return {
      success: true,
      startColumn: riceStartColumn,
      headers: riceHeaders
    };
    
  } catch (error) {
    Logger.log('❌ RICE setup failed: %s', error.message);
    throw error;
  }
}

/**
 * Setup dropdown validations for RICE columns and RICE Score formula
 */
function setupRiceDropdownsAndFormulas(sheet, startColumn) {
  try {
    // Column positions (relative to start column)
    const reachColumn = startColumn;      // N - no dropdown  
    const impactColumn = startColumn + 1; // O - Impact dropdown
    const confidenceColumn = startColumn + 2; // P - Confidence dropdown
    const effortColumn = startColumn + 3; // Q - Effort dropdown
    
    Logger.log('Setting up dropdowns at columns: Impact=%s, Confidence=%s, Effort=%s', 
               impactColumn, confidenceColumn, effortColumn);
    
    // Get the spreadsheet to reference the Guidance sheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Setup Impact dropdown (Column O) - =Guidance!$A$8:$A$11
    const impactRange = spreadsheet.getRange('Guidance!$A$8:$A$11');
    const impactRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(impactRange)
      .setAllowInvalid(false)
      .setHelpText('Select impact level from guidance sheet')
      .build();
    sheet.getRange(2, impactColumn, 1000).setDataValidation(impactRule);
    Logger.log('✅ Impact dropdown configured (Column %s)', impactColumn);
    
    // Setup Confidence dropdown (Column P) - =Guidance!$D$8:$D$13
    const confidenceRange = spreadsheet.getRange('Guidance!$D$8:$D$13');
    const confidenceRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(confidenceRange)
      .setAllowInvalid(false)
      .setHelpText('Select confidence level from guidance sheet')
      .build();
    sheet.getRange(2, confidenceColumn, 1000).setDataValidation(confidenceRule);
    Logger.log('✅ Confidence dropdown configured (Column %s)', confidenceColumn);
    
    // Setup Effort dropdown (Column Q) - =Guidance!$G$8:$G$12
    const effortRange = spreadsheet.getRange('Guidance!$G$8:$G$12');
    const effortRule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(effortRange)
      .setAllowInvalid(false)
      .setHelpText('Select effort level from guidance sheet')
      .build();
    sheet.getRange(2, effortColumn, 1000).setDataValidation(effortRule);
    Logger.log('✅ Effort dropdown configured (Column %s)', effortColumn);
    
    // Setup RICE Score formula (Column R)
    const scoreColumn = startColumn + 4;
    setupRiceScoreFormula(sheet, startColumn, scoreColumn);
    
  } catch (error) {
    Logger.log('❌ Dropdown setup failed: %s', error.message);
    throw error;
  }
}

/**
 * Setup RICE Score formula for the score column
 */
function setupRiceScoreFormula(sheet, startColumn, scoreColumn) {

  // = Score_Weight * $N2 * (xlookup($O2, INDEX(Impact_Mapping,,1), INDEX(Impact_Mapping,,2) ) * Impact_Weight ) * (xlookup($P2,INDEX(Confidence_Mapping,,1),INDEX(Confidence_Mapping,,2))*Confidence_Weight) / (xlookup($Q2,INDEX(Effort_Mapping,,1),INDEX(Effort_Mapping,,2))*Effort_Weight)

  try {
    // Convert column numbers to letters for formula
    const reachCol = columnToLetter(startColumn);
    const impactCol = columnToLetter(startColumn + 1);
    const confidenceCol = columnToLetter(startColumn + 2);
    const effortCol = columnToLetter(startColumn + 3);
    
    Logger.log('Setting up RICE Score formula at column %s using: Reach=%s, Impact=%s, Confidence=%s, Effort=%s', 
               scoreColumn, reachCol, impactCol, confidenceCol, effortCol);
    
    // Build the dynamic RICE Score formula
    const scoreFormula = `=Score_Weight*(${reachCol}2 * (xlookup(${impactCol}2,INDEX(Impact_Mapping,,1),INDEX(Impact_Mapping,,2))*Impact_Weight) * (xlookup(${confidenceCol}2,INDEX(Confidence_Mapping,,1),INDEX(Confidence_Mapping,,2) ) * Confidence_Weight)) / (xlookup(${effortCol}2,INDEX(Effort_Mapping,,1),INDEX(Effort_Mapping,,2)) * Effort_Weight)`;
    
    // Apply formula to all rows starting from row 2
    const scoreRange = sheet.getRange(2, scoreColumn, 1000);
    scoreRange.setFormula(scoreFormula);
    
    // Format Score column to show 2 decimal places
    scoreRange.setNumberFormat('0.00');
    Logger.log('Applied 2 decimal places formatting to Score column');
    
    Logger.log('✅ RICE Score formula applied: %s', scoreFormula);
    
  } catch (error) {
    Logger.log('❌ RICE Score formula setup failed: %s', error.message);
    throw error;
  }
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
 */
  function testConnection() {
    try {
      const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${FILTER_ID}&maxResults=1`;
      
      const response = UrlFetchApp.fetch(url, {
        headers: {
          'Authorization': `Bearer ${JIRA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.getResponseCode() === 200) {
        const data = JSON.parse(response.getContentText());
        Logger.log(`✅ Connection successful! Found ${data.total} issues in filter (configured limit: ${MAX_RESULTS})`);
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
  
  
  