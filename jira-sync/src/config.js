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
const JIRA_RICE_SCORE_FIELD = 'customfield_12326242';  // Jira's computed RICE Score

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
  { field: 'customfield_12319940',  header: 'Target Version' },
  { field: 'customfield_12320852',  header: 'Size' },
  { field: 'customfield_12320846',  header: 'Jira Reach' },
  { field: 'customfield_12320740',  header: 'Jira Impact' },
  { field: 'customfield_12320847',  header: 'Jira Confidence' },
  { field: 'customfield_12320848',  header: 'Jira Effort' }
];

// Helper arrays derived from FIELD_CONFIG
const JIRA_FIELDS = FIELD_CONFIG.map(f => f.field);
const COLUMN_HEADERS = FIELD_CONFIG.map(f => f.header);

// === COLOR CONFIGURATION ===
const COLORS = {
  // Editable columns
  EDITABLE: '#ffff00',           // Yellow - user can edit
  EDITABLE_LOCKED: '#d9d9d9',    // Grey - derived from Size, no edit
  
  // Read-only computed columns
  VALUE_COLUMNS: '#cfe2f3',      // Light blue - computed values
  
  // Read-only Jira columns
  JIRA_READONLY: '#f3f3f3',      // Light grey - synced from Jira
  
  // Sync status
  SYNC_IN_SYNC: '#a4c2f4',       // Blue - values match Jira
  SYNC_OUT_OF_SYNC: '#fce8e8',   // Light red - values differ
  
  // Header colors
  HEADER_SCORE: '#ffcc99',       // Orange - PRICE Score header
  HEADER_SYNC_STATUS: '#eeeeee'  // Light grey - Sync Status header
};
