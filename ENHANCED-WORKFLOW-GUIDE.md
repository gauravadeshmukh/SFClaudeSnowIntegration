# Enhanced Error Analysis Workflow - Complete Guide

## Overview

The Enhanced Error Analysis Workflow implements a comprehensive 5-step process for analyzing errors, scanning the GitHub codebase, and automatically applying fixes **WITHOUT making git commits**. This allows you to review all changes before committing.

---

## Workflow Steps

### STEP 1: Analyze Error Message
- **Extracts** error type, language, severity, and category
- **Identifies** file name, class name, method name, and line number
- **Categorizes** error (runtime, governor-limit, null-reference, database, syntax)
- **Assesses** severity (critical, high, medium, low)

### STEP 2: Scan GitHub Repository
- **Fetches** latest code from GitHub repository
- **Locates** primary file where error occurred
- **Finds** related files (triggers, handlers, services, tests)
- **Retrieves** metadata files (Salesforce specific)

### STEP 3: Locate Affected Components
- **Identifies** directly affected components
- **Maps** indirect dependencies and related code
- **Finds** test files that need attention
- **Lists** configuration files that may be involved

### STEP 4: Complete Analysis with AI
- **Uses** Claude AI for intelligent root cause analysis
- **Provides** code context insights
- **Suggests** multiple fix approaches
- **Recommends** best practices and prevention strategies

### STEP 5: Apply Code Fixes
- **Generates** corrected code using AI
- **Writes** fixes directly to local workspace files
- **Does NOT** make any git commits
- **Provides** manual recommendations when automatic fixes aren't possible

---

## API Endpoint

### POST /api/workflow/process

Execute the complete enhanced error analysis workflow.

#### Request

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
    "repo": "https://github.com/owner/repo/tree/main",
    "localWorkspace": "/path/to/local/workspace"
  }'
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error` or `errorMessage` | string | **Yes** | The error message to analyze |
| `repo` or `repository` | string | No | GitHub repository URL (default: configured repo) |
| `localWorkspace` | string | No | Local workspace path where fixes will be applied (default: current directory) |
| `applyFixes` | boolean | No | Whether to apply automatic fixes (default: true) |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Enhanced error analysis workflow completed",
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
      "language": "apex",
      "severity": "high",
      "category": "null-reference",
      "file": "AccountHandler.cls",
      "class": "AccountHandler",
      "method": "processAccount",
      "line": 45
    },
    "repositoryScan": {
      "primaryFile": {
        "path": "force-app/main/default/classes/AccountHandler.cls",
        "url": "https://github.com/owner/repo/blob/main/force-app/main/default/classes/AccountHandler.cls"
      },
      "relatedFiles": [
        {
          "path": "force-app/main/default/classes/AccountHandlerTest.cls",
          "relationship": "test classes",
          "reason": "Test coverage"
        },
        {
          "path": "force-app/main/default/triggers/AccountTrigger.trigger",
          "relationship": "triggers",
          "reason": "May invoke this class"
        }
      ],
      "metadata": [
        "force-app/main/default/classes/AccountHandler.cls-meta.xml",
        "sfdx-project.json"
      ],
      "totalFiles": 4
    },
    "affectedComponents": {
      "direct": [
        {
          "file": "force-app/main/default/classes/AccountHandler.cls",
          "reason": "Error occurred in this file",
          "line": 45,
          "priority": "critical"
        }
      ],
      "indirect": [
        {
          "file": "force-app/main/default/triggers/AccountTrigger.trigger",
          "reason": "Trigger may invoke affected class",
          "priority": "high"
        }
      ],
      "tests": [
        {
          "file": "force-app/main/default/classes/AccountHandlerTest.cls",
          "reason": "Test coverage for affected code",
          "priority": "medium"
        }
      ],
      "config": [
        {
          "file": "force-app/main/default/classes/AccountHandler.cls-meta.xml",
          "reason": "Configuration/metadata for affected component",
          "priority": "low"
        }
      ],
      "totalAffected": 2
    },
    "analysis": {
      "rootCause": "The NullPointerException occurs because the Primary_Contact__r relationship field is null. The SOQL query on line 41 does not include this relationship field, so when the code attempts to access primaryContact.Email on line 45, it tries to dereference a null object.",
      "fixApproach": {
        "immediate": "Apply the suggested code fixes to resolve the error",
        "shortTerm": "Add test coverage to prevent regression",
        "longTerm": "Implement coding standards that require null checks for all relationship field accesses"
      },
      "recommendations": [
        "Add relationship field to SOQL query: Account acc = [SELECT Id, Name, Primary_Contact__r.Email FROM Account WHERE Id = :accountId];",
        "Add null safety check: if (acc.Primary_Contact__r != null) { String email = acc.Primary_Contact__r.Email; }",
        "Use defensive programming with try-catch blocks"
      ],
      "preventionStrategy": "Implement a coding standard that requires null checks for all relationship field accesses. Use static analysis tools like PMD to detect potential null pointer exceptions. Add unit tests that specifically test null scenarios.",
      "bestPractices": [
        "Always include relationship fields in SOQL queries when accessing them",
        "Implement null checks before dereferencing objects",
        "Use try-catch blocks for defensive programming",
        "Consider using @TestVisible methods for better testability"
      ]
    },
    "appliedFixes": [
      {
        "file": "/path/to/local/workspace/force-app/main/default/classes/AccountHandler.cls",
        "changes": [
          "Added Primary_Contact__r.Email to SOQL query SELECT clause",
          "Added null check for Primary_Contact__r before accessing Email",
          "Added null check for Email field itself",
          "Added else block to handle missing primary contact gracefully",
          "Added debug logging for troubleshooting"
        ],
        "explanation": "The fix addresses the NullPointerException by ensuring the relationship field is properly queried and adding defensive null checks. This prevents the error while maintaining code functionality."
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

## Usage Examples

### Example 1: Salesforce NullPointerException

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45",
    "repo": "https://github.com/myorg/salesforce-app",
    "localWorkspace": "/Users/me/projects/salesforce-app"
  }'
```

