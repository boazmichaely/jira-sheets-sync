/**
 * RICE Framework Setup for Google Sheets
 * 
 * This module creates and configures the RICE prioritization framework:
 * - Creates/updates Guidance sheet with mappings and formulas
 * - Sets up RICE columns in main sheet with data validation
 * - Creates named ranges for formula readability
 * - Applies RICE formula to Priority Score column
 */

// RICE Configuration
const RICE_CONFIG = {
  guidanceSheetName: 'Guidance',
  mainSheetName: 'Jira RFEs',
  
  // Column positions for RICE data (M, N, O, P, Q)
  riceColumns: {
    reach: 13,      // M
    impact: 14,     // N  
    confidence: 15, // O
    effort: 16,     // P
    score: 17       // Q
  },
  
  // Mapping definitions - matching your layout
  impactMap: [
    ['Impact Option', 'Impact Value'],
    ['Nice to have', 1],
    ['Medium', 3], 
    ['High', 6],
    ['Must have', 10]
  ],
  
  confidenceMap: [
    ['Confidence Option', 'Confidence Value'],
    ['Very low', 0.1],
    ['Low', 0.25],
    ['Medium', 0.5],
    ['High', 0.8],
    ['Very high', 0.9],
    ['Certain', 1.0]
  ],
  
  effortMap: [
    ['Effort Option', 'Effort Value'],
    ['XS', 1],
    ['S', 5],
    ['M', 30], 
    ['L', 210],
    ['XL', 1680]
  ],
  
  // Weight definitions
  weights: [
    ['Convenience Weights'],
    ['Score', 100],
    ['Reach', 1],
    ['Impact', 1],
    ['Confidence', 1],
    ['Effort', 1]
  ]
};

/**
 * Main setup function - creates complete RICE framework
 */
