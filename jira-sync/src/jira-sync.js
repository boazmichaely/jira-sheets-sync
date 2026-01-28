/**
 * === Enhanced Jira to Google Sheets Sync ===
 * 
 * Professional solution with issue key matching for data preservation.
 * Syncs your RFE filter to Google Sheets while preserving custom prioritization columns.
 * 
 * Features:
 * - Issue key matching preserves custom data during sync
 * - Handles new/deleted issues gracefully
 * - Maintains your sheet ordering (new issues at end)
 * - Converts LexoRank to human-readable ranking (1, 2, 3...)
 * - Preserves custom prioritization columns
 * 
 * Setup:
 * 1. Update token.js with your Jira Personal Access Token
 * 2. Run syncJiraIssues() to test
 * 3. Manual sync only - run when needed
 */

/**
 * Main sync function for current user - fetches Jira issues and updates Google Sheet
 * 
 * Sync logic:
 * 1. Maintain user's sort order
 * 2. Delete rows for issues no longer in Jira
 * 3. Update Jira columns for existing issues (preserve PRICE)
 * 4. Add new issues at end with default PRICE values
 */
function syncJiraIssues() {
  const sheetName = getUserSheetName();
  const filterId = getUserFilterId();
  syncJiraIssuesCore(sheetName, filterId);
}

/**
 * Sync function for team sheet - fetches all team issues to Jira-all sheet
 */
function syncTeamIssues() {
  const sheetName = TEAM_SHEET_NAME;
  const filterId = getTeamFilterId();
  syncJiraIssuesCore(sheetName, filterId);
}

/**
 * Push RICE values from sheet to Jira for out-of-sync issues
 * Only pushes rows where Sync Status = "≠"
 */
