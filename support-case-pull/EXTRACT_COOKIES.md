# Extract Cookies from Browser - Step by Step

You have dev tools open! Now follow these steps:

## Step 1: Filter Network Requests

In the Network tab at the top, in the filter box, type:
```
hydra/rest
```

This will show only API requests.

## Step 2: Reload or Navigate

- Either reload the page (Cmd+R)
- Or click on a different case, then back to 04257923

This will trigger the API call.

## Step 3: Find the Request

Look for a request that looks like:
```
04257923
```
or
```
v1/cases/04257923
```

Click on it!

## Step 4: Copy the Cookie Header

1. In the request details on the right, click the "Headers" tab
2. Scroll down to "Request Headers"
3. Find the line that says "Cookie:"
4. It will be VERY LONG - something like:
   ```
   Cookie: _abck=...; bm_sz=...; rh_sso=...; (many more)
   ```
5. **Right-click on the Cookie value and select "Copy value"**
   Or triple-click to select the entire value and copy it

## Step 5: Paste into credentials.py

Edit: `/Users/bmichael/code/Google-scripts/support-case-pull/credentials.py`

Line 17, replace None with your cookie string:
```python
BROWSER_COOKIES = "paste-the-entire-cookie-value-here-in-quotes"
```

## Step 6: Test!

```bash
cd /Users/bmichael/code/Google-scripts/support-case-pull
source venv/bin/activate
python test_api_simple.py
```

You should see the complete case data!


