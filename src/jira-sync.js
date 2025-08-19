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
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      Logger.log(`Created new sheet: ${SHEET_NAME}`);
    }
    
    return sheet;
  }
  
  /**
 * Fetch issues from Jira ordered by Rank ASC
 */
function fetchJiraIssues() {
  const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${FILTER_ID} ORDER BY Rank ASC&maxResults=100&fields=${JIRA_FIELDS.join(',')}`;
  
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
  Logger.log(`Fetched ${data.issues.length} issues from Jira (ordered by Rank ASC)`);
  
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
    sheet.setFrozenRows(1);
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
    
    const customColumnStart = JIRA_FIELDS.length + 1; // Column M (13th column)
    const customColumnCount = 4; // Value, Impact, Cost, Priority Score
    
    // Read key column (A) and custom columns (M-P)
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
            value: customRow[0] || '',
            impact: customRow[1] || '',
            cost: customRow[2] || '',
            score: customRow[3] || ''
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
          restoreData.push([customData.value, customData.impact, customData.cost, customData.score]);
        } else {
          restoreData.push(['', '', '', '']); // Empty for new issues
        }
      } else {
        restoreData.push(['', '', '', '']);
      }
    });
    
    if (restoreData.length > 0) {
      sheet.getRange(2, customColumnStart, restoreData.length, 4).setValues(restoreData);
      Logger.log(`Restored custom data for ${restoreData.filter(row => row.some(cell => cell !== '')).length} issues`);
    }
    
  } catch (error) {
    Logger.log(`Error restoring custom data: ${error.message}`);
  }
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
        Logger.log(`✅ Connection successful! Found ${data.total} issues in filter`);
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
  
  
  