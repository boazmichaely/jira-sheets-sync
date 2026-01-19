# Configuration File Guide

## Overview

The config-based fetcher (`fetch_cases_config.py`) uses a JSON configuration file to specify:
1. **Which cases to fetch**
2. **Which columns to include in the CSV**
3. **What to name the output file**

## Basic Config Example

Create a file called `config.json`:

```json
{
  "cases": [
    "04257923",
    "04163027",
    "04256789"
  ],
  "columns": [
    "Case Number",
    "Status",
    "Severity",
    "Description",
    "Jira-1"
  ],
  "output_file": "my_cases.csv"
}
```

## Config Fields

### `cases` (required)
Array of case numbers to fetch.

```json
"cases": ["04257923", "04163027"]
```

### `columns` (required)
Array of column names to include in CSV, in the order you want them.

```json
"columns": ["Case Number", "Status", "Jira-1", "Jira-2"]
```

### `output_file` (optional)
Name of the output CSV file. If omitted, will generate `cases_TIMESTAMP.csv`.

```json
"output_file": "my_report.csv"
```

## Available Columns

### Basic Fields
- `Case Number` - 8-digit case ID
- `Account` - Account number
- `Account Name` - Account name (if available)
- `Status` - Current case status
- `Internal Status` - Internal Red Hat status
- `Support Type` - Type of case (Defect/Bug, Feature Request, etc.)
- `Severity` - Case severity level
- `Priority Score` - Numerical priority

### Descriptions
- `Summary` - Case title/summary
- `Description` - Detailed description
- `Issue` - Issue description
- `Environment` - Environment where issue occurs

### Product Information
- `Product` - Product name
- `Version` - Product version

### Contact & Owner Information
- `Contact Name` - Customer contact name
- `Contact SSO` - Customer SSO username
- `Owner` - Case owner
- `Created By` - Who created the case

### Dates
- `Created Date` - When case was created
- `Last Modified Date` - Last modification date
- `Last Closed At` - When case was closed

### Jira Links
- `Jira-1` - First related Jira issue
- `Jira-2` - Second related Jira issue
- `Jira-3` - Third related Jira issue
- `All Jira Links` - All Jira links in one column (comma-separated)

### Technical Details
- `OpenShift Cluster ID` - Cluster ID if applicable
- `SBR Groups` - SBR group tags
- `Case Language` - Case language
- `Origin` - How case was created (Web, Email, etc.)

### Flags
- `Is Closed` - true/false
- `FTS` - Follow-the-sun flag
- `Customer Escalation` - Escalation flag
- `Strategic Account` - Strategic account flag

### Other
- `Entitlement SLA` - SLA level (PREMIUM, STANDARD, etc.)
- `SBT` - Something Badly Time metric
- `Case URL` - Direct link to case

## Example Configurations

### Minimal Report
```json
{
  "cases": ["04257923", "04163027"],
  "columns": ["Case Number", "Status", "Description"],
  "output_file": "simple_report.csv"
}
```

### Full Details Report
```json
{
  "cases": ["04257923"],
  "columns": [
    "Case Number",
    "Account",
    "Status",
    "Internal Status",
    "Support Type",
    "Severity",
    "Priority Score",
    "Summary",
    "Description",
    "Product",
    "Version",
    "Owner",
    "Created Date",
    "Last Modified Date",
    "Jira-1",
    "Jira-2",
    "Jira-3",
    "OpenShift Cluster ID",
    "Case URL"
  ],
  "output_file": "full_details.csv"
}
```

### Jira Tracking Report
```json
{
  "cases": ["04257923", "04163027", "04256789"],
  "columns": [
    "Case Number",
    "Summary",
    "Status",
    "Severity",
    "All Jira Links",
    "Owner",
    "Last Modified Date"
  ],
  "output_file": "jira_tracking.csv"
}
```

### Management Dashboard
```json
{
  "cases": ["04257923", "04163027"],
  "columns": [
    "Case Number",
    "Account",
    "Severity",
    "Status",
    "Summary",
    "Owner",
    "Created Date",
    "Strategic Account",
    "Customer Escalation",
    "Entitlement SLA"
  ],
  "output_file": "management_dashboard.csv"
}
```

## Usage

```bash
# 1. Create your config.json file
# 2. Get fresh Bearer token (see credentials.py)
# 3. Run:

cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python fetch_cases_config.py config.json
```

## Tips

1. **Start small**: Test with 1-2 cases first
2. **Only include needed columns**: Less clutter in your CSV
3. **Use descriptive output filenames**: `weekly_report.csv` vs `cases.csv`
4. **Check for unknown columns**: Script warns if column name is wrong

## List All Available Columns

Run without arguments to see all available columns:

```bash
python fetch_cases_config.py
```

## Common Mistakes

❌ **Wrong column name**
```json
"columns": ["Case ID"]  // Wrong! Should be "Case Number"
```

✅ **Correct column name**
```json
"columns": ["Case Number"]
```

❌ **Missing comma**
```json
{
  "cases": ["04257923"]  // Missing comma!
  "columns": ["Status"]
}
```

✅ **Valid JSON**
```json
{
  "cases": ["04257923"],
  "columns": ["Status"]
}
```


