#!/usr/bin/env python3
"""
Red Hat Customer Portal API Test Script

Tests the API and shows what data is available for a support case.
"""

import requests
import json
from requests.auth import HTTPBasicAuth
import sys

# Configuration
API_BASE_URL = "https://access.redhat.com"
TEST_CASE_NUMBER = "04257923"  # Sample case from requirements

# Try to load credentials from credentials.py file
try:
    from credentials import (
        OAUTH_CLIENT_ID, 
        OAUTH_CLIENT_SECRET, 
        SSO_TOKEN_URL,
        RH_USERNAME, 
        RH_PASSWORD
    )
except ImportError:
    # Fallback to hardcoded values (you can edit these directly)
    OAUTH_CLIENT_ID = None
    OAUTH_CLIENT_SECRET = None
    SSO_TOKEN_URL = "https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token"
    RH_USERNAME = "YOUR_USERNAME"  # e.g., bmichael@redhat.com
    RH_PASSWORD = "YOUR_PASSWORD"  # Your Red Hat password


def get_oauth_token():
    """
    Get OAuth 2.0 access token using client credentials flow.
    This is for SSO users who have created a service account.
    """
    print("Obtaining OAuth 2.0 access token...")
    
    payload = {
        'grant_type': 'client_credentials',
        'client_id': OAUTH_CLIENT_ID,
        'client_secret': OAUTH_CLIENT_SECRET
    }
    
    try:
        response = requests.post(SSO_TOKEN_URL, data=payload, timeout=30)
        response.raise_for_status()
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"✅ Got access token (expires in {token_data.get('expires_in', 'N/A')} seconds)")
        return access_token
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get OAuth token: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None