**What Happens:**
1. ✅ Analyzes error → NullPointerException in AccountHandler.cls line 45
2. ✅ Scans GitHub → Finds AccountHandler.cls, AccountHandlerTest.cls, AccountTrigger.trigger
3. ✅ Identifies impact → AccountTrigger.trigger may be affected
4. ✅ AI analysis → Root cause: Primary_Contact__r not queried
5. ✅ Applies fix → Updates local AccountHandler.cls with null checks

### Example 2: SOQL Governor Limit

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156",
    "repo": "https://github.com/myorg/salesforce-app"
  }'
```

**What Happens:**
1. ✅ Analyzes error → LimitException, critical severity, governor-limit category
2. ✅ Scans GitHub → Finds AccountDataProcessor.cls and related classes
3. ✅ Identifies impact → All classes with similar patterns
4. ✅ AI analysis → Root cause: SOQL inside loop
5. ✅ Applies fix → Bulkifies the code to remove SOQL from loop

### Example 3: JavaScript TypeError

```bash
curl -X POST http://localhost:3000/api/workflow/process \
  -H "Content-Type: application/json" \
  -d '{
    "error": "TypeError: Cannot read property name of undefined at getUserName (userService.js:23:15)",
    "repo": "https://github.com/myorg/node-app",
    "localWorkspace": "/Users/me/projects/node-app"
  }'