function pushRiceToJira() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  
  // RICE field IDs in Jira
  const RICE_FIELD_IDS = {
    reach: 'customfield_12320846',
    impact: 'customfield_12320740',
    confidence: 'customfield_12320847',
    effort: 'customfield_12320848'
  };
  
  try {
    Logger.log('=== Push RICE to Jira ===');
    
    // Find column positions by header name
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const keyCol = headers.indexOf('Key') + 1;
    const reachValCol = headers.indexOf('Reach (Value)') + 1;
    const impactValCol = headers.indexOf('Impact (Value)') + 1;
    const confidenceCol = headers.indexOf('Confidence') + 1;  // Dropdown column for ID lookup
    const effortValCol = headers.indexOf('Effort (Value)') + 1;
    const syncStatusCol = headers.indexOf('Sync Status') + 1;
    
    if (!keyCol || !reachValCol || !impactValCol || !confidenceCol || !effortValCol || !syncStatusCol) {
      throw new Error('Required columns not found. Make sure sheet has RICE columns and Sync Status.');
    }
    
    // Read all data rows
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      ui.alert('No data rows to push.');
      return { success: true, count: 0 };
    }
    
    const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
    const allData = dataRange.getValues();
    
    // Find rows where Sync Status = "≠"
    const outOfSyncRows = [];
    for (let i = 0; i < allData.length; i++) {
      const syncStatus = allData[i][syncStatusCol - 1];
      if (syncStatus === '≠') {
        const keyCell = allData[i][keyCol - 1];
        // Extract issue key from hyperlink formula if needed
        let issueKey = keyCell;
        if (typeof keyCell === 'string' && keyCell.includes('HYPERLINK')) {
          const match = keyCell.match(/"([^"]+)"\s*\)$/);
          if (match) issueKey = match[1];
        }
        
        outOfSyncRows.push({
          row: i + 2,  // Actual row number (1-based, after header)
          issueKey: issueKey,
          reach: allData[i][reachValCol - 1],
          impact: allData[i][impactValCol - 1],
          confidence: allData[i][confidenceCol - 1],  // Dropdown value for lookup
          effort: allData[i][effortValCol - 1]
        });
      }
    }
    
    if (outOfSyncRows.length === 0) {
      ui.alert('All issues are in sync. Nothing to push.');
      return { success: true, count: 0 };
    }
    
    // Confirmation dialog
    let confirmMessage = `Push RICE values for ${outOfSyncRows.length} out-of-sync issue(s) to Jira?`;
    if (outOfSyncRows.length > 1) {
      confirmMessage += '\n\nThis may take a few seconds, please be patient.';
    }
    
    const response = ui.alert('Confirm Push', confirmMessage, ui.ButtonSet.OK_CANCEL);
    if (response !== ui.Button.OK) {
      Logger.log('Push cancelled by user');
      return { success: false, cancelled: true };
    }
    
    // Get Confidence mapping for ID lookup (column 1 = dropdown value, column 4 = Jira ID)
    const confidenceMapping = spreadsheet.getRangeByName('Confidence_Mapping');
    const confidenceData = confidenceMapping.getValues();
    
    // Build confidence value to ID map
    const confidenceIdMap = {};
    for (let i = 0; i < confidenceData.length; i++) {
      const dropdownValue = confidenceData[i][0];  // Column 1: dropdown value
      const jiraId = confidenceData[i][3];          // Column 4: Jira ID
      if (dropdownValue && jiraId !== undefined) {
        confidenceIdMap[dropdownValue] = jiraId.toString();
      }
    }
    Logger.log('Confidence ID map: %s', JSON.stringify(confidenceIdMap));
    
    // Push each issue
    const results = [];
    const totalIssues = outOfSyncRows.length;
    
    spreadsheet.toast(
      `Pushing RICE values for ${totalIssues} issues...`,
      'Push RICE to Jira',
      -1
    );
    
    for (let i = 0; i < outOfSyncRows.length; i++) {
      const issue = outOfSyncRows[i];
      const issueNum = i + 1;
      
      // Progress notification
      spreadsheet.toast(
        `Writing issue ${issueNum} out of ${totalIssues} (${issue.issueKey})...`,
        'Push RICE to Jira',
        -1
      );
      Logger.log('Writing issue %s out of %s (%s)...', issueNum, totalIssues, issue.issueKey);
      
      try {
        // Convert confidence to Jira ID
        const confidenceId = confidenceIdMap[issue.confidence];
        if (confidenceId === undefined) {
          throw new Error(`Unknown confidence value: ${issue.confidence}`);
        }
        
        const payload = {
          fields: {
            [RICE_FIELD_IDS.reach]: issue.reach,
            [RICE_FIELD_IDS.impact]: issue.impact,
            [RICE_FIELD_IDS.confidence]: { id: confidenceId },
            [RICE_FIELD_IDS.effort]: issue.effort
          }
        };
        
        const url = `${JIRA_BASE_URL}/rest/api/2/issue/${issue.issueKey}`;
        
        const response = UrlFetchApp.fetch(url, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${JIRA_TOKEN}`,
            'Content-Type': 'application/json'
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        
        const responseCode = response.getResponseCode();
        
        if (responseCode >= 200 && responseCode < 300) {
          Logger.log('  ✅ %s updated successfully', issue.issueKey);
          results.push({ issueKey: issue.issueKey, success: true });
        } else {
          const responseBody = response.getContentText();
          Logger.log('  ❌ %s failed: %s', issue.issueKey, responseBody);
          results.push({ issueKey: issue.issueKey, success: false, error: responseBody });
        }
        
      } catch (error) {
        Logger.log('  ❌ %s error: %s', issue.issueKey, error.message);
        results.push({ issueKey: issue.issueKey, success: false, error: error.message });
      }
    }
    
    // Summary
    const successCount = results.filter(r => r.success).length;
    Logger.log('=== Push Complete: %s of %s successful ===', successCount, totalIssues);
    
    // Re-sync to update Sync Status (skip confirmation since user already confirmed push)
    spreadsheet.toast('Re-syncing to update status...', 'Push RICE to Jira', -1);
    const sheetName = sheet.getName();
    const filterId = sheetName === TEAM_SHEET_NAME ? getTeamFilterId() : getUserFilterId();
    syncJiraIssuesCore(sheetName, filterId, true);
    
    return {
      success: successCount === totalIssues,
      total: totalIssues,
      successCount: successCount,
      results: results
    };
    
  } catch (error) {
    Logger.log('ERROR: Push failed: %s', error.message);
    throw error;
  }
}

/**
 * Core sync function - fetches Jira issues and updates Google Sheet
 * @param {string} sheetName - Name of the target sheet
 * @param {string} filterId - Jira filter ID to use
 * @param {boolean} skipConfirmation - If true, skip the confirmation dialog
 */
function syncJiraIssuesCore(sheetName, filterId, skipConfirmation) {
  try {
    Logger.log('=== Starting Jira Sync ===');
    Logger.log('Target sheet: %s, Filter ID: %s', sheetName, filterId);
    
    // Get or create the sheet
    const sheet = getSheetByName(sheetName);
    
    // Show confirmation before sync (unless skipped)
    if (!skipConfirmation) {
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        'Confirm Sync',
        `Ready to sync Jira issues to:\n"${sheetName}"\n\nThis will update the sheet with your current Jira filter results.\n\nProceed?`,
        ui.ButtonSet.OK_CANCEL
      );
      
      if (response !== ui.Button.OK) {
        Logger.log('Sync cancelled by user');
        return;
      }
    }
    
    // Clear any active filter criteria but keep filter dropdowns
    const filter = sheet.getFilter();
    if (filter) {
      const filterRange = filter.getRange();
      filter.remove();
      sheet.getRange(filterRange.getA1Notation()).createFilter();
      logDebug(' Cleared filter criteria');
    }
    
    // Step 1: Fetch issues from Jira
    logDebug(' Step 1 - Fetching issues from Jira...');
    const jiraIssues = fetchJiraIssuesWithFilter(filterId);
    if (!jiraIssues || jiraIssues.length === 0) {
      Logger.log('No issues found in Jira filter');
      return;
    }
    logDebug(' Fetched %s issues from Jira', jiraIssues.length);
    
    // Build Jira issue map and rank map
    const jiraIssueMap = {};
    const jiraRankMap = {};
    jiraIssues.forEach((issue, index) => {
      jiraIssueMap[issue.key] = issue;
      jiraRankMap[issue.key] = index + 1;
    });
    logDebug(' Built Jira maps for %s issues', Object.keys(jiraIssueMap).length);
    
    // Step 2: Read current sheet state
    logDebug(' Step 2 - Reading current sheet state...');
    const sheetState = readSheetState(sheet);
    logDebug(' Found %s existing issues in sheet', Object.keys(sheetState.issueRows).length);
    
    // Step 3: Determine what to do with each issue
    logDebug(' Step 3 - Categorizing issues...');
    const existingKeys = Object.keys(sheetState.issueRows);
    const jiraKeys = new Set(Object.keys(jiraIssueMap));
    
    const toDelete = existingKeys.filter(key => !jiraKeys.has(key));
    const toUpdate = existingKeys.filter(key => jiraKeys.has(key));
    const toAdd = [...jiraKeys].filter(key => !sheetState.issueRows[key]);
    
    logDebug(' To DELETE: %s issues (%s)', toDelete.length, toDelete.join(', ') || 'none');
    logDebug(' To UPDATE: %s issues', toUpdate.length);
    logDebug(' To ADD: %s issues (%s)', toAdd.length, toAdd.join(', ') || 'none');
    
    // Step 4: Delete rows for removed issues (from bottom to top to preserve row numbers)
    logDebug(' Step 4 - Deleting removed issues...');
    if (toDelete.length > 0) {
      const rowsToDelete = toDelete.map(key => sheetState.issueRows[key]).sort((a, b) => b - a);
      logDebug(' Deleting rows (bottom to top): %s', rowsToDelete.join(', '));
      rowsToDelete.forEach(row => {
        sheet.deleteRow(row);
        logDebug(' Deleted row %s', row);
      });
    }
    
    // Step 5: Re-read sheet state after deletions (row numbers have changed)
    logDebug(' Step 5 - Re-reading sheet state after deletions...');
    const updatedSheetState = readSheetState(sheet);
    logDebug(' Sheet now has %s issues', Object.keys(updatedSheetState.issueRows).length);
    
    // Step 6: Update existing issues in place (Jira columns only, preserve PRICE)
    // Also update Effort from Size if Size is populated
    logDebug(' Step 6 - Updating existing issues in place...');
    const priceStartColumn = JIRA_FIELDS.length + 1;
    const effortColumn = priceStartColumn + 4;  // P, Reach, Impact, Confidence, Effort
    const sizeColumnIndex = FIELD_CONFIG.findIndex(f => f.header === 'Size');
    const sizeColumn = sizeColumnIndex >= 0 ? sizeColumnIndex + 1 : null;
    
    // Get Effort dropdown rule for rows without Size
    const effortMapping = SpreadsheetApp.getActiveSpreadsheet().getRangeByName('Effort_Mapping');
    const effortRange = effortMapping ? effortMapping.offset(0, 0, effortMapping.getNumRows(), 1) : null;
    const effortRule = effortRange ? SpreadsheetApp.newDataValidation()
      .requireValueInRange(effortRange)
      .setAllowInvalid(false)
      .build() : null;
    
    toUpdate.forEach(key => {
      const row = updatedSheetState.issueRows[key];
      if (row) {
        const issue = jiraIssueMap[key];
        const rowData = buildJiraRowData(issue, jiraRankMap[key]);
        sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
        logDebug(' Updated row %s for %s', row, key);
        
        // Check if Size has a value and update Effort accordingly
        if (sizeColumn) {
          const sizeValue = sheet.getRange(row, sizeColumn).getValue();
          const effortCell = sheet.getRange(row, effortColumn);
          
          if (sizeValue && sizeValue !== '') {
            // Size exists: set Effort to Size, gray background, no dropdown
            effortCell.setValue(sizeValue);
            effortCell.setBackground('#d9d9d9');
            effortCell.setDataValidation(null);
            logDebug(' Row %s: Effort updated from Size (%s)', row, sizeValue);
          } else {
            // No Size: ensure yellow background and dropdown (in case Size was removed)
            effortCell.setBackground('#ffff00');
            if (effortRule) {
              effortCell.setDataValidation(effortRule);
            }
          }
        }
      }
    });
    
    // Step 7: Add new issues at the end with default PRICE values (batched for performance)
    logDebug(' Step 7 - Adding new issues...');
    if (toAdd.length > 0) {
      const lastRow = sheet.getLastRow();
      const startRow = lastRow > 0 ? lastRow + 1 : 2; // Start at row 2 if sheet is empty
      const rowCount = toAdd.length;
      logDebug(' Adding %s new issues starting at row %s (batched)', rowCount, startRow);
      
      // Build all row data at once
      const allRowData = toAdd.map(key => {
        const issue = jiraIssueMap[key];
        return buildJiraRowData(issue, jiraRankMap[key]);
      });
      
      // Write all Jira data in one batch
      sheet.getRange(startRow, 1, rowCount, allRowData[0].length).setValues(allRowData);
      logDebug(' Wrote %s rows of Jira data', rowCount);
      
      // Apply PRICE to all new rows in batch
      applyRiceToRows(sheet, startRow, rowCount);
      logDebug(' Applied PRICE to %s new rows', rowCount);
    }
    
    // Step 8: Ensure headers are present
    logDebug(' Step 8 - Ensuring headers...');
    writeHeaders(sheet);
    
    Logger.log('=== Sync Complete: %s updated, %s added, %s deleted ===', 
               toUpdate.length, toAdd.length, toDelete.length);
    
  } catch (error) {
    Logger.log('ERROR: Sync failed: %s', error.message);
    throw error;
  }
}

/**
 * Read the current state of the sheet
 * Returns map of {issueKey -> rowNumber}
 */
function readSheetState(sheet) {
  const state = {
    issueRows: {},  // {issueKey -> rowNumber}
    lastRow: sheet.getLastRow()
  };
  
  if (state.lastRow <= 1) {
    logDebug(' Sheet is empty (no data rows)');
    return state;
  }
  
  // Read the Key column (column A)
  const keyRange = sheet.getRange(2, 1, state.lastRow - 1, 1);
  const keys = keyRange.getValues();
  
  keys.forEach((row, index) => {
    const cellValue = row[0];
    if (cellValue) {
      // Extract issue key from hyperlink formula if needed
      let issueKey = cellValue;
      if (typeof cellValue === 'string' && cellValue.includes('HYPERLINK')) {
        const match = cellValue.match(/"([^"]+)"\s*\)$/);
        if (match) issueKey = match[1];
      }
      state.issueRows[issueKey] = index + 2; // +2 for header row and 0-indexing
    }
  });
  
  return state;
}

/**
 * Build a row of Jira data for an issue
 */
function buildJiraRowData(issue, rank) {
  return JIRA_FIELDS.map(fieldName => {
    if (fieldName === 'key') {
      // Return hyperlink formula for the key
      const url = `${JIRA_BASE_URL}/browse/${issue.key}`;
      return `=HYPERLINK("${url}","${issue.key}")`;
    } else if (fieldName === 'customfield_12311940') {
      // Replace LexoRank with position number
      return rank || '';
    } else {
      let value = issue.fields[fieldName];
      return extractSimpleValue(value);
    }
  });
}

/**
 * Apply PRICE columns (dropdowns, formula, defaults) to multiple rows at once (batched for performance)
 * PRICE = P * Reach * Impact * Confidence / Effort
 */
function applyRiceToRows(sheet, startRow, rowCount) {
  const priceStartColumn = JIRA_FIELDS.length + 1;
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Column positions: P, Reach, Impact, Confidence, Effort, R(Val), I(Val), C(Val), E(Val), Score
  const pColumn = priceStartColumn;
  const reachColumn = priceStartColumn + 1;
  const impactColumn = priceStartColumn + 2;
  const confidenceColumn = priceStartColumn + 3;
  const effortColumn = priceStartColumn + 4;
  const reachValColumn = priceStartColumn + 5;
  const impactValColumn = priceStartColumn + 6;
  const confidenceValColumn = priceStartColumn + 7;
  const effortValColumn = priceStartColumn + 8;
  const scoreColumn = priceStartColumn + 9;
  
  // Find Size column (look for 'Size' header in FIELD_CONFIG)
  const sizeColumnIndex = FIELD_CONFIG.findIndex(f => f.header === 'Size');
  const sizeColumn = sizeColumnIndex >= 0 ? sizeColumnIndex + 1 : null;
  
  // Read Size values if Size column exists
  let sizeValues = [];
  if (sizeColumn) {
    sizeValues = sheet.getRange(startRow, sizeColumn, rowCount, 1).getValues().map(row => row[0]);
    logDebug(' Read Size values for %s rows: %s', rowCount, sizeValues.filter(v => v).length + ' have values');
  }
  
  // Default values
  const defaults = {
    p: 1.0,
    reach: 'Handful',
    impact: 'Nice to have',
    confidence: 'Low',
    effort: 'M'
  };
  
  // Build default values array - use Size for Effort when available
  const defaultData = [];
  for (let i = 0; i < rowCount; i++) {
    const effortValue = (sizeValues[i] && sizeValues[i] !== '') ? sizeValues[i] : defaults.effort;
    defaultData.push([defaults.p, defaults.reach, defaults.impact, defaults.confidence, effortValue]);
  }
  
  // Set default values for all rows at once (P, Reach, Impact, Confidence, Effort)
  sheet.getRange(startRow, priceStartColumn, rowCount, 5).setValues(defaultData);
  
  // Format P column with 2 decimal places
  sheet.getRange(startRow, pColumn, rowCount).setNumberFormat('0.00');
  
  // Setup dropdown for Reach (all rows)
  const reachMapping = spreadsheet.getRangeByName('Reach_Mapping');
  const reachRange = reachMapping.offset(0, 0, reachMapping.getNumRows(), 1);
  const reachRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(reachRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, reachColumn, rowCount).setDataValidation(reachRule);
  
  // Setup dropdowns for Impact and Confidence (all rows)
  const impactMapping = spreadsheet.getRangeByName('Impact_Mapping');
  const impactRange = impactMapping.offset(0, 0, impactMapping.getNumRows(), 1);
  const impactRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(impactRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, impactColumn, rowCount).setDataValidation(impactRule);
  
  const confidenceMapping = spreadsheet.getRangeByName('Confidence_Mapping');
  const confidenceRange = confidenceMapping.offset(0, 0, confidenceMapping.getNumRows(), 1);
  const confidenceRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(confidenceRange)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, confidenceColumn, rowCount).setDataValidation(confidenceRule);
  
  // Setup Effort dropdown and formatting based on Size
  const effortMapping = spreadsheet.getRangeByName('Effort_Mapping');
  const effortRange = effortMapping.offset(0, 0, effortMapping.getNumRows(), 1);
  const effortRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(effortRange)
    .setAllowInvalid(false)
    .build();
  
  // Apply Effort formatting row by row based on Size
  for (let i = 0; i < rowCount; i++) {
    const row = startRow + i;
    const effortCell = sheet.getRange(row, effortColumn);
    
    if (sizeValues[i] && sizeValues[i] !== '') {
      // Size exists: gray background, no dropdown (read-only appearance)
      effortCell.setBackground('#d9d9d9');
      effortCell.setDataValidation(null);  // Remove dropdown
      logDebug(' Row %s: Effort set from Size (%s), grayed out', row, sizeValues[i]);
    } else {
      // No Size: yellow background, add dropdown
      effortCell.setBackground('#ffff00');
      effortCell.setDataValidation(effortRule);
    }
  }
  
  // Column letters for formulas
  const pCol = columnToLetter(pColumn);
  const reachCol = columnToLetter(reachColumn);
  const impactCol = columnToLetter(impactColumn);
  const confidenceCol = columnToLetter(confidenceColumn);
  const effortCol = columnToLetter(effortColumn);
  const reachValCol = columnToLetter(reachValColumn);
  const impactValCol = columnToLetter(impactValColumn);
  const confidenceValCol = columnToLetter(confidenceValColumn);
  const effortValCol = columnToLetter(effortValColumn);
  
  // Setup Value column formulas
  // Reach (Value) = XLOOKUP(Reach, mapping) * Reach_Weight * P
  const reachValFormula = `=XLOOKUP(${reachCol}${startRow},INDEX(Reach_Mapping,,1),INDEX(Reach_Mapping,,2))*Reach_Weight*${pCol}${startRow}`;
  sheet.getRange(startRow, reachValColumn, rowCount).setFormula(reachValFormula);
  
  // Impact (Value) = XLOOKUP(Impact, mapping) * Impact_Weight * P
  const impactValFormula = `=XLOOKUP(${impactCol}${startRow},INDEX(Impact_Mapping,,1),INDEX(Impact_Mapping,,2))*Impact_Weight*${pCol}${startRow}`;
  sheet.getRange(startRow, impactValColumn, rowCount).setFormula(impactValFormula);
  
  // Confidence (Value) = XLOOKUP(Confidence, mapping) * Confidence_Weight (no P multiplier)
  const confidenceValFormula = `=XLOOKUP(${confidenceCol}${startRow},INDEX(Confidence_Mapping,,1),INDEX(Confidence_Mapping,,2))*Confidence_Weight`;
  sheet.getRange(startRow, confidenceValColumn, rowCount).setFormula(confidenceValFormula);
  sheet.getRange(startRow, confidenceValColumn, rowCount).setNumberFormat('0%');
  
  // Effort (Value) = XLOOKUP(Effort, mapping) * Effort_Weight (no P multiplier)
  const effortValFormula = `=XLOOKUP(${effortCol}${startRow},INDEX(Effort_Mapping,,1),INDEX(Effort_Mapping,,2))*Effort_Weight`;
  sheet.getRange(startRow, effortValColumn, rowCount).setFormula(effortValFormula);
  
  // Format Value columns with light blue background
  sheet.getRange(startRow, reachValColumn, rowCount, 4).setBackground('#cfe2f3');
  
  // Setup PRICE Score formula: (R_val * I_val * C_val) / E_val
  // Note: P is already factored into R_val and I_val
  const scoreFormula = `=(${reachValCol}${startRow}*${impactValCol}${startRow}*${confidenceValCol}${startRow})/${effortValCol}${startRow}`;
  
  const scoreRange = sheet.getRange(startRow, scoreColumn, rowCount);
  scoreRange.setFormula(scoreFormula);
  scoreRange.setNumberFormat('0.00');
  
  // Setup Sync Status formula - compare sheet RICE values with Jira RICE values
  const syncStatusColumn = scoreColumn + 1;
  
  // Find Jira column positions by header name
  const jiraReachColNum = COLUMN_HEADERS.indexOf('Jira Reach') + 1;
  const jiraImpactColNum = COLUMN_HEADERS.indexOf('Jira Impact') + 1;
  const jiraConfidenceColNum = COLUMN_HEADERS.indexOf('Jira Confidence') + 1;
  const jiraEffortColNum = COLUMN_HEADERS.indexOf('Jira Effort') + 1;
  
  // Only add Sync Status if all Jira columns exist
  if (jiraReachColNum > 0 && jiraImpactColNum > 0 && jiraConfidenceColNum > 0 && jiraEffortColNum > 0) {
    const jiraReachCol = columnToLetter(jiraReachColNum);
    const jiraImpactCol = columnToLetter(jiraImpactColNum);
    const jiraConfidenceCol = columnToLetter(jiraConfidenceColNum);
    const jiraEffortCol = columnToLetter(jiraEffortColNum);
    
    // Sync Status formula: compare Value columns with Jira columns
    // Confidence: convert Value (numeric) to Jira string via XLOOKUP, then compare with Jira Confidence
    const syncStatusFormula = `=IF(AND(${reachValCol}${startRow}=${jiraReachCol}${startRow},${impactValCol}${startRow}=${jiraImpactCol}${startRow},XLOOKUP(${confidenceValCol}${startRow},INDEX(Confidence_Mapping,,2),INDEX(Confidence_Mapping,,3))=${jiraConfidenceCol}${startRow},${effortValCol}${startRow}=${jiraEffortCol}${startRow}),"✓","≠")`;
    
    const syncStatusRange = sheet.getRange(startRow, syncStatusColumn, rowCount);
    syncStatusRange.setFormula(syncStatusFormula);
    syncStatusRange.setHorizontalAlignment('center');
    
    // Add conditional formatting for Sync Status
    const syncRangeForRules = sheet.getRange(startRow, syncStatusColumn, rowCount);
    
    // Very light blue for in-sync (✓)
    const inSyncRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('✓')
      .setBackground('#e8f4fd')  // Very light blue
      .setRanges([syncRangeForRules])
      .build();
    
    // Very light red for out-of-sync (≠)
    const outOfSyncRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('≠')
      .setBackground('#fce8e8')  // Very light red
      .setRanges([syncRangeForRules])
      .build();
    
    // Get existing rules and add new ones
    const existingRules = sheet.getConditionalFormatRules();
    existingRules.push(inSyncRule);
    existingRules.push(outOfSyncRule);
    sheet.setConditionalFormatRules(existingRules);
    
    logDebug(' Added Sync Status formula with conditional formatting for rows %s-%s', startRow, startRow + rowCount - 1);
  } else {
    logDebug(' Skipping Sync Status - Jira RICE columns not found in FIELD_CONFIG');
  }
  
  logDebug(' Applied PRICE (defaults, dropdowns, formulas) to rows %s-%s', startRow, startRow + rowCount - 1);
}
  
  /**
   * Get the target sheet by name, create if it doesn't exist
   * @param {string} sheetName - Name of the target sheet
   */
  function getSheetByName(sheetName) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    Logger.log('Target sheet: %s', sheetName);
    
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    if (!sheet) {
      // Show confirmation before creating new sheet
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        'Create New Sheet?',
        `Sheet "${sheetName}" does not exist.\n\nDo you want to create it?`,
        ui.ButtonSet.OK_CANCEL
      );
      
      if (response !== ui.Button.OK) {
        throw new Error('Sheet creation cancelled by user');
      }
      
      sheet = spreadsheet.insertSheet(sheetName);
      Logger.log(`Created new sheet: ${sheetName}`);
      
      // Initialize the new sheet with proper formatting
      initializeNewSheet(sheet);
    }
    
    return sheet;
  }

  /**
   * Initialize a new sheet with proper formatting and setup
   */
  function initializeNewSheet(sheet) {
    try {
      Logger.log('Initializing new sheet with formatting...');
      
      // Set freeze panes: 1 row (headers) and 2 columns (Key + Summary)
      sheet.setFrozenRows(1);
      sheet.setFrozenColumns(2);
      Logger.log('Applied freeze: 1 row, 2 columns');
      
      // Set basic sheet properties
      sheet.getRange('A1').activate(); // Set active cell to A1
      Logger.log('Set active cell to A1');
      
      // Setup PRICE column headers only (dropdowns/formulas applied after data is written)
      Logger.log('Setting up PRICE headers for new sheet...');
      const priceStartColumn = JIRA_FIELDS.length + 1;
      const priceHeaders = ['PM', 'Reach', 'Impact', 'Confidence', 'Effort', 
                           'Reach (Value)', 'Impact (Value)', 'Confidence (Value)', 'Effort (Value)', 
                           '(P)RICE Score', 'Sync Status'];
      
      // Add PRICE headers
      sheet.getRange(1, priceStartColumn, 1, priceHeaders.length).setValues([priceHeaders]);
      Logger.log('Added PRICE headers: %s', priceHeaders.join(', '));
      
      // Format PRICE input headers (PM, Reach, Impact, Confidence, Effort) with yellow background
      sheet.getRange(1, priceStartColumn, 1, 5)
        .setFontWeight('bold')
        .setBackground('#ffff00');
      
      // Format Value headers with light blue background (read-only computed columns)
      sheet.getRange(1, priceStartColumn + 5, 1, 4)
        .setFontWeight('bold')
        .setBackground('#cfe2f3');
      
      // Format Score header with light magenta orange background
      sheet.getRange(1, priceStartColumn + 9, 1, 1)
        .setFontWeight('bold')
        .setBackground('#ffcc99');
      
      // Format Sync Status header with light gray background
      sheet.getRange(1, priceStartColumn + 10, 1, 1)
        .setFontWeight('bold')
        .setBackground('#eeeeee');
      
      // Note: PRICE dropdowns and formulas are applied after data is written
      // by applyRiceToRows() in syncJiraIssues()
      
      Logger.log('✅ Sheet initialization complete (PRICE formulas applied after data sync)');
      
    } catch (error) {
      Logger.log('❌ Sheet initialization failed: %s', error.message);
      // Don't throw - initialization failure shouldn't stop the sync
    }
  }
  
  /**
* Fetch issues from Jira ordered by Rank ASC
* Uses the current user's filter ID from User_Mapping
*/
function fetchJiraIssues() {
  const filterId = getUserFilterId();
  return fetchJiraIssuesWithFilter(filterId);
}

/**
* Fetch issues from Jira ordered by Rank ASC with specified filter
* @param {string} filterId - Jira filter ID to use
*/
function fetchJiraIssuesWithFilter(filterId) {
  const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${filterId} ORDER BY Rank ASC&maxResults=${MAX_RESULTS}&fields=${JIRA_FIELDS.join(',')}`;
  
  logDebug(' Fetching from Jira with filter ID: %s', filterId);
  
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': `Bearer ${JIRA_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Jira API error: ${response.getResponseCode()}`);
  }
  
  const data = JSON.parse(response.getContentText());
  Logger.log(`Fetched ${data.issues.length} issues from Jira (filter: ${filterId}, max: ${MAX_RESULTS})`);
  
  return data.issues;
}
  
  /**
   * Write column headers
   */
  function writeHeaders(sheet) {
    // Use the configured column headers from config.js
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setFontWeight('bold');
    // Note: Freeze panes are now handled in initializeNewSheet() for new sheets
  }
  
  /**
   * Simple value extraction for common Jira field types
   */
  function extractSimpleValue(value) {
    if (!value) return '';
    
    // Handle objects (status, user fields, option fields, etc.)
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value.displayName || value.name || value.value || value.emailAddress || '';
    }
    
    // Handle arrays (labels, components)
    if (Array.isArray(value)) {
      return value.map(item => item.name || item).join(', ');
    }
    
    return value.toString();
  }
  
