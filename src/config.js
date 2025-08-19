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
const JIRA_TOKEN = 'YOUR_PERSONAL_ACCESS_TOKEN_HERE';
const FILTER_ID = 12441918;
const SHEET_NAME = 'Jira RFEs';

// === FIELD CONFIGURATION ===
// Each field defines both the Jira field name and the display header
// Custom prioritization columns (Value, Impact, Cost, Priority Score) go in M+
const FIELD_CONFIG = [
  { field: 'key',                    header: 'Key' },
  { field: 'summary',               header: 'Summary' },
  { field: 'status',                header: 'Status' },
  { field: 'priority',              header: 'Priority' },
  { field: 'labels',                header: 'Labels' },
  { field: 'issuetype',             header: 'Issue Type' },
  { field: 'components',            header: 'Components' },
  { field: 'customfield_12316752',  header: 'Product Manager' },
  { field: 'customfield_12311940',  header: 'Rank' },
  { field: 'reporter',              header: 'Reporter' },
  { field: 'assignee',              header: 'Assignee' },
  { field: 'fixVersions',           header: 'Target Version' }
];

// Helper arrays derived from FIELD_CONFIG
const JIRA_FIELDS = FIELD_CONFIG.map(f => f.field);
const COLUMN_HEADERS = FIELD_CONFIG.map(f => f.header);
