# Complete Application Flow - Error Analyzer

## ⚠️ Important Clarification

**NO AI API IS CURRENTLY USED!**

The application uses **rule-based pattern matching and static code analysis** - not Claude AI API, OpenAI API, or any other AI service.

All recommendations are generated using:
- Regular expressions for pattern matching
- Predefined error type categorization
- Static code analysis (parsing variables, method calls, patterns)
- Hardcoded recommendation templates based on error types

---

## 📊 Complete Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                               │
│                 (Postman / cURL / Browser)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API SERVER (api-server.js)               │
│                    Running on Port 3000                     │
│  Endpoints:                                                 │
│    - POST /api/analyze                                      │
│    - POST /api/incident/create                              │
│    - GET  /api/health                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              ERROR ANALYZER (error-analyzer.js)             │
│                                                             │
│  Step 1: Parse Error Message (REGEX PATTERNS)              │
│  Step 2: Find Target File in GitHub                        │
│  Step 3: Fetch File Content from GitHub API                │
│  Step 4: Extract Code Snippet                              │
│  Step 5: Pattern Matching Analysis (NO AI)                 │
│  Step 6: Return Recommendations                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│      SERVICENOW INTEGRATION (servicenow-integration.js)     │
│                                                             │
│  - Create Incident via ServiceNow REST API                 │
│  - Attach Analysis Report                                  │
│  - Update Work Notes                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Detailed Step-by-Step Flow

### **Step 1: User Sends Request**

**User Action:**
```bash
POST https://sfclaudesnowintegration.onrender.com/api/incident/create
```

**Request Body:**
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "developer@company.com"
}
```

**File:** `api-server.js:handleCreateIncident()`

---

### **Step 2: API Server Receives Request**

**Code Location:** `api-server.js` (lines 180-250)

```javascript
async handleCreateIncident(req, res) {
  // Parse request body
  const { error, errorMessage, caller, localOnly } = await this.parseBody(req);

  // Use error analyzer
  const analyzer = new ErrorAnalyzer(repoUrl);
  const analysisResults = await analyzer.analyze(errorText);

  // Create incident or save locally
  if (!localOnly && this.snowConfig) {
    const serviceNow = new ServiceNowIntegration(this.snowConfig);
    const result = await serviceNow.createIncidentWithAnalysis(...);
  }
}
```

**What Happens:**
1. ✅ Parse JSON request
2. ✅ Extract error message
3. ✅ Create ErrorAnalyzer instance
4. ✅ Call `analyzer.analyze()`

---

### **Step 3: Error Analyzer - Parse Error**

**File:** `error-analyzer.js:parseError()` (lines 99-196)

**Code:**
```javascript
parseError(errorMessage) {
  const errorInfo = {
    type: 'Unknown',
    message: errorMessage,
    fileName: null,
    lineNumber: null,
    className: null,
    language: null
  };

  // Regex patterns for different error types
  const patterns = {
    apex: /Class\.([^:]+):\s*line\s+(\d+)(?:,\s*column\s+(\d+))?/i,
    apexException: /([\w\.]+Exception):\s*(.+)/i,
    js: /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/g
  };

  // Match Apex error
  const apexMatch = errorMessage.match(patterns.apex);
  if (apexMatch) {
    errorInfo.language = 'apex';
    errorInfo.className = apexMatch[1];  // "AccountHandler"
    errorInfo.lineNumber = parseInt(apexMatch[2]);  // 45
    errorInfo.columnNumber = apexMatch[3] ? parseInt(apexMatch[3]) : null;  // 12
  }

  // Extract error type
  const apexExceptionMatch = errorMessage.match(patterns.apexException);
  if (apexExceptionMatch) {
    errorInfo.type = apexExceptionMatch[1].replace(/^System\./, '');  // "NullPointerException"
  }

  return errorInfo;
}
```

**What Happens:**
1. ✅ Uses **REGEX** to parse error message
2. ✅ Extracts: className, lineNumber, errorType
3. ✅ Returns structured error info

**⚠️ NO AI USED - Just pattern matching!**

---

### **Step 4: Find Target File in GitHub**

**File:** `error-analyzer.js:findRelevantFiles()` (lines 202-252)

**Code:**
```javascript
async findRelevantFiles(errorInfo, repoTree) {
  const relevantFiles = [];

  // Priority 1: Exact file name match
  if (errorInfo.fileName) {
    for (const item of repoTree.tree) {
      if (item.type !== 'blob') continue;
      const path = item.path;

      if (path.endsWith(errorInfo.fileName)) {
        relevantFiles.push({
          path,
          priority: 1,
          reason: 'Exact file match from error'
        });
      }
    }
  }

  // Priority 2: Class name match
  if (errorInfo.className && relevantFiles.length === 0) {
    for (const item of repoTree.tree) {
      const fileName = path.split('/').pop();
      const fileNameWithoutExt = fileName.split('.')[0];

      if (fileNameWithoutExt === errorInfo.className) {
        relevantFiles.push({
          path,
          priority: 2,
          reason: 'Exact class match from error'
        });
      }
    }
  }

  return relevantFiles.slice(0, 2);  // Max 2 files
}
```

**What Happens:**
1. ✅ Fetch GitHub repository tree
2. ✅ Search for "AccountHandler.cls"
3. ✅ Return path: `force-app/main/default/classes/AccountHandler.cls`

**⚠️ NO AI USED - Just file name matching!**

---

### **Step 5: Fetch File Content from GitHub**

**File:** `error-analyzer.js:fetchFileContent()` (lines 66-94)

**Code:**
```javascript
async fetchFileContent(filePath) {
  if (this.codebaseCache.has(filePath)) {
    return this.codebaseCache.get(filePath);
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'raw.githubusercontent.com',
      path: `/${this.repoOwner}/${this.repoName}/${this.branch}/${filePath}`,
      method: 'GET'
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        this.codebaseCache.set(filePath, data);  // Cache it
        resolve(data);
      });
    });
  });
}
```

**What Happens:**
1. ✅ Check cache first
2. ✅ Fetch from `raw.githubusercontent.com`
3. ✅ Cache file content
4. ✅ Return full file content

**API Call:** `https://raw.githubusercontent.com/gauravadeshmukh/agentforcedemo/master/force-app/main/default/classes/AccountHandler.cls`

