# SSO Setup Guide

Since you use SSO, you need to create a Service Account to get API credentials.

## Step 1: Create a Service Account

1. Go to **https://console.redhat.com/**
2. Log in with your SSO credentials
3. Look for **"Service Accounts"** in the menu (might be under Settings or IAM)
4. Click **"Create Service Account"**
5. Give it a name like "Support Case API Access"
6. **Save the Client ID and Client Secret** (you won't be able to see the secret again!)

## Step 2: Configure Permissions

Make sure the service account has permissions to access support cases:
- Look for roles/permissions settings
- Ensure it can "Read Support Cases" or similar

## Step 3: Add Credentials to Script

Edit `/Users/bmichael/code/Google-scripts/support-case-pull/credentials.py`:

```python
OAUTH_CLIENT_ID = "your-client-id-from-step-1"
OAUTH_CLIENT_SECRET = "your-client-secret-from-step-1"
```

## Step 4: Test It!

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python test_api.py
```

## Troubleshooting

**Can't find "Service Accounts"?**
- Try looking under: Settings → Identity & Access Management
- Or search for "API" or "Service Account" in the console

**401 Unauthorized after setup?**
- Check that the service account has the right permissions
- Verify you copied the client ID and secret correctly
- The secret is case-sensitive!

**Still stuck?**
Let me know what you see and I can help!

## Alternative: Browser Session Method

If service accounts don't work, we can extract your session cookies from the browser after you log in and use those. Let me know if you need this option.

