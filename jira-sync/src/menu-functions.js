/**
 * Custom Menu Functions for Google Sheets
 * Creates a simple menu for Jira sync operations
 */

/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('Jira Sync')
    .addItem('🔍 View your filter', 'openJiraFilter')
    .addItem('🔄 Sync your issues', 'syncJiraIssuesWithNotification')
    .addToUi();
}

/**
 * Sync Jira issues with user-friendly notifications
 */
function syncJiraIssuesWithNotification() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Syncing with Jira...', 'Sync in Progress', -1);
    
    syncJiraIssues();
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Sync completed successfully!', 'Success', 5);
    
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Sync failed: ${error.message}`, 'Error', 10);
    Logger.log(`Sync error: ${error.message}`);
  }
}

/**
 * Open Jira filter in new browser tab
 * Uses the current user's filter ID from User_Mapping
 */
function openJiraFilter() {
  try {
    const currentUser = getCurrentUsername();
    const filterId = getUserFilterId();
    const filterUrl = `${JIRA_BASE_URL}/issues/?filter=${filterId}`;
    
    Logger.log('Opening Jira filter for user "%s": filter ID %s', currentUser, filterId);
    
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
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}
