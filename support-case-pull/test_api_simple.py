#!/usr/bin/env python3
"""
Simple Red Hat Customer Portal API Test

Tests authentication and shows the full case data structure.
"""

import requests
import json

# Configuration
API_BASE_URL = "https://access.redhat.com/hydra/rest"
TEST_CASE_NUMBER = "04257923"

# Load credentials
try:
    from credentials import BEARER_TOKEN
except ImportError:
    BEARER_TOKEN = None


def test_case_api():
    """Test fetching a case with available authentication"""
    
    print("=" * 70)
    print("Red Hat Customer Portal API Test")
    print("=" * 70)
    print(f"Endpoint: {API_BASE_URL}/v1/cases/{TEST_CASE_NUMBER}")
    print()
    
    # Setup authentication
    if not BEARER_TOKEN:
        print("❌ No Bearer token configured!")
        print()
        print("Edit credentials.py and add your Bearer token:")
        print("  BEARER_TOKEN = \"eyJhbGci...\" (from browser dev tools)")
        print()
        return None
    
    print("✓ Using Bearer token")
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }
    
    # Make the request
    url = f"{API_BASE_URL}/v1/cases/{TEST_CASE_NUMBER}"
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        print(f"Status: {response.status_code}")
        print()
        
        if response.status_code == 200:
            print("✅ SUCCESS! Got case data!")
            print("=" * 70)
            
            data = response.json()
            
            # Pretty print the full response
            print(json.dumps(data, indent=2))
            print()
            print("=" * 70)
            
            # Show available fields
            print("\nAvailable fields:")
            for key in sorted(data.keys()):
                value = data[key]
                if value is not None and value != "":
                    value_preview = str(value)[:50]
                    if len(str(value)) > 50:
                        value_preview += "..."
                    print(f"  {key:30} = {value_preview}")
            
            # Show required fields
            print()
            print("=" * 70)
            print("Required Fields Extraction:")
            print("=" * 70)
            print(f"Case Number:    {data.get('caseNumber', 'N/A')}")
            print(f"Account:        {data.get('accountNumberRef', 'N/A')}")
            print(f"Status:         {data.get('status', 'N/A')}")
            print(f"Type:           {data.get('caseType', 'N/A')}")
            print(f"Severity:       {data.get('severity', 'N/A')}")
            print(f"Summary:        {data.get('summary', 'N/A')}")
            print(f"Description:    {data.get('description', 'N/A')[:100]}...")
            
            # Check for Jira links
            print()
            print("Jira/Bugzilla Links:")
            if 'bugzillas' in data and data['bugzillas']:
                for i, bug in enumerate(data['bugzillas'][:3], 1):
                    print(f"  Link {i}: {bug}")
            else:
                print("  None found in 'bugzillas' field")
            
            # Check for external trackers
            if 'caseResourceLinks' in data:
                print("  caseResourceLinks:", data['caseResourceLinks'])
            
            return data
            
        elif response.status_code == 401:
            print("❌ Authentication failed")
            print()
            print("Response:", response.text)
            print()
            print("Solution: Your Bearer token has expired. Extract a fresh one from browser dev tools.")
            
        elif response.status_code == 404:
            print(f"❌ Case {TEST_CASE_NUMBER} not found or no access")
            
        else:
            print(f"❌ Unexpected error: {response.status_code}")
            print("Response:", response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    return None


if __name__ == "__main__":
    result = test_case_api()
    
    if result:
        print("\n🎉 Test successful! Ready to build the full solution.")
    else:
        print("\n❌ Test failed. Please configure credentials.")