---

### **Step 6: Extract Code Snippet**

**File:** `error-analyzer.js:analyzeCodeAndRecommend()` (lines 336-359)

**Code:**
```javascript
// Extract code snippet around the error line
if (errorInfo.lineNumber && fileContent) {
  const lines = fileContent.split('\n');
  const errorLine = errorInfo.lineNumber - 1;  // Line 45 → index 44
  const start = Math.max(0, errorLine - 5);    // Line 40
  const end = Math.min(lines.length, errorLine + 6);  // Line 51

  recommendations.codeSnippet = {
    startLine: start + 1,
    endLine: end,
    errorLine: errorInfo.lineNumber,
    code: lines.slice(start, end).map((line, idx) => ({
      lineNumber: start + idx + 1,
      content: line,
      isError: (start + idx + 1) === errorInfo.lineNumber
    }))
  };
}
```

**What Happens:**
1. ✅ Split file into lines
2. ✅ Extract lines 40-51 (5 before, 5 after line 45)
3. ✅ Mark line 45 as error line

**⚠️ NO AI USED - Just string manipulation!**

---

### **Step 7: Analyze Code Context (Pattern Matching)**

**File:** `error-analyzer.js:analyzeErrorLineContext()` (lines 258-319)

**Code:**
```javascript
analyzeErrorLineContext(errorLineContent, errorInfo) {
  const context = {
    hasNullCheck: false,
    variablesUsed: [],
    methodCalls: [],
    insights: []
  };

  const trimmedLine = errorLineContent.trim();

  // Detect variables (REGEX)
  const varMatches = trimmedLine.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g);
  if (varMatches) {
    context.variablesUsed = [...new Set(varMatches)].filter(v =>
      !['if', 'for', 'while', 'return'].includes(v)
    );
  }

  // Detect method calls (REGEX)
  const methodMatches = trimmedLine.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g);
  if (methodMatches) {
    context.methodCalls = methodMatches.map(m => m.replace(/\s*\($/, ''));
  }

  // Check for null checks (REGEX)
  context.hasNullCheck = /!=\s*null|!==\s*null/.test(trimmedLine);

  // Analyze for NullPointerException (PATTERN MATCHING)
  if (errorInfo.type === 'NullPointerException') {
    if (trimmedLine.includes('.') && !context.hasNullCheck) {
      const objectAccess = trimmedLine.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\./g);
      if (objectAccess) {
        context.insights.push(`Line accesses properties/methods on: ${objectAccess.map(s => s.replace('.', '')).join(', ')}`);
        context.insights.push('No null check detected before object access');
      }
    }
  }

  // Detect SOQL queries (STRING MATCHING)
  if (trimmedLine.includes('[SELECT') || trimmedLine.includes('Database.query')) {
    context.insights.push('SOQL query detected on this line');
  }

  // Detect loops (REGEX)
  if (/\bfor\s*\(/.test(trimmedLine) || /\bwhile\s*\(/.test(trimmedLine)) {
    context.insights.push('Loop detected');
  }

  return context;
}
```

