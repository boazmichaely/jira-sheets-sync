# Red Hat Support Case Pull - Complete Solution

## 🎉 What You Have

A complete, working Python solution to fetch Red Hat support cases and export to CSV.

## 📦 Two Versions

### 1. Config-Based (Recommended)
**File**: `fetch_cases_config.py`

**Use when**: You want full control over what columns appear in your CSV

**Example**:
```json
{
  "cases": ["04257923", "04163027"],
  "columns": ["Case Number", "Status", "Severity", "Jira-1"],
  "output_file": "my_report.csv"
}
```

**Run**: `python fetch_cases_config.py config.json`

**Advantages**:
- Choose only the columns you need
- Control column order
- 36 different fields available
- Reusable configs for different reports

### 2. Simple Version
**File**: `fetch_cases.py`

**Use when**: You just want quick results with default columns

**Run**: `python fetch_cases.py cases_input.txt`

**Advantages**:
- Simple text file input
- Fixed column set (Case Number, Account, Status, Type, Severity, Description, Jira-1/2/3)
- Faster to set up

## 🔑 Key Features

✅ **Fetches from Red Hat API** - No scraping, official API  
✅ **Bearer Token Auth** - Extracts from your browser session  
✅ **Jira Link Extraction** - Pulls related Jira issues automatically  
✅ **36 Available Fields** - Account, Status, Dates, Contacts, Technical details  
✅ **CSV Export** - Clean, ready to import anywhere  
✅ **Error Handling** - Shows which cases failed and why  
✅ **Progress Display** - See what's happening in real-time  

## 📊 Available Data

### Basic Info
Case Number, Account, Status, Support Type, Severity, Summary, Description

### Product & Technical
Product, Version, OpenShift Cluster ID, Environment, SBR Groups

### People & Contacts
Owner, Contact Name, Contact SSO, Created By

### Dates & Timeline
Created Date, Last Modified Date, Last Closed At

### Jira Integration
Jira-1, Jira-2, Jira-3, All Jira Links

### Status & Flags
Internal Status, Is Closed, FTS, Customer Escalation, Strategic Account

### Other
Priority Score, SBT, Entitlement SLA, Origin, Case URL

## 🚀 Quick Usage

```bash
# 1. Get Bearer token from browser (expires in 15 min)
#    See credentials.py for instructions

# 2. Edit config.json with your cases and desired columns

# 3. Run
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python fetch_cases_config.py config.json

# 4. Open the CSV!
```

## 📚 Documentation

- **README.md** - Main documentation with setup instructions
- **CONFIG_GUIDE.md** - Complete guide to config.json and all 36 columns
- **USAGE.md** - Quick reference for daily use
- **credentials.py** - Instructions for extracting Bearer token

## 🔄 Workflow

1. **Every time before running**: Get fresh Bearer token (15 min expiry)
2. **Create/update config.json**: Specify cases and columns
3. **Run the script**: Get your CSV
4. **Use the data**: Import to sheets, dashboards, reports

## 💡 Example Use Cases

### Weekly Status Report
```json
{
  "cases": ["04257923", "04163027", "04256789"],
  "columns": [
    "Case Number",
    "Status", 
    "Severity",
    "Owner",
    "Last Modified Date"
  ]
}
```

### Jira Tracking
```json
{
  "cases": ["04257923"],
  "columns": [
    "Case Number",
    "Summary",
    "All Jira Links",
    "Status"
  ]
}
```

### Management Dashboard
```json
{
  "columns": [
    "Case Number",
    "Account",
    "Severity",
    "Status",
    "Customer Escalation",
    "Strategic Account",
    "Priority Score"
  ]
}
```

## ⚠️ Important Notes

**Token Expiry**: Bearer tokens expire after 15 minutes. You'll need to get a fresh one each time you run the script. This is normal - it's how Red Hat's SSO works.

**Case Access**: You can only fetch cases you have access to. If a case fails with 404, you may not have permission.

**Rate Limiting**: Script includes 0.5 second delays between requests to be nice to the API.

## 🎯 What's Next?

You're ready to use it! Just:
1. Update your Bearer token in `credentials.py`
2. Create your `config.json`
3. Run the script
4. Get your CSV!

## 📁 Project Structure

```
support-case-pull/
├── fetch_cases_config.py    ← Config-based (recommended)
├── fetch_cases.py            ← Simple version
├── test_api_simple.py        ← Test API connection
├── config.json               ← Your config file
├── cases_input.txt           ← For simple version
├── credentials.py            ← Your Bearer token
├── requirements.txt          ← Dependencies (installed)
├── venv/                     ← Python environment (ready)
│
└── Documentation:
    ├── README.md             ← Main docs
    ├── CONFIG_GUIDE.md       ← All columns explained
    ├── USAGE.md              ← Quick reference
    └── SUMMARY.md            ← This file!
```

---

**Ready to go!** 🚀


