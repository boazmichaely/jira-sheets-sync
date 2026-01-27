/**
 * Configuration for Jira to Google Sheets Sync
 * 
 * This file contains ONLY configuration values (no functions).
 * Functions are in helpers.js and jira-sync.js
 */

// === BASIC CONFIGURATION ===
const JIRA_BASE_URL = 'https://issues.redhat.com';
// JIRA_TOKEN is defined in token.js (import that file to Apps Script)
const SHEET_BASE_NAME = 'Jira';
const MAX_RESULTS = 300; // Maximum number of issues to fetch from Jira
const DEBUG = false; // Set to true to enable debug logging
const TESTUSER = ''; // Set to a username to simulate that user (for testing), leave empty for real user

// === TEAM SYNC CONFIGURATION ===
const TEAM_SHEET_NAME = 'Jira-all';
const TEAM_USER_KEY = 'definition';  // Key in User_Mapping for team filter

// === FIELD CONFIGURATION ===
// Each field defines both the Jira field name and the display header
// Custom prioritization columns (Reach, Impact, Confidence, Effort, Score) go after these
const FIELD_CONFIG = [
  { field: 'key',                    header: 'Key' },
  { field: 'summary',               header: 'Summary' },
  { field: 'status',                header: 'Status' },
  { field: 'priority',              header: 'Priority' },
  { field: 'customfield_12322244',  header: 'PX Impact Score' },
  { field: 'labels',                header: 'Labels' },
  { field: 'issuetype',             header: 'Issue Type' },
  { field: 'components',            header: 'Components' },
  { field: 'customfield_12316752',  header: 'Product Manager' },
  { field: 'assignee',              header: 'Assignee' },
  { field: 'customfield_12313240',  header: 'Team' },
  { field: 'customfield_12311940',  header: 'Rank' },
  { field: 'reporter',              header: 'Reporter' },
  { field: 'assignee',              header: 'Assignee' },
  { field: 'customfield_12319940',  header: 'Target Version' }
];

// Helper arrays derived from FIELD_CONFIG
const JIRA_FIELDS = FIELD_CONFIG.map(f => f.field);
const COLUMN_HEADERS = FIELD_CONFIG.map(f => f.header);
