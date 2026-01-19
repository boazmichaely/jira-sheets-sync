/**
 * Simple Configuration for Jira to Google Sheets Sync
 * 
 * Update these values with your actual Jira details:
 * 1. Get Personal Access Token from Jira profile
 * 2. Verify your filter ID in the Jira URL
 * 3. Adjust field names as needed after testing
 */

// === BASIC CONFIGURATION ===
const JIRA_BASE_URL = 'https://issues.redhat.com';
// JIRA_TOKEN is defined in token.js (import that file to Apps Script)
const FILTER_ID = 12480488; // https://issues.redhat.com/issues/?filter=12480488  - "JIRA-SYNC-FEATURES". 
const SHEET_BASE_NAME = 'Jira';

/**
 * Get user-specific sheet name
 */
function getUserSheetName() {
  const userName = Session.getActiveUser().getUsername();
  if (!userName) {
    throw new Error('Unable to determine current user name');
  }
  return `${SHEET_BASE_NAME} - ${userName}`;
}
const MAX_RESULTS = 300; // Maximum number of issues to fetch from Jira

// === FIELD CONFIGURATION ===
// Each field defines both the Jira field name and the display header
// Custom prioritization columns (Value, Impact, Cost, Priority Score) go in M+
const FIELD_CONFIG = [
  { field: 'key',                    header: 'Key' },
  { field: 'summary',               header: 'Summary' },
  { field: 'status',                header: 'Status' },
  { field: 'priority',              header: 'Priority' },
  { field: 'customfield_12322244',     header: 'PX Impact Score' },
  { field: 'labels',                header: 'Labels' },
  { field: 'issuetype',             header: 'Issue Type' },
  { field: 'components',            header: 'Components' },
  { field: 'customfield_12316752',  header: 'Product Manager' },
  { field: 'customfield_12311940',                  header: 'Rank' },
  { field: 'reporter',              header: 'Reporter' },
  { field: 'assignee',              header: 'Assignee' },
  { field: 'customfield_12319940',  header: 'Target Version' }
];

// Helper arrays derived from FIELD_CONFIG
const JIRA_FIELDS = FIELD_CONFIG.map(f => f.field);
const COLUMN_HEADERS = FIELD_CONFIG.map(f => f.header);

/**
 * Helper function to find the PX Impact Score field in your Jira
 * Run this function to discover available fields and identify the correct one
 */
function findPxImpactScoreField() {
  Logger.log('🔍 Searching for PX Impact Score field...');
  Logger.log('');
  Logger.log('CURRENT CONFIGURATION:');
  Logger.log('Field: customfield_XXXXX (NEEDS TO BE UPDATED)');
  Logger.log('Header: PX Impact Score');
  Logger.log('Position: Column E (5th column)');
  Logger.log('');
  Logger.log('📝 TO FIND THE CORRECT FIELD:');
  Logger.log('1. Run discoverFields() from helpers.js');
  Logger.log('2. Look for a field containing "PX Impact Score" or similar');
  Logger.log('3. Copy the customfield_XXXXX identifier');
  Logger.log('4. Replace "customfield_XXXXX" in config.js with the correct field ID');
  Logger.log('');
  Logger.log('💡 TIP: The field might be named differently in Jira (e.g., "Customer Impact Score", "UX Impact", etc.)');
}
