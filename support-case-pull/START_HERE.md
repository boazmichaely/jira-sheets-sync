# 🚀 START HERE

## Quick 3-Step Guide

### Step 1: Get Your Bearer Token (2 minutes)

1. Open https://access.redhat.com in your browser (already logged in)
2. Press **F12** → Click **Network** tab
3. Type `hydra/rest` in the filter box
4. Press **Cmd+R** (reload page)
5. Click on the `04257923` request
6. Find **Authorization** in Request Headers
7. Copy the long string after "Bearer " (starts with `eyJhbGci...`)
8. Open `credentials.py` and paste it on line 19

### Step 2: Configure What You Want (1 minute)

Edit `config.json`:

```json
{
  "cases": [
    "04257923",
    "04163027"
  ],
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

**Want different columns?** Run `python fetch_cases_config.py` to see all 36 options.

### Step 3: Run It (30 seconds)

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python fetch_cases_config.py config.json
```

**Done!** Open `my_cases.csv` 

---

## Example Output

Your CSV will look like:

| Case Number | Status | Severity | Description | Jira-1 | Jira-2 |
|-------------|--------|----------|-------------|--------|--------|
| 04257923 | Waiting on Red Hat | 2 (High) | ADD command is present... | [ROX-31016\|...] | None |
| 04163027 | Closed | 3 (Normal) | Secured cluster services... | None | None |

---

## That's It!

Everything else is in the documentation if you need it:

- **SUMMARY.md** - Overview of the solution
- **CONFIG_GUIDE.md** - All 36 available columns explained
- **README.md** - Full documentation

---

## Common Questions

**Q: My token expired!**  
A: Get a fresh one from the browser (Step 1). They expire every 15 minutes.

**Q: What columns can I include?**  
A: Run `python fetch_cases_config.py` (no arguments) to see all 36 options.

**Q: Can I change the column order?**  
A: Yes! Just reorder them in the `columns` array in config.json.

**Q: How do I add more cases?**  
A: Add case numbers to the `cases` array in config.json.

---

**Ready to go! Start with Step 1 above.** 🎯


