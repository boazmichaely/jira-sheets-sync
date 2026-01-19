# Setup Instructions

## ✅ Python Environment Ready!

Everything is set up. Now you just need to add your credentials and run the test.

## Step 1: Add Your Credentials

Edit `test_api.py` lines 14-15:

```python
RH_USERNAME = "bmichael@redhat.com"  # Your Red Hat email
RH_PASSWORD = "your-password-here"    # Your password
```

## Step 2: Run the Test

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python test_api.py
```

## What You'll See

If successful:
- ✅ Complete JSON response from the API
- 📋 All available fields listed
- 🔍 Automatic field mapping to your requirements
- 📊 Extraction test results

If authentication fails:
- ❌ 401 error
- You may need an app-specific password (check Red Hat account settings)

## Next Steps

Once the test works:
1. Share the output with me
2. I'll see exactly what fields are available
3. I'll build the full solution to:
   - Read case numbers from CSV
   - Fetch all cases
   - Extract required fields
   - Output to CSV

## Troubleshooting

**"Unable to authenticate"**: 
- Check username/password are correct
- If you use SSO, you might need an app-specific password
- Check Red Hat account settings for API access

**Import errors**:
- Make sure you activated the venv: `source venv/bin/activate`
- You should see `(venv)` in your terminal prompt

