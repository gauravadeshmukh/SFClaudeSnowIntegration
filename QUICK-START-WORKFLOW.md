# Enhanced Workflow - Quick Start Guide

## What It Does

Receives an error → Analyzes → Scans GitHub → Finds affected code → Applies fixes locally → **NO git commits**

---

## Quick Start

### 1. Start the Server

```bash
node api-server.js
```

### 2. Send an Error

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45"
  }'
```

### 3. Review the Results

The response shows:
- ✅ What was analyzed
- ✅ Files scanned from GitHub
- ✅ Components affected
- ✅ Root cause analysis
- ✅ Fixes applied to local files
- ⚠️ **NO git commits made**

### 4. Check Your Local Files

```bash
# See what changed
git diff

# Review the changes
cat path/to/fixed/file.cls
```

### 5. Test and Commit

```bash
# Run tests
npm test  # or your test command

# If tests pass, commit
git add .
git commit -m "Fix NullPointerException in AccountHandler"
git push
```

---

## Common Use Cases

### Case 1: Salesforce Error from ServiceNow Incident

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156",
    "localWorkspace": "/path/to/salesforce/project"
  }'
```

**What happens:**
1. Finds AccountDataProcessor.cls in GitHub
2. Scans for related triggers, tests
3. AI identifies SOQL-in-loop pattern
4. Generates bulkified code
5. Updates local AccountDataProcessor.cls
6. You review → test → commit

### Case 2: JavaScript Error from Logs

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "TypeError: Cannot read property name of undefined at getUserName (userService.js:23:15)",
    "repo": "https://github.com/myorg/node-app",
    "localWorkspace": "/Users/me/projects/node-app"
  }'
```

**What happens:**
1. Finds userService.js in GitHub
2. Scans for related services
3. AI identifies missing null check
4. Generates code with optional chaining
5. Updates local userService.js
6. You review → test → commit

### Case 3: Dry Run (No File Changes)

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException...",
    "applyFixes": false
  }'
```

**What happens:**
1-4. Same analysis and scanning
5. **Skips** writing to local files
6. Returns recommendations only

---

## Response Structure

```json
{
  "success": true,
  "workflow": {
    "steps": [
      { "step": 1, "name": "Error Analysis", "status": "completed" },
      { "step": 2, "name": "GitHub Repository Scan", "status": "completed" },
      { "step": 3, "name": "Affected Components", "status": "completed" },
      { "step": 4, "name": "Complete Analysis", "status": "completed" },
      { "step": 5, "name": "Apply Fixes", "status": "completed" }
    ]
  },
  "data": {
    "errorContext": {
      "type": "NullPointerException",
      "severity": "high",
      "file": "AccountHandler.cls",
      "line": 45
    },
    "repositoryScan": {
      "primaryFile": { "path": "...", "url": "..." },
      "relatedFiles": [...],
      "totalFiles": 4
    },
    "affectedComponents": {
      "direct": [ { "file": "...", "priority": "critical" } ],
      "indirect": [ ... ],
      "totalAffected": 2
    },
    "analysis": {
      "rootCause": "The NullPointerException occurs because...",
      "fixApproach": {
        "immediate": "Apply suggested fixes",
        "shortTerm": "Add test coverage",
        "longTerm": "Implement coding standards"
      },
      "recommendations": [ ... ],
      "bestPractices": [ ... ]
    },
    "appliedFixes": [
      {
        "file": "/path/to/AccountHandler.cls",
        "changes": [
          "Added null check",
          "Updated SOQL query"
        ],
        "explanation": "..."
      }
    ],
    "summary": {
      "filesScanned": 4,
      "componentsAffected": 2,
      "fixesApplied": 1,
      "manualRecommendations": 3
    }
  },
  "warnings": [
    "⚠️  Code changes have been applied to local workspace",
    "⚠️  NO git commits have been made",
    "⚠️  Review all changes carefully before committing",
    "⚠️  Run tests to verify fixes work correctly"
  ]
}
```

---

## Configuration

### Required Environment Variables

```bash
# For AI-powered analysis and fix generation
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# Optional: Specify Claude model
export CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Optional: Default repository
export DEFAULT_REPO=https://github.com/myorg/myrepo/tree/main
```

### Request Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `error` | **Yes** | - | Error message to analyze |
| `repo` | No | DEFAULT_REPO | GitHub repository URL |
| `localWorkspace` | No | Current dir | Where to write fixed files |
| `applyFixes` | No | true | Whether to apply fixes |

---

## What Gets Modified

### Files Written To

Only local workspace files are modified:
- ✅ Writes to: `/your/local/workspace/path/to/file.cls`
- ❌ Never touches: GitHub repository
- ❌ Never runs: `git add`, `git commit`, `git push`

### Example

**Input:**
```json
{
  "error": "...AccountHandler.processAccount: line 45...",
  "localWorkspace": "/Users/me/salesforce-app"
}
```

**File Modified:**
```
/Users/me/salesforce-app/force-app/main/default/classes/AccountHandler.cls
```