function setupRiceFramework() {
  try {
    Logger.log('🚀 Starting RICE framework setup...');
    
    // Step 1: Create/update Guidance sheet
    const guidanceSheet = setupGuidanceSheet();
    Logger.log('✅ Guidance sheet created/updated');
    
    // Step 2: Create named ranges
    createNamedRanges(guidanceSheet);
    Logger.log('✅ Named ranges created');
    
    // Step 3: Setup RICE columns in main sheet
    setupRiceColumns();
    Logger.log('✅ RICE columns configured');
    
    Logger.log('🎉 RICE framework setup complete!');
    Logger.log('📋 You can now use the RICE prioritization system');
    
  } catch (error) {
    Logger.log(`❌ RICE setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Creates or updates the Guidance sheet with RICE mappings - matches user's layout
 */
function setupGuidanceSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get or create Guidance sheet
  let sheet = spreadsheet.getSheetByName(RICE_CONFIG.guidanceSheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(RICE_CONFIG.guidanceSheetName);
    Logger.log(`Created new sheet: ${RICE_CONFIG.guidanceSheetName}`);
  } else {
    sheet.clear(); // Clear existing content
    Logger.log(`Cleared existing sheet: ${RICE_CONFIG.guidanceSheetName}`);
  }
  
  // Add title
  sheet.getRange('C1').setValue('RICE Framework Guidance').setFontWeight('bold').setFontSize(14);
  
  // Add description
  const description = [
    'RICE is a scoring model to help prioritize features and initiatives based on four factors:',
    '',
    'Reach: How many customers will this touch? (Enter as a number)',
    'Impact: How much impact does this have for each customer? (Nice to have, Medium, High, Must have)',
    'Confidence: How confident are you in the Reach and Impact estimates? (0-100 %)',
    'Effort: How much work is required to build this? (XS/S/M/L/XL/XXL)',
    '',
    'Formula: Priority Score = (Reach × Impact × Confidence) / Effort',
    '',
    'Higher scores indicate higher priority items. Use this to make data-driven decisions about what to build next.',
    '',
    'The mappings below define how text values convert to numbers for the calculation.'
  ];
  
  sheet.getRange(2, 1, description.length, 1).setValues(description.map(text => [text]));
  
  // Set up side-by-side mappings starting at row 4
  let startRow = 4;
  
  // Impact Mapping (Column A-B)
  sheet.getRange(startRow, 1).setValue('Impact Mapping').setFontWeight('bold').setBackground('#f4cccc');
  sheet.getRange(startRow + 1, 1, RICE_CONFIG.impactMap.length, 2).setValues(RICE_CONFIG.impactMap);
  sheet.getRange(startRow + 1, 1, 1, 2).setFontWeight('bold'); // Header row
  
  // Confidence Mapping (Column D-E)  
  sheet.getRange(startRow, 4).setValue('Confidence Mapping').setFontWeight('bold').setBackground('#f4cccc');
  sheet.getRange(startRow + 1, 4, RICE_CONFIG.confidenceMap.length, 2).setValues(RICE_CONFIG.confidenceMap);
  sheet.getRange(startRow + 1, 4, 1, 2).setFontWeight('bold'); // Header row
  
  // Effort Mapping (Column G-H)
  sheet.getRange(startRow, 7).setValue('Effort Mapping').setFontWeight('bold').setBackground('#f4cccc');
  sheet.getRange(startRow, 8).setValue('(this particular formula favors smaller efforts)');
  sheet.getRange(startRow + 1, 7, RICE_CONFIG.effortMap.length, 2).setValues(RICE_CONFIG.effortMap);
  sheet.getRange(startRow + 1, 7, 1, 2).setFontWeight('bold'); // Header row
  
  // Add Convenience Weights section
  let weightsRow = startRow + Math.max(RICE_CONFIG.impactMap.length, RICE_CONFIG.confidenceMap.length, RICE_CONFIG.effortMap.length) + 3;
  sheet.getRange(weightsRow, 1).setValue('Convenience Weights').setFontWeight('bold');
  sheet.getRange(weightsRow + 1, 1, RICE_CONFIG.weights.length - 1, 2).setValues(RICE_CONFIG.weights.slice(1));
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 8);
  
  return sheet;
}

/**
 * Creates named ranges for RICE mappings - matches user's naming convention
 */
function createNamedRanges(guidanceSheet) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Calculate ranges based on new side-by-side layout
  const mappingStartRow = 5; // Data starts at row 5 (after headers at row 4)
  const weightsStartRow = mappingStartRow + Math.max(RICE_CONFIG.impactMap.length, RICE_CONFIG.confidenceMap.length, RICE_CONFIG.effortMap.length) + 4;
  
  // Create named ranges matching user's naming convention
  const ranges = [
    // Impact mapping (columns A-B)
    {
      name: 'Impact_Mapping',
      range: `${RICE_CONFIG.guidanceSheetName}!A${mappingStartRow}:B${mappingStartRow + RICE_CONFIG.impactMap.length - 1}`
    },
    // Confidence mapping (columns D-E)
    {
      name: 'Confidence_Mapping',
      range: `${RICE_CONFIG.guidanceSheetName}!D${mappingStartRow}:E${mappingStartRow + RICE_CONFIG.confidenceMap.length - 1}`
    },
    // Effort mapping (columns G-H)
    {
      name: 'Effort_Mapping',
      range: `${RICE_CONFIG.guidanceSheetName}!G${mappingStartRow}:H${mappingStartRow + RICE_CONFIG.effortMap.length - 1}`
    },
    // Weight ranges
    {
      name: 'Score_Weight',
      range: `${RICE_CONFIG.guidanceSheetName}!B${weightsStartRow}`
    },
    {
      name: 'Reach_Weight',
      range: `${RICE_CONFIG.guidanceSheetName}!B${weightsStartRow + 1}`
    },
    {
      name: 'Impact_Weight',
      range: `${RICE_CONFIG.guidanceSheetName}!B${weightsStartRow + 2}`
    },
    {
      name: 'Confidence_Weight',
      range: `${RICE_CONFIG.guidanceSheetName}!B${weightsStartRow + 3}`
    },
    {
      name: 'Effort_Weight',
      range: `${RICE_CONFIG.guidanceSheetName}!B${weightsStartRow + 4}`
    }
  ];
  
  // Remove existing named ranges and create new ones
  ranges.forEach(rangeConfig => {
    try {
      // Try to delete existing range
      const existingRange = spreadsheet.getRangeByName(rangeConfig.name);
      if (existingRange) {
        spreadsheet.removeNamedRange(rangeConfig.name);
      }
    } catch (e) {
      // Range doesn't exist, that's fine
    }
    
    // Create new named range
    spreadsheet.setNamedRange(rangeConfig.name, rangeConfig.range);
    Logger.log(`Created named range: ${rangeConfig.name} = ${rangeConfig.range}`);
  });
}

/**
 * Sets up RICE columns in the main sheet with data validation and formulas
 */
function setupRiceColumns() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(RICE_CONFIG.mainSheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${RICE_CONFIG.mainSheetName}" not found. Run syncJiraIssues() first.`);
  }
  
  const lastRow = Math.max(sheet.getLastRow(), 2); // At least row 2
  
  // Add RICE headers
  const headers = ['Reach', 'Impact', 'Confidence', 'Effort', 'Priority Score'];
  sheet.getRange(1, RICE_CONFIG.riceColumns.reach, 1, headers.length).setValues([headers]);
  sheet.getRange(1, RICE_CONFIG.riceColumns.reach, 1, headers.length).setFontWeight('bold');
  
  // Set up data validation for dropdowns
  if (lastRow > 1) {
    // Impact dropdown - use first column of Impact_Mapping
    const impactRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Nice to have', 'Medium', 'High', 'Must have'])
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, RICE_CONFIG.riceColumns.impact, lastRow - 1, 1).setDataValidation(impactRule);
    
    // Confidence dropdown  
    const confidenceRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Very low', 'Low', 'Medium', 'High', 'Very high', 'Certain'])
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, RICE_CONFIG.riceColumns.confidence, lastRow - 1, 1).setDataValidation(confidenceRule);
    
    // Effort dropdown
    const effortRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['XS', 'S', 'M', 'L', 'XL'])
      .setAllowInvalid(false)
      .build();
    sheet.getRange(2, RICE_CONFIG.riceColumns.effort, lastRow - 1, 1).setDataValidation(effortRule);
    
    // Add RICE formula matching user's exact structure
    const riceFormula = `=IF(AND(M2<>"", N2<>"", O2<>"", P2<>""), 
      Score_Weight * ((M2 * Reach_Weight) * (Impact_Weight * VLOOKUP(N2, Impact_Mapping, 2, FALSE)) * (Confidence_Weight * VLOOKUP(O2, Confidence_Mapping, 2, FALSE))) / (Effort_Weight * VLOOKUP(P2, Effort_Mapping, 2, FALSE)), 
      0)`;
    
    // Apply formula to all rows
    sheet.getRange(2, RICE_CONFIG.riceColumns.score).setFormula(riceFormula);
    
    // Copy formula down if there are multiple rows
    if (lastRow > 2) {
      sheet.getRange(2, RICE_CONFIG.riceColumns.score).copyTo(
        sheet.getRange(2, RICE_CONFIG.riceColumns.score, lastRow - 1, 1)
      );
    }
  }
  
  Logger.log(`RICE columns configured for ${lastRow - 1} data rows`);
}

/**
 * Test function to verify RICE setup in a clean sheet
 */
function testRiceSetup() {
  Logger.log('🧪 Testing RICE setup...');
  
  try {
    // Create test data in main sheet if it doesn't exist
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let mainSheet = spreadsheet.getSheetByName(RICE_CONFIG.mainSheetName);
    
    if (!mainSheet) {
      mainSheet = spreadsheet.insertSheet(RICE_CONFIG.mainSheetName);
      // Add some test headers and data
      const testData = [
        ['Key', 'Summary', 'Status', 'Priority'], // Basic headers
        ['TEST-1', 'Test Feature 1', 'Open', 'High'],
        ['TEST-2', 'Test Feature 2', 'Open', 'Medium']
      ];
      mainSheet.getRange(1, 1, testData.length, testData[0].length).setValues(testData);
    }
    
    // Run the setup
    setupRiceFramework();
    
    Logger.log('✅ Test completed successfully!');
    
  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
    throw error;
  }
}
