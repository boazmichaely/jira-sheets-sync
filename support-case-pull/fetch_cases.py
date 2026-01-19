#!/usr/bin/env python3
"""
Red Hat Support Case Fetcher

Fetches multiple support cases from Red Hat Customer Portal API
and exports them to CSV.

Usage:
    python fetch_cases.py cases_input.txt
    python fetch_cases.py cases_input.txt -o output.csv
"""

import requests
import csv
import sys
import json
from datetime import datetime
from pathlib import Path

# Load credentials
try:
    from credentials import BEARER_TOKEN
except ImportError:
    print("❌ Error: credentials.py not found!")
    print("Please create credentials.py with your BEARER_TOKEN")
    sys.exit(1)

# Configuration
API_BASE_URL = "https://access.redhat.com/hydra/rest"


def fetch_case(case_number, bearer_token):
    """Fetch a single case from the API"""
    url = f"{API_BASE_URL}/v1/cases/{case_number}"
    
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {bearer_token}"
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            print(f"❌ Authentication failed for case {case_number}")
            print("   Your Bearer token may have expired. Get a fresh one from the browser.")
            return None
        elif response.status_code == 404:
            print(f"⚠️  Case {case_number} not found or no access")
            return None
        else:
            print(f"❌ Error fetching case {case_number}: HTTP {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error fetching case {case_number}: {e}")
        return None


def extract_jira_links(case_data):
    """Extract up to 3 Jira links from externalTrackers"""
    jira_links = []
    
    # Look for externalTrackers field
    external_trackers = case_data.get('externalTrackers', [])
    
    for tracker in external_trackers:
        # Check if this is a Jira link
        resource_key = tracker.get('resourceKey', '')
        resource_url = tracker.get('resourceURL', '')
        system = tracker.get('system', '')
        
        # Only include Jira trackers
        if system == 'Jira' and resource_key and resource_url:
            # Format as [KEY|URL]
            jira_link = f"[{resource_key}|{resource_url}]"
            jira_links.append(jira_link)
    
    # Return up to 3 links, pad with "None" if fewer
    while len(jira_links) < 3:
        jira_links.append("None")
    
    return jira_links[:3]


def extract_case_data(case_data):
    """Extract required fields from case data"""
    
    # Extract basic fields
    case_number = case_data.get('caseNumber', 'N/A')
    account = case_data.get('accountNumberRef', 'N/A')
    status = case_data.get('status', 'N/A')
    support_type = case_data.get('caseType', 'N/A')
    severity = case_data.get('severity', 'N/A')
    
    # Description: try summary first, then description
    description = case_data.get('summary', '')
    if not description:
        description = case_data.get('description', 'N/A')
    
    # Extract Jira links
    jira_1, jira_2, jira_3 = extract_jira_links(case_data)
    
    return {
        'Case Number': case_number,
        'Account': account,
        'Status': status,
        'Support Type': support_type,
        'Severity': severity,
        'Description': description,
        'Jira-1': jira_1,
        'Jira-2': jira_2,
        'Jira-3': jira_3
    }


def read_case_numbers(input_file):
    """Read case numbers from input file"""
    case_numbers = []
    
    try:
        with open(input_file, 'r') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if line and not line.startswith('#'):
                    case_numbers.append(line)
        
        return case_numbers
    except FileNotFoundError:
        print(f"❌ Error: Input file '{input_file}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error reading input file: {e}")
        sys.exit(1)


def write_to_csv(cases_data, output_file):
    """Write cases data to CSV file"""
    
    if not cases_data:
        print("⚠️  No cases to write")
        return
    
    # Define column order
    fieldnames = [
        'Case Number',
        'Account',
        'Status',
        'Support Type',
        'Severity',
        'Description',
        'Jira-1',
        'Jira-2',
        'Jira-3'
    ]
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(cases_data)
        
        print(f"\n✅ Successfully wrote {len(cases_data)} cases to {output_file}")
        
    except Exception as e:
        print(f"❌ Error writing CSV file: {e}")
        sys.exit(1)


def main():
    """Main function"""
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python fetch_cases.py <input_file> [-o output_file]")
        print("\nExample:")
        print("  python fetch_cases.py cases_input.txt")
        print("  python fetch_cases.py cases_input.txt -o my_cases.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    # Check for output file option
    output_file = None
    if len(sys.argv) >= 4 and sys.argv[2] == '-o':
        output_file = sys.argv[3]
    else:
        # Default output filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_file = f"cases_{timestamp}.csv"
    
    # Check if Bearer token is configured
    if not BEARER_TOKEN or BEARER_TOKEN == "None":
        print("❌ No Bearer token configured!")
        print("\nPlease edit credentials.py and add your Bearer token.")
        print("See credentials.py for instructions on how to extract it from your browser.")
        sys.exit(1)
    
    print("=" * 70)
    print("Red Hat Support Case Fetcher")
    print("=" * 70)
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")
    print()
    
    # Read case numbers
    case_numbers = read_case_numbers(input_file)
    print(f"Found {len(case_numbers)} case numbers to fetch")
    print()
    
    # Fetch all cases
    cases_data = []
    failed_cases = []
    
    for i, case_number in enumerate(case_numbers, 1):
        print(f"[{i}/{len(case_numbers)}] Fetching case {case_number}...", end=' ')
        
        case_data = fetch_case(case_number, BEARER_TOKEN)
        
        if case_data:
            extracted_data = extract_case_data(case_data)
            cases_data.append(extracted_data)
            print("✅")
        else:
            failed_cases.append(case_number)
            print("❌")
        
        # Small delay to avoid overwhelming the API
        if i < len(case_numbers):
            import time
            time.sleep(0.5)
    
    print()
    print("=" * 70)
    print(f"Successfully fetched: {len(cases_data)} cases")
    if failed_cases:
        print(f"Failed to fetch:      {len(failed_cases)} cases")
        print(f"Failed cases:         {', '.join(failed_cases)}")
    print("=" * 70)
    
    # Write to CSV
    if cases_data:
        write_to_csv(cases_data, output_file)
        print()
        print("🎉 Done! You can now open the CSV file.")
    else:
        print("\n❌ No cases were successfully fetched.")
        sys.exit(1)


if __name__ == "__main__":
    main()

