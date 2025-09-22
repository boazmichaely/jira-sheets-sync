# Jira to Google Sheets Sync

Google Apps Script solution for syncing Jira RFEs to Google Sheets with custom prioritization and ranking capabilities.

## Problem Statement

Product managers need a way to:
1. Sync filtered Jira issues (RFEs) to Google Sheets automatically
2. Preserve custom prioritization columns 
3. Enable weighted scoring for better priority management (RICE)
4. Maintain consistency with Jira Plan view ranking

## Solution Overview

Uses Google Apps Script to:
- Connect to Red Hat Jira via REST API
- Fetch issues using saved filter with Jira ranking
- Sync data to Google Sheets while preserving custom columns
- Enable prioritization scoring based on RICE
- Handle new/deleted issues gracefully
- Maintain user sheet ordering

## Key Features

- **Issue key matching** for data preservation during sync
- **Handles new/deleted issues** gracefully  
- **Maintains custom prioritization columns** (Value, Impact, Cost, Priority Score)
- **Converts LexoRank to human-readable ranking** (1, 2, 3...)
- **Preserves user sheet ordering** with new issues at end
- **Clickable issue keys** linking to Jira
- **Clean configuration-driven architecture**

## Quick Setup

### 1. Setup Token (Required)

**Update `token.js` with your actual Jira Personal Access Token:**
1. Go to [Jira Personal Access Tokens](https://issues.redhat.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens)
2. Create token named "Google Sheets Sync" 
3. Copy the token
4. Edit `token.js` and replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual token

### 2. Google Sheets Setup

1. Create new Google Spreadsheet: "RFE Prioritization"
2. Go to `Extensions > Apps Script`
3. Copy files to Apps Script:
   - `src/config.js`
   - `src/jira-sync.js` 
   - `src/helpers.js`
   - `token.js` (contains your actual token)

### 3. Configure and Test

1. Update `FILTER_ID` in `config.js` if needed
2. Run `testConnection()` to verify setup
3. Run `discoverFields()` to find field mappings
4. Run `syncJiraIssues()` to create sheet structure and sync data

## Project Structure

```
├── README.md                    # This file
├── .gitignore                   # Git ignore
├── token.js                     # Your Jira token (update with real token)
├── src/
│   ├── jira-sync.js            # Main sync script
│   ├── config.js               # Configuration
│   └── helpers.js              # Helper functions
├── templates/
│   ├── guidance-sheet.csv      # RICE framework template
│   └── guidance-setup-instructions.md  # RICE setup guide
└── docs/
    └── testing-guide.md        # Testing instructions
```

## Usage

**Manual Sync:**
Run `syncJiraIssues()` in Google Apps Script whenever you want to update your sheet.

**What Gets Synced:**
- **Columns A-L**: Jira data (replaced each sync)
- **Columns M+**: Custom RICE prioritization (preserved)

## Custom Prioritization Columns

After first sync, manually add RICE scoring columns (M+):
- **Reach** - Number of customers affected 
- **Impact** - Business value of the feature (dropdown scale)
- **Confidence** - Confidence in estimates (dropdown percentage) 
- **Effort** - Development effort (dropdown t-shirt sizing)

See `templates/guidance-setup-instructions.md` for detailed RICE framework setup.

## Current Status

✅ **Robust sync with data preservation**
✅ **Issue key matching for safety**
✅ **LexoRank to numeric conversion**
✅ **Comprehensive documentation**

**Ready for production use!**

## Security

- Update `token.js` with your real token for local use
- The repo contains a template version with placeholder token
- Never commit actual credentials to any repository