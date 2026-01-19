# Support Case Pull - Project Plan

## Overview
Create a Google Apps Script solution to pull Red Hat support case information from the Customer Portal API into Google Sheets. This is a **read-only pull operation** (no sync), simpler than the Jira-sync project.

## Case Analysis

### Case URL Structure
- Base URL: `https://access.redhat.com/support/cases/#/case/04257923`
- Case Number Format: 8-digit numbers (e.g., `04257923`, `04163027`)
- URL Pattern: `/support/cases/#/case/{CASE_NUMBER}`

### Required Fields to Extract

Based on your requirements, we need to pull:

1. **Case number** - The unique identifier (8 digits)
2. **Account** - Customer account associated with the case
3. **Status** - Current case status (e.g., Open, Closed, Waiting for Customer)
4. **Support Type** - Type of support (e.g., Technical, Billing)
5. **Severity** - Severity level (e.g., 1-Critical, 2-Urgent, 3-High, 4-Medium, 5-Low)
6. **Description** - Case description/summary
7. **Jira-1** - First related Jira task (formatted as `[ROX-31016|https://issues.redhat.com/browse/ROX-31016]`)
8. **Jira-2** - Second related Jira task (or "None" if not present)
9. **Jira-3** - Third related Jira task (or "None" if not present)

### Related Tasks Field Analysis

From the Jira issue ROX-31016 example:
- Jira links appear in "Related tasks" field
- Format needed: `[JIRA-KEY|JIRA-URL]` (clickable hyperlink format)
- Multiple tasks should be extracted and listed separately
- If no related tasks, display "None"

## API Discovery Results ✅

### API Endpoint Confirmed
- **Base URL**: `https://access.redhat.com`
- **Endpoint**: `/hydra/rest/cases/{caseNumber}`
- **Full URL**: `https://access.redhat.com/hydra/rest/cases/04257923`
- **Method**: GET
- **Authentication**: HTTP Basic Authentication
  - Header: `Authorization: Basic <base64(username:password)>`
  - Realm: `hydra.apps.ext-waf.spoke.prod.us-west-2.aws.paas.redhat.com`

### Step 2: Field Mapping Discovery
- Need to identify API field names for:
  - Case number → `caseNumber` or `id`?
  - Account → `account` or `accountName`?
  - Status → `status` or `caseStatus`?
  - Support Type → `supportType` or `type`?
  - Severity → `severity` or `priority`?
  - Description → `description` or `summary`?
  - Related Tasks → `relatedTasks`, `jiraLinks`, or `externalLinks`?

### Step 3: Authentication Setup
- Determine authentication method
- May need:
  - OAuth token
  - API key
  - Session cookie (less likely for API)
- Store credentials securely (similar to `token.js` pattern)

## Project Structure

Following the jira-sync project style:

```
src/
  ├── case-pull.js          # Main pull function (similar to jira-sync.js)
  ├── case-config.js        # Configuration (similar to config.js)
  ├── case-menu.js          # Menu functions (similar to menu-functions.js)
  └── case-helpers.js       # Helper functions (similar to helpers.js)

token.js                    # API credentials (reuse or create case-token.js)
```

## Implementation Plan

### Phase 1: API Discovery & Configuration
1. **Research Red Hat Customer Portal API**
   - Find official API documentation
   - Identify authentication method
   - Test API endpoint with sample case number
   - Document field mappings

2. **Create Configuration File** (`case-config.js`)
   ```javascript
   const CASE_API_BASE_URL = 'https://access.redhat.com/api';
   const INPUT_SHEET_NAME = 'Case Input';
   const OUTPUT_SHEET_NAME = 'Case Data';
   const CASE_TOKEN = '...'; // From token.js or separate file
   ```

3. **Define Field Configuration**
   ```javascript
   const CASE_FIELDS = [
     { apiField: 'caseNumber', header: 'Case Number' },
     { apiField: 'account', header: 'Account' },
     { apiField: 'status', header: 'Status' },
     { apiField: 'supportType', header: 'Support Type' },
     { apiField: 'severity', header: 'Severity' },
     { apiField: 'description', header: 'Description' },
     { apiField: 'jiraLinks', header: 'Jira-1' }, // Special handling
     // Jira-2 and Jira-3 handled separately
   ];
   ```

### Phase 2: Core Pull Functionality
1. **Read Input Sheet**
   - Read case numbers from input sheet (Column A, starting row 2)
   - Handle empty rows gracefully
   - Validate case number format (8 digits)

2. **Fetch Case Data**
   - For each case number, make API call
   - Handle API errors (case not found, auth failure, etc.)
   - Implement rate limiting if needed

