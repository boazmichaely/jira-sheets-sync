#!/usr/bin/env python3
"""
Red Hat Support Case Fetcher (Config-based)

Fetches support cases based on a JSON configuration file
and exports selected fields to CSV.

Usage:
    python fetch_cases_config.py config.json
"""

import requests
import csv
import sys
import json
from datetime import datetime

# Load credentials
try:
    from credentials import BEARER_TOKEN
except ImportError:
    print("❌ Error: credentials.py not found!")
    print("Please create credentials.py with your BEARER_TOKEN")
    sys.exit(1)

# Configuration
API_BASE_URL = "https://access.redhat.com/hydra/rest"

# Available field mappings from API to user-friendly names
FIELD_MAPPINGS = {
    # Basic fields
    'Case Number': lambda d: d.get('caseNumber', 'N/A'),
    'Account': lambda d: d.get('accountNumberRef', 'N/A'),
    'Account Name': lambda d: d.get('accountName', 'N/A'),
    'Status': lambda d: d.get('status', 'N/A'),
    'Internal Status': lambda d: d.get('internalStatus', 'N/A'),
    'Support Type': lambda d: d.get('caseType', 'N/A'),
    'Severity': lambda d: d.get('severity', 'N/A'),
    'Priority Score': lambda d: d.get('priorityScore', 'N/A'),
    
    # Descriptions
    'Summary': lambda d: d.get('summary', 'N/A'),
    'Description': lambda d: d.get('description', 'N/A'),
    'Issue': lambda d: d.get('issue', 'N/A'),
    'Environment': lambda d: d.get('environment', 'N/A'),
    
    # Product info
    'Product': lambda d: d.get('product', 'N/A'),
    'Version': lambda d: d.get('version', 'N/A'),
    
    # Contact info
    'Contact Name': lambda d: d.get('contactName', 'N/A'),
    'Contact SSO': lambda d: d.get('contactSSOName', 'N/A'),
    'Owner': lambda d: d.get('ownerId', 'N/A'),
    'Created By': lambda d: d.get('createdById', 'N/A'),
    
    # Dates
    'Created Date': lambda d: d.get('createdDate', 'N/A'),
    'Last Modified Date': lambda d: d.get('lastModifiedDate', 'N/A'),
    'Last Closed At': lambda d: d.get('lastClosedAt', 'N/A'),
    
    # Jira links (extracted separately)
    'Jira-1': lambda d: extract_jira_links(d)[0],
    'Jira-2': lambda d: extract_jira_links(d)[1],
    'Jira-3': lambda d: extract_jira_links(d)[2],
    'All Jira Links': lambda d: ', '.join([j for j in extract_jira_links(d) if j != 'None']),
    
    # Technical details
    'OpenShift Cluster ID': lambda d: d.get('openshiftClusterID', 'N/A'),
    'SBR Groups': lambda d: ', '.join(d.get('sbrGroups', [])) if d.get('sbrGroups') else 'N/A',
    'Case Language': lambda d: d.get('caseLanguage', 'N/A'),
    'Origin': lambda d: d.get('origin', 'N/A'),
    
    # Flags
    'Is Closed': lambda d: str(d.get('isClosed', False)),
    'FTS': lambda d: str(d.get('fts', False)),
    'Customer Escalation': lambda d: str(d.get('customerEscalation', False)),
    'Strategic Account': lambda d: str(d.get('isStrategicAccount', False)),
    
    # SLA
    'Entitlement SLA': lambda d: d.get('entitlementSla', 'N/A'),
    'SBT': lambda d: d.get('sbt', 'N/A'),
    
    # Case URL
    'Case URL': lambda d: f"https://access.redhat.com/support/cases/#/case/{d.get('caseNumber', '')}"
}