**What Happens:**
1. ✅ Use REGEX to find variables: `["account", "contact", "email"]`
2. ✅ Use REGEX to find method calls: `["getContact"]`
3. ✅ Check if null check exists: `false`
4. ✅ Detect patterns: object access, SOQL, loops
5. ✅ Generate insights based on patterns

**⚠️ NO AI USED - Just regex and string matching!**

---

### **Step 8: Generate Recommendations (Hardcoded Templates)**

**File:** `error-analyzer.js:analyzeCodeAndRecommend()` (lines 361-428)

**Code:**
```javascript
// Analyze based on error type (HARDCODED SWITCH STATEMENT)
switch (errorInfo.type) {
  case 'NullPointerException':
    recommendations.possibleCauses.push(
      'Attempting to access a property or method on a null object',
      'Variable not properly initialized before use',
      'Query returned no results and null was not handled'
    );
    recommendations.suggestedFixes.push(
      'Add null checks before accessing object properties',
      'Initialize variables with default values',
      'Use defensive programming with null coalescing operators',
      'For Apex: Use isEmpty() or != null checks before accessing objects'
    );
    recommendations.bestPractices.push(
      'Always validate query results before using them',
      'Use optional chaining (JavaScript) or safe navigation operators',
      'Implement proper error handling with try-catch blocks'
    );
    break;

  case 'LimitException':
    recommendations.possibleCauses.push(
      'Too many SOQL queries in a single transaction',
      'Non-bulkified code in loops'
    );
    recommendations.suggestedFixes.push(
      'Move SOQL queries outside of loops',
      'Bulkify your code to handle multiple records'
    );
    break;

  case 'DmlException':
    // ... more hardcoded recommendations
    break;

  // etc.
}
```

**What Happens:**
1. ✅ Match error type: `NullPointerException`
2. ✅ Return **hardcoded** recommendations
3. ✅ No AI inference - just template-based responses

**⚠️ NO AI USED - Hardcoded recommendation templates!**

---

### **Step 9: Create ServiceNow Incident**

**File:** `servicenow-integration.js:createIncidentWithAnalysis()` (lines 358-420)

**Code:**
```javascript
async createIncidentWithAnalysis(errorMessage, analysisResults, additionalFields = {}) {
  // Step 1: Format incident data
  const incidentData = this.formatAnalysisForIncident(errorMessage, analysisResults);

  // Step 2: Create incident via ServiceNow REST API
  const incident = await this.createIncident({ ...incidentData, ...additionalFields });

  // Step 3: Generate report
  const reportContent = this.generateAnalysisReport(errorMessage, analysisResults);
  const fileName = `error_analysis_${incident.result.number}_${Date.now()}.txt`;

  // Step 4: Attach file to incident
  await this.attachFileToIncident(incident.result.sys_id, fileName, reportContent);

  // Step 5: Add work notes
  await this.updateIncident(incident.result.sys_id, {
    work_notes: `Error analysis completed. See attached file for details.`
  });

  return {
    incidentNumber: incident.result.number,
    incidentUrl: `https://${this.instanceUrl}/nav_to.do?uri=incident.do?sys_id=${incident.result.sys_id}`
  };
}
```

**What Happens:**
1. ✅ Create ServiceNow incident via REST API
2. ✅ Attach analysis report as text file
3. ✅ Add work notes
4. ✅ Return incident URL

**API Call:** `POST https://your-instance.service-now.com/api/now/table/incident`

---

### **Step 10: Return Response to User**

