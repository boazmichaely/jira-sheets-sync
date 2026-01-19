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
    .addItem('📊 Setup RICE Columns', 'setupRiceColumnsWithNotification')
    .addSeparator()
    .addItem('🎛️ Show Sidebar', 'showSidebar')
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
 * Setup RICE columns with user notification
 */
function setupRiceColumnsWithNotification() {
  try {
    // Run the actual setup (includes its own confirmation dialog)
    const result = setupRiceColumns();
    
    // Handle the result
    if (result && result.success === false) {
      // User cancelled - show neutral message
      SpreadsheetApp.getActiveSpreadsheet().toast(result.message || 'RICE setup cancelled', 'ℹ️ Cancelled', 3);
    } else {
      // Show working toast only after user confirms
      SpreadsheetApp.getActiveSpreadsheet().toast('Setting up RICE columns...', '📊 Setup in Progress', 2);
      
      // Show success notification  
      SpreadsheetApp.getActiveSpreadsheet().toast('RICE columns setup completed successfully!', '✅ Success', 5);
    }
    
  } catch (error) {
    // Show error notification for actual errors
    SpreadsheetApp.getActiveSpreadsheet().toast(`RICE setup failed: ${error.message}`, '❌ Error', 10);
    Logger.log(`RICE setup error: ${error.message}`);
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
    sheetName: getUserSheetName(),
    baseUrl: JIRA_BASE_URL,
    userName: Session.getActiveUser().getUsername()
  };
}

/**
 * Show the control panel sidebar
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('sidebar')
    .setTitle('Jira Sync Sidebar');
  
  SpreadsheetApp.getUi().showSidebar(html);
}
