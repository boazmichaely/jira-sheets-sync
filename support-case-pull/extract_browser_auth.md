# Extract Authentication from Browser

Since you're already logged in via SSO, let's use your browser's session.

## Steps:

1. **Open your browser** and go to https://access.redhat.com
2. Make sure you're **logged in via SSO**
3. Open **Developer Tools** (F12 or Cmd+Option+I)
4. Go to the **Network** tab
5. Navigate to a case: https://access.redhat.com/support/cases/#/case/04257923
6. In the Network tab, filter for "cases" or look for: `hydra/rest/cases/04257923`
7. Click on that request
8. Look at the **Request Headers** section
9. Copy one of these:
   - The **Cookie** header (entire value)
   - OR the **Authorization** header if present

## Then run this:

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate

# If you have a Cookie header:
python -c "
import requests
headers = {
    'Cookie': 'PASTE_YOUR_COOKIE_HERE',
    'Accept': 'application/json'
}
response = requests.get('https://access.redhat.com/hydra/rest/cases/04257923', headers=headers)
print(f'Status: {response.status_code}')
print(response.text)
"

# OR if you have an Authorization header:
python -c "
import requests
headers = {
    'Authorization': 'PASTE_YOUR_AUTH_HEADER_HERE',
    'Accept': 'application/json'
}
response = requests.get('https://access.redhat.com/hydra/rest/cases/04257923', headers=headers)
print(f'Status: {response.status_code}')
print(response.text)
"
```

Just copy/paste the actual values from your browser's dev tools.

