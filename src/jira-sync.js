/**
 * === Simple Jira to Google Sheets Sync ===
 * 
 * Focused solution for <100 Jira issues. 
 * Syncs your RFE filter to Google Sheets while preserving custom prioritization columns.
 * 
 * Setup:
 * 1. Update config.js with your Jira token and filter ID
 * 2. Run syncJiraIssues() to test
 * 3. Set up daily trigger using setupDailyTrigger()
 */

/**
 * Main sync function - fetches Jira issues and updates Google Sheet
 */
function syncJiraIssues() {
    try {
      Logger.log('Starting Jira sync...');
      
      // Get or create the sheet
      const sheet = getSheet();
      
      // Fetch issues from Jira
      const issues = fetchJiraIssues();
      if (!issues || issues.length === 0) {
        Logger.log('No issues found in filter');
        return;
      }
      
      // Clear existing Jira data (preserve custom columns)
      clearJiraColumns(sheet);
      
      // Write headers and data
      writeHeaders(sheet);
      writeIssueData(sheet, issues);
      
      Logger.log(`Sync complete: ${issues.length} issues updated`);
      
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
   * Fetch issues from Jira (simple single call for <100 issues)
   */
  function fetchJiraIssues() {
    const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${FILTER_ID}&maxResults=100&fields=${JIRA_FIELDS.join(',')}`;
    
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
    Logger.log(`Fetched ${data.issues.length} issues from Jira`);
    
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
   * Write issue data to sheet
   */
  function writeIssueData(sheet, issues) {
    const data = issues.map(issue => {
      return JIRA_FIELDS.map(fieldName => {
        let value = fieldName === 'key' ? issue.key : issue.fields[fieldName];
        return extractSimpleValue(value);
      });
    });
    
    if (data.length > 0) {
      // Write the data
      sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
      
      // Make Key column (column A) clickable URLs
      const keyColumnData = issues.map(issue => {
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
  
  
  