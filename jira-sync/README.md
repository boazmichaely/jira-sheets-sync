# Jira to Google Sheets Sync

Google Apps Script solution for syncing Jira RFEs to Google Sheets with custom prioritization and ranking capabilities.

## How It Works

This project uses **Google Apps Script**, which runs in Google's cloud (not on your computer). Understanding this architecture is key to setting it up correctly.

### Key Concepts

1. **Two Locations for Code:**
   - **This Git repo**: Source code backup and version control
   - **Google Apps Script project**: Where the code actually runs (in Google's cloud)

2. **No Imports in Apps Script:**
   Google Apps Script loads all `.js`/`.gs` files into a **shared global scope**. There's no `import` or `require`. If you define `const JIRA_TOKEN = '...'` in any file, all other files can use `JIRA_TOKEN` directly.

3. **Token Security:**
   - `token.js` in this repo contains a **placeholder** (`YOUR_PERSONAL_ACCESS_TOKEN_HERE`)
   - `token.js` is listed in `.gitignore` so your real token won't be committed
   - You must create/update `token.js` in your **Apps Script project** with your real token

### Development Workflow

```
┌─────────────────────┐         ┌─────────────────────────────┐
│   This Git Repo     │  copy   │  Google Apps Script Project │
│   (source backup)   │ ──────> │  (where code actually runs) │
│                     │         │                             │
│  - src/*.js         │         │  - config.js.gs             │
│  - token.js (fake)  │         │  - jira-sync.js.gs          │
│                     │         │  - token.js.gs (REAL token) │
└─────────────────────┘         └─────────────────────────────┘
```

## My Setup

- **Sheet**: https://docs.google.com/spreadsheets/d/1KD3BjEwLsludkO1gqfk9Y8jGesaxnw9eglMGIjiPOpU/edit?usp=sharing
- **Apps Script**: https://script.google.com/u/0/home/projects/1yZnQK7tSPZAS0U6n1OD4MioMlaK4lTI-InSajUFKefXkt84FyKA9IV9f/edit
- **Jira Filter**: https://issues.redhat.com/issues/?filter=12480488 (JIRA-SYNC-FEATURES)

## Quick Start

### 1. Create Your Jira Token

1. Go to [Jira Personal Access Tokens](https://issues.redhat.com/secure/ViewProfile.jspa?selectedTab=com.atlassian.pats.pats-plugin:jira-user-personal-access-tokens)
2. Create a token named "Google Sheets Sync"
3. Copy the token (you'll need it in step 3)

### 2. Set Up Google Apps Script

1. Create a new Google Spreadsheet
2. Go to `Extensions > Apps Script`
3. Create the following files in Apps Script and copy content from this repo:

| Apps Script File | Copy From |
|------------------|-----------|
| `config.js` | `src/config.js` |
| `jira-sync.js` | `src/jira-sync.js` |
| `helpers.js` | `src/helpers.js` |
| `menu-functions.js` | `src/menu-functions.js` |
| `sidebar.html` | `src/sidebar.html` |

### 3. Create token.js in Apps Script (IMPORTANT)

In your Apps Script project, create a new file called `token.js` with your **real** token:

```javascript
const JIRA_TOKEN = 'your-actual-jira-token-here';
```

This file exists only in Apps Script - never commit real tokens to git.

### 4. Configure and Test

1. Update `FILTER_ID` in `config.js` to your Jira filter ID
2. Run `testConnection()` to verify setup
3. Run `syncJiraIssues()` to sync data

## Usage

**From the Google Sheet menu:**
- `Jira Sync > Sync Jira Issues` - Fetch latest data from Jira
- `Jira Sync > Setup RICE Columns` - Add prioritization columns to existing sheet

**What Gets Synced:**
- **Columns A-M**: Jira data (replaced each sync)
- **Columns N+**: RICE prioritization columns (preserved)

When you create a new sheet, RICE columns are automatically set up with dropdowns and formulas.

## Features

- **Issue key matching** - Preserves your custom data during sync
- **Handles new/deleted issues** - New issues appear at end, deleted issues removed
- **RICE scoring** - Automatic setup of Reach, Impact, Confidence, Effort columns
- **Clickable issue keys** - Links directly to Jira
- **LexoRank conversion** - Shows readable rank numbers (1, 2, 3...)

## Project Structure

```
├── README.md                    # This file
├── .gitignore                   # Excludes token.js from commits
├── token.js                     # Template with placeholder (real token goes in Apps Script)
├── src/
│   ├── config.js               # Jira connection settings, field mappings
│   ├── jira-sync.js            # Main sync logic
│   ├── helpers.js              # Utility functions
│   ├── menu-functions.js       # Google Sheets menu integration
│   ├── sidebar.html            # Optional sidebar UI
│   └── unit-tests.js           # Test functions
├── templates/
│   ├── guidance-sheet.csv      # RICE framework reference data
│   └── guidance-setup-instructions.md
└── docs/
    └── testing-guide.md
```

## Security Notes

- `token.js` is in `.gitignore` - your real token won't be committed
- The `token.js` in this repo contains only a placeholder
- Your actual token lives in the Google Apps Script project (not in git)
- Never share your Apps Script project with others if it contains your token