/**
 * Convert column number to letter (1=A, 2=B, ..., 26=Z, 27=AA, etc.)
 */
function columnToLetter(column) {
  let result = '';
  while (column > 0) {
    column--;
    result = String.fromCharCode(65 + (column % 26)) + result;
    column = Math.floor(column / 26);
  }
  return result;
}

/**
 * Test Jira connection - run this first to verify setup
 * Uses the current user's filter ID from User_Mapping
 */
  function testConnection() {
    try {
      const filterId = getUserFilterId();
      const url = `${JIRA_BASE_URL}/rest/api/2/search?jql=filter=${filterId}&maxResults=1`;
      
      Logger.log('Testing connection with filter ID: %s', filterId);
      
      const response = UrlFetchApp.fetch(url, {
        headers: {
          'Authorization': `Bearer ${JIRA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.getResponseCode() === 200) {
        const data = JSON.parse(response.getContentText());
        Logger.log(`✅ Connection successful! Found ${data.total} issues in filter ${filterId} (configured limit: ${MAX_RESULTS})`);
        return true;
      } else {
        Logger.log(`❌ Connection failed: ${response.getResponseCode()}`);
        return false;
      }
    } catch (error) {
      Logger.log(`❌ Connection failed: ${error.message}`);
      return false;
    }
  }
  
  
  