```

**What Happens:**
1. ✅ Analyzes error → TypeError in userService.js line 23
2. ✅ Scans GitHub → Finds userService.js and related services
3. ✅ Identifies impact → Other services with similar patterns
4. ✅ AI analysis → Root cause: accessing undefined.name
5. ✅ Applies fix → Adds optional chaining or null checks

---

## Local Workspace Configuration

The `localWorkspace` parameter tells the workflow where to write fixed code. This should be:

- **Absolute path** to your local repository clone
- **Must exist** and be writable
- **Should match** the GitHub repository structure

### Example Directory Structures

**Salesforce Project:**
```
/Users/me/projects/salesforce-app/
├── force-app/
│   └── main/
│       └── default/
│           ├── classes/
│           │   ├── AccountHandler.cls        ← Fixed here
│           │   └── AccountHandlerTest.cls
│           └── triggers/
│               └── AccountTrigger.trigger
├── sfdx-project.json
└── package.json
```

**Node.js Project:**
```
/Users/me/projects/node-app/
├── src/
│   ├── services/
│   │   ├── userService.js    ← Fixed here
│   │   └── accountService.js
│   └── index.js
└── package.json
```

---

## Important Notes

### ⚠️ NO GIT COMMITS

**The workflow NEVER makes git commits.** It only:
- ✅ Writes fixed code to local files
- ✅ Provides analysis and recommendations
- ✅ Shows what was changed

**You must:**
- ✅ Review all changes manually
- ✅ Run tests to verify fixes
- ✅ Commit changes yourself when ready

### 🔐 API Key Required

For AI-powered analysis and automatic fix generation:
- Set `ANTHROPIC_API_KEY` environment variable
- Without it, workflow provides rule-based analysis only
- AI features include:
  - Intelligent root cause analysis
  - Context-aware code generation
  - Best practices recommendations

### 📊 GitHub API Rate Limits

- GitHub API has rate limits (60 requests/hour unauthenticated)
- For higher limits, use GitHub token authentication
- The workflow makes 1-5 API calls per error:
  - 1 call to find primary file
  - 1-4 calls to search for related files

---

## Workflow Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│ POST /api/workflow/process                              │
│ { error: "...", repo: "...", localWorkspace: "..." }   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 1: Analyze Error Message                          │
│ • Extract error type, language, severity                │
│ • Identify file, class, method, line number            │
│ • Categorize error (runtime, limit, null, etc.)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: Scan GitHub Repository                         │
│ • Find primary file (AccountHandler.cls)                │
│ • Search for related files (triggers, tests, etc.)     │
│ • Fetch metadata files (cls-meta.xml, etc.)            │
│ • Retrieve latest code from GitHub                     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3: Locate Affected Components                     │
│ • Direct: Files with the error                         │
│ • Indirect: Dependencies and related code              │
│ • Tests: Test files needing attention                  │
│ • Config: Metadata and configuration files             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: Complete Analysis with AI                      │
│ • Extract code snippet around error line               │
│ • Send to Claude AI for intelligent analysis           │
│ • Get root cause, insights, and recommendations        │
│ • Fallback to rule-based if AI unavailable             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 5: Apply Code Fixes                               │
│ • Generate corrected code with AI                       │
│ • Write to local workspace file                        │
│ • Provide manual recommendations                       │
│ • DO NOT commit to git                                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Return Complete Analysis                                │
│ • Error context and severity                           │
│ • Repository scan results                              │
│ • Affected components                                  │
│ • AI analysis and recommendations                      │
│ • Applied fixes and warnings                           │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling

### Missing Error Field (400)
```json
{
  "success": false,
  "error": "Missing required field: error or errorMessage"
}
```

### Workflow Execution Failed (500)
```json
{
  "success": false,
  "error": "Workflow execution failed",
  "details": "Error message from workflow"
}
```

### File Write Failed
If automatic fixes cannot be written:
- Response includes `appliedFixes: []`
- Manual recommendations provided in `recommendations`
- Fixed code displayed in console for manual application

---

## Integration Example

### Node.js Client

```javascript
const analyzeAndFix = async (errorMessage) => {
  const response = await fetch('http://localhost:3000/api/workflow/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: errorMessage,
      repo: 'https://github.com/myorg/myrepo',
      localWorkspace: '/Users/me/projects/myrepo'
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log(`✓ Workflow completed`);
    console.log(`  Files scanned: ${result.data.summary.filesScanned}`);
    console.log(`  Fixes applied: ${result.data.summary.fixesApplied}`);
    console.log(`  Components affected: ${result.data.summary.componentsAffected}`);

    // Display applied fixes
    result.data.appliedFixes.forEach(fix => {
      console.log(`\nFixed: ${fix.file}`);
      console.log(`Explanation: ${fix.explanation}`);
      console.log('Changes:');
      fix.changes.forEach(change => console.log(`  - ${change}`));
    });

    // Display warnings
    console.log('\nWarnings:');
    result.warnings.forEach(w => console.log(w));
  }
};

// Usage
analyzeAndFix('System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45');
```

---

## Best Practices

1. **Always review changes** before committing
2. **Run tests** after automatic fixes are applied
3. **Check git diff** to see what was modified
4. **Verify AI recommendations** match your coding standards
5. **Use version control** to easily revert if needed

---

## Troubleshooting

### Issue: "File not found in repository"
**Cause:** File name extracted from error doesn't match GitHub
**Solution:** Ensure error message includes correct file name, or provide `filePath` parameter

### Issue: "Failed to write file"
**Cause:** Local workspace path incorrect or not writable
**Solution:** Verify `localWorkspace` path exists and has write permissions

### Issue: "No fixes applied"
**Cause:** AI couldn't generate automatic fix
**Solution:** Review manual recommendations in `analysis.recommendations`

### Issue: "GitHub API rate limit"
**Cause:** Too many requests to GitHub API
**Solution:** Wait 1 hour or use authenticated GitHub token

---

## Summary

The Enhanced Error Analysis Workflow provides:

✅ **5-Step Process** from error to fix
✅ **GitHub Integration** for latest code scanning
✅ **AI-Powered Analysis** with Claude
✅ **Automatic Fix Application** to local files
✅ **NO Git Commits** - you stay in control
✅ **Comprehensive Analysis** of affected components
✅ **Best Practices** and prevention strategies

**Next Steps:**
1. Set `ANTHROPIC_API_KEY` for AI features
2. Test with a sample error
3. Review applied fixes in your workspace
4. Run tests and commit when ready

For more information:
- **AI-API-DOCUMENTATION.md** - AI-specific endpoints
- **AI-INTEGRATION-GUIDE.md** - AI setup and configuration
- **APPLICATION-FLOW.md** - Technical architecture