def extract_jira_links(case_data):
    """Extract up to 3 Jira links from externalTrackers"""
    jira_links = []
    
    external_trackers = case_data.get('externalTrackers', [])
    
    for tracker in external_trackers:
        resource_key = tracker.get('resourceKey', '')
        resource_url = tracker.get('resourceURL', '')
        system = tracker.get('system', '')
        
        if system == 'Jira' and resource_key and resource_url:
            jira_link = f"[{resource_key}|{resource_url}]"
            jira_links.append(jira_link)
    
    # Return up to 3 links, pad with "None" if fewer
    while len(jira_links) < 3:
        jira_links.append("None")
    
    return jira_links[:3]


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


def extract_fields(case_data, column_names):
    """Extract requested fields from case data"""
    extracted = {}
    
    for column in column_names:
        if column in FIELD_MAPPINGS:
            try:
                extracted[column] = FIELD_MAPPINGS[column](case_data)
            except Exception as e:
                print(f"⚠️  Warning: Error extracting '{column}': {e}")
                extracted[column] = 'ERROR'
        else:
            print(f"⚠️  Warning: Unknown column '{column}' - will be empty")
            extracted[column] = 'N/A'
    
    return extracted


def load_config(config_file):
    """Load configuration from JSON file"""
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        
        # Validate required fields
        if 'cases' not in config:
            print("❌ Error: Config must contain 'cases' field")
            sys.exit(1)
        
        if 'columns' not in config:
            print("❌ Error: Config must contain 'columns' field")
            sys.exit(1)
        
        return config
        
    except FileNotFoundError:
        print(f"❌ Error: Config file '{config_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in config file: {e}")
        sys.exit(1)


def write_to_csv(cases_data, output_file, fieldnames):
    """Write cases data to CSV file"""
    
    if not cases_data:
        print("⚠️  No cases to write")
        return
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(cases_data)
        
        print(f"\n✅ Successfully wrote {len(cases_data)} cases to {output_file}")
        
    except Exception as e:
        print(f"❌ Error writing CSV file: {e}")
        sys.exit(1)


def print_available_fields():
    """Print all available field names"""
    print("\nAvailable field names for 'columns' in config.json:")
    print("=" * 70)
    for i, field in enumerate(sorted(FIELD_MAPPINGS.keys()), 1):
        print(f"  {i:2}. {field}")
    print()


def main():
    """Main function"""
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        print("Usage: python fetch_cases_config.py <config.json>")
        print("\nExample config.json:")
        print(json.dumps({
            "cases": ["04257923", "04163027"],
            "columns": ["Case Number", "Status", "Severity", "Description", "Jira-1"],
            "output_file": "cases_output.csv"
        }, indent=2))
        print()
        print_available_fields()
        sys.exit(1)
    
    config_file = sys.argv[1]
    
    # Load configuration
    config = load_config(config_file)
    case_numbers = config['cases']
    columns = config['columns']
    output_file = config.get('output_file', f"cases_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
    
    # Check if Bearer token is configured
    if not BEARER_TOKEN or BEARER_TOKEN == "None":
        print("❌ No Bearer token configured!")
        print("\nPlease edit credentials.py and add your Bearer token.")
        sys.exit(1)
    
    print("=" * 70)
    print("Red Hat Support Case Fetcher (Config-based)")
    print("=" * 70)
    print(f"Config file:  {config_file}")
    print(f"Output file:  {output_file}")
    print(f"Cases:        {len(case_numbers)}")
    print(f"Columns:      {len(columns)}")
    print()
    
    # Validate columns
    unknown_columns = [col for col in columns if col not in FIELD_MAPPINGS]
    if unknown_columns:
        print(f"⚠️  Warning: Unknown columns will be empty: {', '.join(unknown_columns)}")
        print()
    
    # Fetch all cases
    cases_data = []
    failed_cases = []
    
    for i, case_number in enumerate(case_numbers, 1):
        print(f"[{i}/{len(case_numbers)}] Fetching case {case_number}...", end=' ')
        
        case_data = fetch_case(case_number, BEARER_TOKEN)
        
        if case_data:
            extracted_data = extract_fields(case_data, columns)
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
        write_to_csv(cases_data, output_file, columns)
        print()
        print("🎉 Done! You can now open the CSV file.")
    else:
        print("\n❌ No cases were successfully fetched.")
        sys.exit(1)


if __name__ == "__main__":
    main()


