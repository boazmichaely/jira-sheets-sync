# Quick Usage Guide

## Every Time You Run:

### Step 1: Get Fresh Token (15 min expiry)
1. Open browser → https://access.redhat.com
2. F12 → Network tab → Filter: `hydra/rest`
3. Cmd+R to reload
4. Click case request → Headers → Copy "Authorization" value
5. Paste in `credentials.py` line 19

### Step 2: Add Case Numbers
Edit `cases_input.txt`:
```
04257923
04163027
```

### Step 3: Run
```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python fetch_cases.py cases_input.txt
```

### Step 4: Open CSV
Open the generated `cases_YYYYMMDD_HHMMSS.csv` file

## That's It!

The CSV will have all your case data with Jira links.

## Common Issues

| Problem | Solution |
|---------|----------|
| Token expired | Get fresh token from browser |
| Case not found | Check case number is correct |
| No credentials | Edit credentials.py |

## Output Columns

1. Case Number
2. Account  
3. Status
4. Support Type
5. Severity
6. Description
7. Jira-1
8. Jira-2
9. Jira-3


