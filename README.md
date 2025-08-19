# Jira to Google Sheets Sync

Professional Google Apps Script solution for syncing Jira RFEs to Google Sheets with custom prioritization and ranking capabilities.

## Problem Statement

Product managers need a way to:
1. Sync filtered Jira issues (RFEs) to Google Sheets automatically
2. Preserve custom prioritization columns (Value, Impact, Cost)
3. Enable weighted scoring for better priority management
4. Maintain consistency with Jira Plan view ranking

## Solution Overview

Uses Google Apps Script to:
- Connect to Red Hat Jira via REST API
- Fetch issues using saved filter with Jira ranking
- Sync data to Google Sheets while preserving custom columns
- Enable prioritization scoring based on Value, Impact, and Cost
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

**Create your private token file:**
```bash
cp token.js my-token.js
```

**Update `my-token.js` with your actual Jira Personal Access Token:**
1. Go to [Jira Personal Access Tokens](https://issues.redhat.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens)
2. Create token named "Google Sheets Sync"
3. Copy the token
4. Edit `my-token.js` and replace `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your actual token

**⚠️ Important:** Never commit `my-token.js` to git - it's already in `.gitignore`

### 2. Google Sheets Setup

1. Create new Google Spreadsheet: "ROX RFE Prioritization"
2. Import `templates/sheet-template.csv`
3. Go to `Extensions > Apps Script`
4. Copy files:
   - `src/config.js`
   - `src/jira-sync.js` 
   - `src/helpers.js`
   - `my-token.js` (with your real token)

### 3. Configure and Test

1. Update `FILTER_ID` in `config.js` if needed
2. Run `testConnection()` to verify setup
3. Run `discoverFields()` to find field mappings
4. Run `syncJiraIssues()` to sync data

## Project Structure

```
├── README.md                    # This file
├── .gitignore                   # Git ignore (excludes my-token.js)
├── token.js                     # Token template
├── my-token.js                  # Your private token (not in git)
├── src/
│   ├── jira-sync.js            # Main sync script
│   ├── config.js               # Configuration
│   └── helpers.js              # Helper functions
├── templates/
│   └── sheet-template.csv      # Google Sheet structure
└── docs/
    └── testing-guide.md        # Testing instructions
```

## Usage

**Manual Sync:**
Run `syncJiraIssues()` in Google Apps Script whenever you want to update your sheet.

**What Gets Synced:**
- **Columns A-L**: Jira data (replaced each sync)
- **Columns M-P**: Your custom prioritization (preserved)

## Custom Prioritization Columns

After sync, add your scoring in these columns:
- **M: Value** - Business value of the feature
- **N: Impact** - Number of customers affected  
- **O: Cost** - Development effort (t-shirt sizing)
- **P: Priority Score** - Your weighted calculation

## Current Status

✅ **Robust sync with data preservation**
✅ **Issue key matching for safety**
✅ **LexoRank to numeric conversion**
✅ **Comprehensive documentation**

**Ready for production use!**

## Links

- **Jira Filter**: https://issues.redhat.com/issues/?filter=12441918
- **Jira Plan View**: https://issues.redhat.com/secure/PortfolioPlanView.jspa?id=2769&sid=2768&vid=15475#plan/backlog

## Security

- `my-token.js` contains sensitive data and is excluded from git
- `token.js` is the safe template for sharing/committing
- Never commit actual credentials to any repository