3. **Extract Related Jira Tasks**
   - Parse "Related tasks" field from API response
   - Extract Jira keys and URLs
   - Format as `[KEY|URL]` for first 3 tasks
   - Use "None" if no tasks or fewer than requested

4. **Write to Output Sheet**
   - Create/use output sheet
   - Write headers
   - Write case data row by row
   - Make case numbers clickable (HYPERLINK to case URL)

### Phase 3: Error Handling & User Experience
1. **Error Handling**
   - Invalid case numbers
   - API authentication failures
   - Network timeouts
   - Missing fields in API response

2. **User Feedback**
   - Progress notifications (toast messages)
   - Success/failure summary
   - Logging for debugging

3. **Menu Integration**
   - Add menu item: "📥 Pull Support Cases"
   - Optional: "🔍 Test Connection"

### Phase 4: Testing & Refinement
1. **Test with Sample Cases**
   - Use provided case numbers
   - Verify all fields extract correctly
   - Test edge cases (no Jira links, multiple Jira links)

2. **Format Validation**
   - Verify Jira link formatting
   - Check hyperlink functionality
   - Ensure "None" appears correctly

## Code Style Guidelines

Following jira-sync.js patterns:

1. **Function Structure**
   - Clear function names with descriptive comments
   - Try-catch blocks for error handling
   - Logger.log for debugging
   - User-friendly error messages

2. **Sheet Management**
   - Get or create sheet pattern
   - Preserve existing data (if needed)
   - Format headers (bold, freeze panes)

3. **Data Extraction**
   - Helper function for extracting nested values
   - Handle null/undefined gracefully
   - Format special fields (Jira links, hyperlinks)

4. **Configuration-Driven**
   - Field mappings in config file
   - Easy to update if API changes
   - Similar to FIELD_CONFIG pattern

## Key Differences from Jira-Sync

1. **No Sync Logic**
   - Simple pull operation
   - No issue key matching
   - No custom data preservation
   - Can overwrite existing data or append

2. **Input Sheet Required**
   - Read case numbers from input sheet
   - Different from Jira filter-based approach

3. **Multiple Jira Links**
   - Extract up to 3 related Jira tasks
   - Special formatting required

4. **Simpler Architecture**
   - No RICE columns
   - No ranking logic
   - Straightforward data extraction

## Next Steps

1. ✅ **Research API** - COMPLETE - Found `/hydra/rest/cases/{caseNumber}`
2. ✅ **Test Authentication** - COMPLETE - HTTP Basic Auth identified
3. ✅ **Create Test Script** - COMPLETE - See `src/test-api.js`
4. ⏳ **Test with Credentials** - YOU NEED TO DO THIS:
   - Open `src/test-api.js`
   - Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your credentials
   - Run `testCaseAPI()` function
   - Copy the response JSON and share it
5. ⏳ **Map Fields** - Document exact API field names (after step 4)
6. ⏳ **Build Full Solution** - Implement following the plan above

### Testing Instructions

1. Open a Google Sheet
2. Go to Extensions → Apps Script
3. Copy the contents of `src/test-api.js` into the script editor
4. Replace the credentials (lines 16-17):
   ```javascript
   const RH_USERNAME = 'bmichael@redhat.com';  // Your username
   const RH_PASSWORD = 'your-password-here';    // Your password
   ```
5. Save and run the `testCaseAPI` function
6. Check the Execution log (View → Logs) to see the results
7. If successful, you'll see the case data structure
8. If it fails with 401, you may need an app-specific password for SSO accounts

## Questions to Resolve

1. **API Access**: ✅ RESOLVED - API exists at `/hydra/rest/cases/{caseNumber}`
2. **Authentication**: ✅ RESOLVED - HTTP Basic Auth with Red Hat credentials
3. **Rate Limits**: ⚠️ UNKNOWN - Need to test with real usage
4. **Related Tasks Field**: ⏳ PENDING - Need to test with valid credentials to see response structure
5. **Output Sheet Behavior**: ⏳ PENDING - Decide: overwrite or append?
6. **SSO Credentials**: ⏳ PENDING - Test if SSO login works with Basic Auth, or if app password needed

## Example Output Sheet Structure

| Case Number | Account | Status | Support Type | Severity | Description | Jira-1 | Jira-2 | Jira-3 |
|-------------|---------|--------|--------------|----------|-------------|--------|--------|--------|
| 04257923 | Acme Corp | Open | Technical | 2-Urgent | Issue description... | [ROX-31016\|https://...] | None | None |
| 04163027 | ... | ... | ... | ... | ... | ... | ... | ... |

