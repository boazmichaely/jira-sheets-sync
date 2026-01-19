# Red Hat Support Case Pull

Fetches Red Hat support case information from the Customer Portal API and exports to CSV.

## ✅ Status: Ready to Use!

Two versions available:
1. **Config-based** (Recommended) - Full control over columns via `config.json`
2. **Simple** - Quick fetching with predefined columns

## Quick Start (Config-based - Recommended)

### 1. Get Your Bearer Token

The token expires every **15 minutes**, so you'll need to extract it fresh each time you run the script.

**Steps:**
1. Log in to https://access.redhat.com with SSO
2. Open Developer Tools (F12) → Network tab
3. Navigate to any case (e.g., /support/cases/#/case/04257923)
4. In the Network tab filter box, type: `hydra/rest`
5. Press **Cmd+R** (Mac) or **Ctrl+R** (Windows) to reload
6. Click on the request to `hydra/rest/v1/cases/...`
7. In the Headers tab, find "Authorization" under Request Headers
8. Copy the value after "Bearer " (the long `eyJhbGci...` string)
9. Paste it in `credentials.py` line 19

### 2. Edit Config File

Edit `config.json` to specify cases and desired columns:

```json
{
  "cases": ["04257923", "04163027"],
  "columns": [
    "Case Number",
    "Status",
    "Severity",
    "Description",
    "Jira-1",
    "Jira-2"
  ],
  "output_file": "my_cases.csv"
}
```

**See all 36 available columns**: Run `python fetch_cases_config.py` (no arguments)

### 3. Run the Script

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python fetch_cases_config.py config.json
```

The script will create your CSV file with exactly the columns you specified.

## Alternative: Simple Version

If you just want the default columns quickly:

```bash
# Edit cases_input.txt with case numbers
python fetch_cases.py cases_input.txt
```

This uses predefined columns: Case Number, Account, Status, Support Type, Severity, Description, Jira-1, Jira-2, Jira-3.

## Available Columns (36 total)

Choose from: Account, Account Name, All Jira Links, Case Language, Case Number, Case URL, Contact Name, Contact SSO, Created By, Created Date, Customer Escalation, Description, Entitlement SLA, Environment, FTS, Internal Status, Is Closed, Issue, Jira-1, Jira-2, Jira-3, Last Closed At, Last Modified Date, OpenShift Cluster ID, Origin, Owner, Priority Score, Product, SBR Groups, SBT, Severity, Status, Strategic Account, Summary, Support Type, Version

**See detailed descriptions**: Check `CONFIG_GUIDE.md`

## Advanced Usage

### Specify Output Filename

```bash
python fetch_cases.py cases_input.txt -o my_cases.csv
```

### Test with a Single Case

Use `test_api_simple.py` to test the API connection:

```bash
python test_api_simple.py
```

## Troubleshooting

### Token Expired Error

```
❌ Authentication failed
JWT expired at...
```

**Solution:** Extract a fresh Bearer token from your browser (they expire after 15 minutes).

### Case Not Found

```
⚠️ Case 04257923 not found or no access
```

**Possible causes:**
- Case number is incorrect
- You don't have access to that case
- Case doesn't exist

### No Credentials Error

```
❌ No Bearer token configured!
```

**Solution:** Edit `credentials.py` and add your Bearer token on line 19.

## Files

```
support-case-pull/
├── fetch_cases.py          # Main script - fetches multiple cases
├── test_api_simple.py      # Test script - tests API connection
├── cases_input.txt         # Input file - list your case numbers here
├── credentials.py          # Your Bearer token goes here
├── requirements.txt        # Python dependencies
├── venv/                   # Python virtual environment
└── README.md               # This file
```

## Important Notes

⚠️ **Bearer tokens expire after 15 minutes**
- You'll need to extract a fresh token each time you run the script
- The script will tell you if your token has expired

📋 **Case numbers must be 8 digits**
- Format: 04257923
- Don't include the full URL

🔒 **credentials.py is gitignored**
- Your Bearer token is private and won't be committed to git
- Safe to store your token there

## Example Session

```bash
$ cd support-case-pull
$ source venv/bin/activate
$ python fetch_cases.py cases_input.txt

======================================================================
Red Hat Support Case Fetcher
======================================================================
Input file:  cases_input.txt
Output file: cases_20251118_113109.csv

Found 2 case numbers to fetch

[1/2] Fetching case 04257923... ✅
[2/2] Fetching case 04163027... ✅

======================================================================
Successfully fetched: 2 cases
======================================================================

✅ Successfully wrote 2 cases to cases_20251118_113109.csv

🎉 Done! You can now open the CSV file.
```

## API Details

- **Endpoint**: `https://access.redhat.com/hydra/rest/v1/cases/{caseNumber}`
- **Authentication**: Bearer token (OAuth JWT)
- **Token Lifetime**: 15 minutes
- **Rate Limiting**: 0.5 second delay between requests

## Need Help?

- Check that your Bearer token is fresh (< 15 minutes old)
- Make sure you have access to the cases you're trying to fetch
- Verify case numbers are correct (8 digits)
- Check the test script works: `python test_api_simple.py`