**Git Status:**
```bash
$ git status
modified:   force-app/main/default/classes/AccountHandler.cls

$ git diff AccountHandler.cls
- String email = primaryContact.Email;
+ if (acc.Primary_Contact__r != null) {
+   String email = acc.Primary_Contact__r.Email;
+ }
```

---

## Workflow Steps Explained

### Step 1: Error Analysis (Instant)
```
Input:  "System.NullPointerException: ... Class.AccountHandler.processAccount: line 45"
Output: { type: "NullPointerException", file: "AccountHandler.cls", line: 45 }
```

### Step 2: GitHub Scan (2-3 seconds)
```
Search GitHub for:
  ✓ AccountHandler.cls (primary file)
  ✓ AccountHandlerTest.cls (tests)
  ✓ AccountTrigger.trigger (may call it)
  ✓ AccountHandler.cls-meta.xml (metadata)
Download latest code from GitHub
```

### Step 3: Component Analysis (Instant)
```
Analyze impact:
  Direct:   AccountHandler.cls (has the error)
  Indirect: AccountTrigger.trigger (calls it)
  Tests:    AccountHandlerTest.cls (tests it)
```

### Step 4: AI Analysis (2-4 seconds)
```
Claude AI analyzes:
  - Root cause: "Primary_Contact__r not queried..."
  - Code insights: "SOQL missing relationship field..."
  - Recommendations: "Add to query, add null check..."
  - Best practices: "Always include relationship fields..."
```

### Step 5: Apply Fixes (Instant)
```
Generate fixed code:
  Before: String email = primaryContact.Email;
  After:  if (acc.Primary_Contact__r != null) {
            String email = acc.Primary_Contact__r.Email;
          }
Write to: /local/workspace/AccountHandler.cls
```

**Total time: 5-8 seconds**

---

## Error Handling

### If File Not Found in GitHub
```json
{
  "data": {
    "repositoryScan": {
      "primaryFile": null,
      "relatedFiles": [],
      "totalFiles": 0
    }
  }
}
```
→ Still provides analysis based on error message

### If Local Workspace Path Invalid
```json
{
  "data": {
    "appliedFixes": []
  }
}
```
→ Shows manual recommendations instead

### If AI Unavailable
```
Uses rule-based analysis:
  - Standard patterns for common errors
  - Generic recommendations
  - Manual fix suggestions
```

---

## Integration Examples

### Node.js

```javascript
const analyzeError = async (errorMessage) => {
  const res = await fetch('http://localhost:3000/api/workflow/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errorMessage })
  });

  const result = await res.json();

  console.log(`Scanned: ${result.data.summary.filesScanned} files`);
  console.log(`Fixed: ${result.data.summary.fixesApplied} files`);

  return result;
};
```

### Python

```python
import requests

def analyze_error(error_message):
    response = requests.post(
        'http://localhost:3000/api/workflow/process',
        json={'error': error_message}
    )

    result = response.json()
    print(f"Files scanned: {result['data']['summary']['filesScanned']}")
    print(f"Fixes applied: {result['data']['summary']['fixesApplied']}")

    return result
```

### Bash

```bash
analyze_error() {
  curl -s -X POST http://localhost:3000/api/workflow/process \
    -H "Content-Type: application/json" \
    -d "{\"error\": \"$1\"}" | jq .
}

# Usage
analyze_error "System.NullPointerException: ..."
```

---

## Cheat Sheet

### Start Server
```bash
node api-server.js
```

### Analyze Error (Basic)
```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{"error": "YOUR_ERROR_MESSAGE"}'
```

### Analyze Error (Custom Workspace)
```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "YOUR_ERROR_MESSAGE",
    "localWorkspace": "/path/to/your/project"
  }'
```

### Analyze Error (Custom Repo)
```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "YOUR_ERROR_MESSAGE",
    "repo": "https://github.com/yourorg/yourrepo"
  }'
```

### Dry Run (No Fixes)
```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "YOUR_ERROR_MESSAGE",
    "applyFixes": false
  }'
```

### Check Status
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ai/status
```

---

## Safety Checklist

Before using in production:

- ✅ Set `ANTHROPIC_API_KEY` for AI features
- ✅ Test with sample errors first
- ✅ Verify `localWorkspace` path is correct
- ✅ Always review changes with `git diff`
- ✅ Run tests before committing
- ✅ Keep backups of important files
- ✅ Understand that **NO git commits** are made

---

## Troubleshooting

**"File not found in repository"**
→ Check error message has correct file name

**"Failed to write file"**
→ Check localWorkspace path exists and is writable

**"AI analysis failed"**
→ Check ANTHROPIC_API_KEY is set correctly

**"GitHub API rate limit"**
→ Wait 1 hour or use authenticated GitHub token

---

## Next Steps

1. ✅ Start the server: `node api-server.js`
2. ✅ Try with a sample error
3. ✅ Review changes: `git diff`
4. ✅ Run tests
5. ✅ Commit when ready

**Full documentation:** `ENHANCED-WORKFLOW-GUIDE.md`

**API reference:** `AI-API-DOCUMENTATION.md`
