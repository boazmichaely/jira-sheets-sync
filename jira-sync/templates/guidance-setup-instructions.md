# Guidance Sheet Setup Instructions

## 📁 Import the Template

1. **Download** `guidance-sheet.csv` from this repository
2. **In your Google Sheet**, create a new sheet called "Guidance"
3. **Import the CSV**: File → Import → Upload → Select `guidance-sheet.csv`
4. **Choose**: "Replace current sheet" and click "Import data"

## 🏷️ Create Named Ranges

After importing, create these named ranges:

### **Impact Mapping**
1. Select range **A4:B7** (Impact options and values)
2. Data → Named ranges → Add a range
3. Name: **Impact_Mapping**

### **Confidence Mapping**
1. Select range **D4:E9** (Confidence options and values)
2. Data → Named ranges → Add a range  
3. Name: **Confidence_Mapping**

### **Effort Mapping**
1. Select range **G4:H8** (Effort options and values)
2. Data → Named ranges → Add a range
3. Name: **Effort_Mapping**

### **Dropdown Lists**
1. Select **A5:A7** → Name: **Impact_Options**
2. Select **D5:D9** → Name: **Confidence_Options**  
3. Select **G5:G8** → Name: **Effort_Options**

## 🔧 Setup Data Validation

Go back to your main "Jira RFEs" sheet:

### **Column N (Impact) - Dropdown**
1. Select column N (starting from N2)
2. Data → Data validation
3. Criteria: "List from a range"
4. Range: **Impact_Options**

### **Column O (Confidence) - Dropdown**
1. Select column O (starting from O2)
2. Data → Data validation
3. Criteria: "List from a range"
4. Range: **Confidence_Options**

### **Column P (Effort) - Dropdown**
1. Select column P (starting from P2)
2. Data → Data validation
3. Criteria: "List from a range"
4. Range: **Effort_Options**

## 📊 Add RICE Formula

In **Column Q** (Priority Score), add this formula starting from Q2:

```
=IF(AND(M2<>"",N2<>"",O2<>"",P2<>""),
  (M2 * VLOOKUP(N2,Impact_Mapping,2,FALSE) * VLOOKUP(O2,Confidence_Mapping,2,FALSE)) / VLOOKUP(P2,Effort_Mapping,2,FALSE),
  "")
```

## 🎯 Test the Setup

1. **Add test data** in a row:
   - Reach (M): 1000
   - Impact (N): High
   - Confidence (O): Medium  
   - Effort (P): S

2. **Expected result**: Priority Score should calculate automatically

## 🔧 Customize Effort Formula

To adjust the effort scaling:
1. **Go to Guidance sheet**
2. **Modify the formulas** in H6:H8 (S, M, L, XL values)
3. **Change the multiplier** from `(4+n)` to whatever you prefer

Your RICE framework is now ready to use!
