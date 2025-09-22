# Testing Guide

## Phase 1: Setup & Basic Connection

### Step 1: Create Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet named "ROX RFE Prioritization"
3. Import the CSV template from `templates/sheet-template.csv`
4. Note the spreadsheet URL/ID for reference

### Step 2: Set up Google Apps Script
1. In your Google Sheet: `Extensions > Apps Script`
2. Delete the default `Code.gs` content
3. Create three files by copying our code:
   - `config.js` (copy from `src/config.js`)
   - `jira-sync.js` (copy from `src/jira-sync.js`)
   - `helpers.js` (copy from `src/helpers.js`) - optional

### Step 3: Get Jira Personal Access Token
1. Go to [Jira Profile > Personal Access Tokens](https://issues.redhat.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens)
2. Click "Create token"
3. Name: "Google Sheets Sync"
4. Copy the token immediately (you won't see it again!)

### Step 4: Configure credentials
In `config.js`, update:
```javascript
const JIRA_TOKEN = 'your_actual_token_here';
```

## Phase 2: Connection Testing

### Step 5: Test Jira connection
1. In Apps Script, run the `testConnection()` function
2. Check the execution log for results
3. Expected output: `✅ Connection successful! Found X issues in filter`

**If this fails:**
- Verify your token is correct
- Check that you can access the filter manually: https://issues.redhat.com/issues/?filter=12455175
- Ensure your token has proper permissions

## Phase 3: Field Discovery

### Step 6: Discover available fields
1. Run the `discoverFields()` function (from helpers.js)
2. Review the log output to see all available Jira fields
3. Look for:
   - Product Manager field (exact name)
   - Rank field (likely `customfield_xxxxx`)
   - Any other fields you want to sync

### Step 7: Update field configuration
Based on the field discovery, update `JIRA_FIELDS` in `config.js`:
```javascript
const JIRA_FIELDS = [
  'key',
  'summary', 
  'status',
  'labels',
  'issuetype',
  'components',
  'Product Manager',           // Use exact name from discovery
  'customfield_12345',        // Use actual rank field ID
  'creator',
  'reporter',
  'assignee'
];
```

## Phase 4: First Sync Test

### Step 8: Run manual sync
1. Run the `syncJiraIssues()` function
2. Check your Google Sheet for data
3. Verify:
   - Headers are correct (row 1)
   - Issue data appears (starting row 2)
   - Custom columns (N+) are preserved
   - Field values look correct

**Expected result:** Your sheet should have Jira data in columns A-M (including PX Impact Score in column E), with your custom prioritization columns in N+ untouched.

## Phase 5: Data Validation

### Step 9: Verify critical fields
Check these specific fields are working:
- **Key**: Should show "ROX-1234" format
- **Summary**: Should show issue titles
- **Status**: Should show readable status names
- **Product Manager**: Should show your name for your issues
- **Rank**: Critical for Plan view ordering (may show numbers or be empty)

### Step 10: Test custom columns
1. Add some test data in columns N+ (Reach, Impact, Confidence, Effort, Priority Score)
2. Run `syncJiraIssues()` again
3. Verify your custom data is preserved

## Phase 6: Manual Sync Ready

### Step 11: You're done!
Since this is manual-only, there are no triggers to set up.

**To sync in the future:** Just run `syncJiraIssues()` whenever you want to update your sheet

## Troubleshooting Quick Reference

### Common Issues

**"Connection failed"**
- Check token validity
- Verify filter access
- Ensure correct Jira URL

**"No issues found"**
- Verify filter ID: `12455175`
- Check filter has issues when viewed manually
- Confirm your user can see the filter

**Fields showing as empty/wrong**
- Run `discoverFields()` to see actual field names
- Update `JIRA_FIELDS` with correct names
- Check field permissions

**Custom columns being overwritten**
- Verify your custom data is in columns N and beyond
- Check that `JIRA_FIELDS` array has exactly 13 items (A-M, including PX Impact Score)

### Debugging Commands
```javascript
// Test each piece individually
testConnection()           // Verify API access
discoverFields()          // See available fields  
syncJiraIssues()          // Full sync test
setupDailyTrigger()       // Set up automation
```

## Success Criteria

✅ **Connection Test**: Can fetch issues from your filter  
✅ **Field Discovery**: Can see and identify the fields you need  
✅ **Manual Sync**: Data appears correctly in Google Sheet  
✅ **Custom Preservation**: Your prioritization columns are untouched  
✅ **Ready to Use**: Manual sync works perfectly  

Once all these pass, you're ready for production use!
