/**
 * Optional helper functions - only include if you need field discovery
 * For basic sync, the main script handles everything
 */

/**
 * Discover available Jira fields (run once to configure JIRA_FIELDS)
 */
function discoverFields() {
  try {
    const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${FILTER_ID}&maxResults=1`;
    
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': `Bearer ${JIRA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      Logger.log('❌ Failed to fetch sample issue');
      return;
    }
    
    const data = JSON.parse(response.getContentText());
    if (!data.issues || data.issues.length === 0) {
      Logger.log('❌ No issues found in filter');
      return;
    }
    
    const issue = data.issues[0];
    Logger.log(`📋 Available fields for ${issue.key}:`);
    
    // Sort fields for easier reading
    const sortedFields = Object.keys(issue.fields).sort();
    
    sortedFields.forEach(fieldKey => {
      const fieldValue = issue.fields[fieldKey];
      let sample = 'null';
      
      if (fieldValue !== null && fieldValue !== undefined) {
        if (Array.isArray(fieldValue)) {
          sample = `[${fieldValue.length} items]`;
        } else if (typeof fieldValue === 'object') {
          sample = fieldValue.name || fieldValue.displayName || '{object}';
        } else {
          sample = fieldValue.toString().substring(0, 50);
        }
      }
      
      Logger.log(`  ${fieldKey} = ${sample}`);
    });
    
    Logger.log('\n💡 Update JIRA_FIELDS in config.js with the field names you need');
    
  } catch (error) {
    Logger.log(`❌ Field discovery failed: ${error.message}`);
  }
}
