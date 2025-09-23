/**
 * Custom Menu Functions for Google Sheets
 * Creates a custom menu with sync and utility functions
 */

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🔄 Jira Sync')
    .addItem('📥 Sync Jira Issues', 'syncJiraIssuesWithNotification')
    .addItem('🔧 View/Edit Jira Filter', 'openJiraFilter')
    .addSeparator()
    .addItem('🎛️ Show Control Panel', 'showSidebar')
    .addToUi();
}

/**
 * Wrapper function that shows user-friendly notifications
 */
function syncJiraIssuesWithNotification() {
  try {
    // Show "working" toast
    SpreadsheetApp.getActiveSpreadsheet().toast('Syncing with Jira...', '🔄 Sync in Progress', -1);
    
    // Run the actual sync
    syncJiraIssues();
    
    // Show success notification
    SpreadsheetApp.getActiveSpreadsheet().toast('Sync completed successfully!', '✅ Success', 5);
    
  } catch (error) {
    // Show error notification
    SpreadsheetApp.getActiveSpreadsheet().toast(`Sync failed: ${error.message}`, '❌ Error', 10);
    Logger.log(`Sync error: ${error.message}`);
  }
}

/**
 * Test connection with user notification
 */
function testConnectionWithNotification() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Testing Jira connection...', '🔍 Testing', -1);
    
    const success = testConnection();
    
    if (success) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Connection successful!', '✅ Connected', 5);
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast('Connection failed. Check logs.', '❌ Failed', 5);
    }
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Test failed: ${error.message}`, '❌ Error', 10);
  }
}

/**
 * Open Jira filter in new browser tab
 */
function openJiraFilter() {
  const filterUrl = `${JIRA_BASE_URL}/issues/?filter=${FILTER_ID}`;
  const html = `
    <script>
      window.open('${filterUrl}', '_blank');
      google.script.host.close();
    </script>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(1)
    .setHeight(1);
  
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Opening Jira Filter...');
}

/**
 * Get current configuration for display
 */
function getCurrentConfig() {
  return {
    filterId: FILTER_ID,
    maxResults: MAX_RESULTS,
    sheetName: SHEET_NAME,
    baseUrl: JIRA_BASE_URL
  };
}

/**
 * Show the control panel sidebar
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Jira Sync Control Panel')
    .setWidth(300);
  
  SpreadsheetApp.getUi().showSidebar(html);
}
