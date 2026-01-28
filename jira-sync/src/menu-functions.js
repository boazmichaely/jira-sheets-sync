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
    .addSeparator()
    .addItem('🔍 View "all" filter', 'openTeamFilter')
    .addItem('👥 Sync "all" sheet', 'syncTeamIssuesWithNotification')
    .addSeparator()
    .addItem('⬆️ Push RICE to Jira', 'pushRiceToJiraWithNotification')
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

/**
 * Open team Jira filter in new browser tab
 * Uses the team filter ID from User_Mapping (definition entry)
 */
function openTeamFilter() {
  try {
    const filterId = getTeamFilterId();
    const filterUrl = `${JIRA_BASE_URL}/issues/?filter=${filterId}`;
    
    Logger.log('Opening team Jira filter: filter ID %s', filterId);
    
    const html = `
      <script>
        window.open('${filterUrl}', '_blank');
        google.script.host.close();
      </script>
    `;
    
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(1)
      .setHeight(1);
    
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Opening Team Filter...');
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.message);
  }
}

/**
 * Sync team Jira issues with user-friendly notifications
 */
function syncTeamIssuesWithNotification() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Syncing team issues with Jira...', 'Sync in Progress', -1);
    
    syncTeamIssues();
    
    SpreadsheetApp.getActiveSpreadsheet().toast('Team sync completed successfully!', 'Success', 5);
    
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Team sync failed: ${error.message}`, 'Error', 10);
    Logger.log(`Team sync error: ${error.message}`);
  }
}

/**
 * Push RICE values to Jira with user-friendly notifications
 * Only pushes rows where Sync Status = "≠"
 */
function pushRiceToJiraWithNotification() {
  try {
    const result = pushRiceToJira();
    
    if (result.cancelled) {
      // User cancelled - no notification needed
      return;
    }
    
    if (result.count === 0) {
      // No issues to push - alert already shown in pushRiceToJira
      return;
    }
    
    if (result.success) {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Successfully updated ${result.successCount} issue(s)!`, 
        'Push Complete', 
        5
      );
    } else {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        `Updated ${result.successCount} of ${result.total} issues. Check logs for details.`, 
        'Push Partial', 
        10
      );
    }
    
  } catch (error) {
    SpreadsheetApp.getActiveSpreadsheet().toast(`Push failed: ${error.message}`, 'Error', 10);
    Logger.log(`Push RICE error: ${error.message}`);
  }
}