def test_single_case(case_number):
    """
    Fetch a single case from the Red Hat Customer Portal API
    and display the complete response structure.
    """
    print(f"Testing Red Hat Customer Portal API")
    print("=" * 70)
    print(f"Case Number: {case_number}")
    print(f"API Endpoint: {API_BASE_URL}/hydra/rest/cases/{case_number}")
    print()

    # Determine authentication method
    headers = {
        "Accept": "application/json",
        "User-Agent": "Python Test Script"
    }
    auth = None
    
    # Try OAuth first (for SSO users)
    if OAUTH_CLIENT_ID and OAUTH_CLIENT_ID != "YOUR_CLIENT_ID_HERE":
        print("Using OAuth 2.0 authentication (SSO)...")
        access_token = get_oauth_token()
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        else:
            print("❌ Failed to get OAuth token. Cannot proceed.")
            return None
    # Fall back to Basic Auth
    elif RH_PASSWORD and RH_PASSWORD != "YOUR_PASSWORD":
        print("Using HTTP Basic Authentication...")
        auth = HTTPBasicAuth(RH_USERNAME, RH_PASSWORD)
    else:
        print("❌ No credentials configured!")
        print("Please edit credentials.py and add either:")
        print("  - OAuth credentials (OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET)")
        print("  - Or Basic Auth (RH_USERNAME, RH_PASSWORD)")
        return None

    # Make the API request
    url = f"{API_BASE_URL}/hydra/rest/cases/{case_number}"
    
    try:
        response = requests.get(
            url,
            auth=auth,
            headers=headers,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print()
        
        if response.status_code == 200:
            print("✅ SUCCESS! API authentication working!")
            print()
            
            # Parse JSON response
            data = response.json()
            
            # Pretty print the full response
            print("Full API Response:")
            print("=" * 70)
            print(json.dumps(data, indent=2))
            print()
            
            # Analyze the structure
            print("=" * 70)
            print("Available Fields:")
            print("=" * 70)
            analyze_fields(data, prefix="")
            print()
            
            # Try to extract the fields we need
            print("=" * 70)
            print("Field Extraction Test:")
            print("=" * 70)
            extract_required_fields(data)
            
            return data
            
        elif response.status_code == 401:
            print("❌ AUTHENTICATION FAILED")
            print()
            print(f"Response: {response.text}")
            print()
            print("Possible solutions:")
            print("1. Check your username and password are correct")
            print("2. If you use SSO, you may need an app-specific password")
            print("3. Check if your account has API access permissions")
            
        elif response.status_code == 404:
            print("❌ CASE NOT FOUND")
            print(f"Case {case_number} does not exist or you don't have access.")
            
        else:
            print(f"❌ UNEXPECTED ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ REQUEST ERROR: {e}")
        
    return None


def analyze_fields(obj, prefix="", max_depth=3, current_depth=0):
    """
    Recursively analyze the structure of the API response
    """
    if current_depth >= max_depth:
        return
        
    if isinstance(obj, dict):
        for key, value in obj.items():
            full_key = f"{prefix}.{key}" if prefix else key
            value_type = type(value).__name__
            
            if isinstance(value, (dict, list)):
                print(f"  {full_key}: {value_type}")
                if isinstance(value, list) and len(value) > 0:
                    print(f"    (contains {len(value)} items)")
                    if len(value) > 0:
                        print(f"    First item type: {type(value[0]).__name__}")
                analyze_fields(value, full_key, max_depth, current_depth + 1)
            else:
                # Show a sample of the value
                sample = str(value)[:50]
                if len(str(value)) > 50:
                    sample += "..."
                print(f"  {full_key}: {value_type} = {sample}")
                
    elif isinstance(obj, list):
        for i, item in enumerate(obj[:3]):  # Show first 3 items
            analyze_fields(item, f"{prefix}[{i}]", max_depth, current_depth + 1)


def extract_required_fields(data):
    """
    Attempt to extract the fields we need based on requirements:
    - Case number
    - Account
    - Status
    - Support Type
    - Severity
    - Description
    - Related Jira tasks (up to 3)
    """
    print("\nAttempting to extract required fields:\n")
    
    # Common field names to try
    field_mappings = {
        "Case Number": ["caseNumber", "case_number", "id", "number"],
        "Account": ["account", "accountName", "account_name", "customer"],
        "Status": ["status", "caseStatus", "case_status", "state"],
        "Support Type": ["supportType", "support_type", "type", "product"],
        "Severity": ["severity", "priority", "urgency"],
        "Description": ["description", "summary", "subject", "title"],
        "Related Tasks": ["relatedTasks", "related_tasks", "jiraLinks", "links", "externalLinks"]
    }
    
    results = {}
    
    for field_name, possible_keys in field_mappings.items():
        found = False
        for key in possible_keys:
            value = extract_nested_value(data, key)
            if value is not None:
                results[field_name] = value
                print(f"✅ {field_name:20} → {key:20} = {value}")
                found = True
                break
        
        if not found:
            print(f"❓ {field_name:20} → NOT FOUND")
            results[field_name] = None
    
    return results


def extract_nested_value(obj, key):
    """
    Search for a key in nested dict/list structures (case-insensitive)
    """
    if isinstance(obj, dict):
        # Direct match (case-insensitive)
        for k, v in obj.items():
            if k.lower() == key.lower():
                return v
        
        # Search nested objects
        for k, v in obj.items():
            result = extract_nested_value(v, key)
            if result is not None:
                return result
                
    elif isinstance(obj, list):
        # Search in list items
        for item in obj:
            result = extract_nested_value(item, key)
            if result is not None:
                return result
                
    return None


def test_multiple_cases():
    """
    Test fetching multiple cases to see if the structure is consistent
    """
    case_numbers = ["04257923", "04163027"]
    
    print("\n" + "=" * 70)
    print("Testing Multiple Cases")
    print("=" * 70)
    
    # Setup auth headers
    headers = {"Accept": "application/json"}
    auth = None
    
    if OAUTH_CLIENT_ID and OAUTH_CLIENT_ID != "YOUR_CLIENT_ID_HERE":
        access_token = get_oauth_token()
        if not access_token:
            print("❌ Failed to get OAuth token")
            return
        headers["Authorization"] = f"Bearer {access_token}"
    elif RH_PASSWORD:
        auth = HTTPBasicAuth(RH_USERNAME, RH_PASSWORD)
    
    for case_num in case_numbers:
        print(f"\nFetching case: {case_num}")
        print("-" * 40)
        
        url = f"{API_BASE_URL}/hydra/rest/cases/{case_num}"
        try:
            response = requests.get(
                url,
                auth=auth,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                # Show a few key fields
                status = extract_nested_value(data, "status") or "N/A"
                desc = extract_nested_value(data, "description") or extract_nested_value(data, "summary") or "N/A"
                print(f"  ✅ Status: {status}")
                print(f"  ✅ Description: {desc[:60]}...")
            else:
                print(f"  ❌ Failed with status {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")


if __name__ == "__main__":
    # Check if credentials are set
    has_oauth = OAUTH_CLIENT_ID and OAUTH_CLIENT_ID != "YOUR_CLIENT_ID_HERE"
    has_basic = RH_PASSWORD and RH_PASSWORD != "YOUR_PASSWORD"
    
    if not has_oauth and not has_basic:
        print("⚠️  WARNING: Please set your credentials!")
        print()
        print("For SSO users (recommended):")
        print("1. Go to https://console.redhat.com/")
        print("2. Create a Service Account")
        print("3. Edit credentials.py and add:")
        print('   OAUTH_CLIENT_ID = "your-client-id"')
        print('   OAUTH_CLIENT_SECRET = "your-client-secret"')
        print()
        print("OR for Basic Auth:")
        print("Edit credentials.py and set RH_PASSWORD")
        print()
        exit(1)
    
    # Run the test
    result = test_single_case(TEST_CASE_NUMBER)
    
    if result:
        # If successful, optionally test multiple cases
        user_input = input("\nTest multiple cases? (y/n): ")
        if user_input.lower() == 'y':
            test_multiple_cases()