**Response:**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "incidentNumber": "INC0012345",
    "incidentUrl": "https://your-instance.service-now.com/...",
    "targetFile": "force-app/main/default/classes/AccountHandler.cls",
    "analysisResults": {
      "errorInfo": { "type": "NullPointerException", "lineNumber": 45 },
      "codeSnippet": { ... },
      "codeContext": {
        "insights": [
          "Line accesses properties on: account",
          "No null check detected before object access"
        ],
        "variablesUsed": ["account", "contact"]
      },
      "recommendations": {
        "possibleCauses": [...],  // From hardcoded template
        "suggestedFixes": [...],   // From hardcoded template
        "bestPractices": [...]     // From hardcoded template
      }
    }
  }
}
```

---

## 🔌 External APIs Used

### 1. **GitHub API** (Only for fetching code)
```
GET https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1
GET https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{file}
```

**Purpose:** Fetch repository structure and file content

---

### 2. **ServiceNow REST API** (Optional)
```
POST https://{instance}.service-now.com/api/now/table/incident
POST https://{instance}.service-now.com/api/now/attachment/upload
PATCH https://{instance}.service-now.com/api/now/table/incident/{sys_id}
```

**Purpose:** Create incidents, attach files, update work notes

---

## ❌ What is NOT Used

| Service | Used? | Why Not? |
|---------|-------|----------|
| Claude AI API | ❌ No | All analysis is rule-based |
| OpenAI API | ❌ No | No LLM integration |
| Any ML Model | ❌ No | Static pattern matching only |
| External AI Service | ❌ No | Hardcoded recommendation templates |

---

## 🧠 How "Analysis" Currently Works

### Current Method: **Rule-Based Pattern Matching**

```javascript
// Example of current "AI-less" analysis:

if (errorType === 'NullPointerException') {
  if (line.includes('.') && !line.includes('!= null')) {
    insights.push('No null check detected');
    fixes.push('Add null check: if (obj != null) { ... }');
  }
}

if (line.includes('[SELECT') && errorType === 'LimitException') {
  insights.push('SOQL query in loop');
  fixes.push('Move SOQL outside loop');
}
```

### Tools Used:
- ✅ **Regex** - Pattern matching
- ✅ **String operations** - `includes()`, `split()`, `match()`
- ✅ **Switch statements** - Error type categorization
- ✅ **Templates** - Hardcoded recommendations

---

## 💡 How to Add AI-Powered Analysis

If you want to add actual AI-powered code analysis, here's how:

### Option 1: Anthropic Claude API

```javascript
// Add this to error-analyzer.js

async analyzeWithClaude(errorInfo, codeSnippet) {
  const Anthropic = require('@anthropic-ai/sdk');
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Analyze this code error:

Error Type: ${errorInfo.type}
Error Line: ${errorInfo.lineNumber}
Code:
${codeSnippet}

Provide:
1. Root cause analysis
2. Specific fix for this code
3. Best practices`
    }]
  });

  return message.content[0].text;
}
```

### Option 2: OpenAI API

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async analyzeWithOpenAI(errorInfo, codeSnippet) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "user",
      content: `Analyze this error: ${errorInfo.type} at line ${errorInfo.lineNumber}\n\nCode:\n${codeSnippet}`
    }]
  });

  return completion.choices[0].message.content;
}
```

---

## 📊 Summary

### Current Flow (No AI):
```
User Request
  → Parse Error (Regex)
  → Find File (String Matching)
  → Fetch Code (GitHub API)
  → Extract Snippet (String Operations)
  → Pattern Matching (Regex + Switch)
  → Hardcoded Templates
  → Create Incident (ServiceNow API)
  → Return Response
```

### With AI (Potential Enhancement):
```
User Request
  → Parse Error (Regex)
  → Find File (String Matching)
  → Fetch Code (GitHub API)
  → Extract Snippet (String Operations)
  → AI Analysis (Claude/OpenAI API) ← NEW!
  → Dynamic Recommendations ← NEW!
  → Create Incident (ServiceNow API)
  → Return Response
```

---

## ✅ Conclusion

**Currently:** The application is a **rule-based code analyzer** using:
- Regular expressions
- Pattern matching
- Hardcoded recommendation templates
- No AI/ML models

**To add AI:** You would need to integrate Claude API or OpenAI API as shown above.

Would you like me to implement actual AI-powered analysis using Claude API?
