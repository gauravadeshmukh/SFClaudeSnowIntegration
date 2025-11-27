# AI-Powered REST API Endpoints - Complete Guide

## Overview

The Error Analyzer provides dedicated REST API endpoints to consume Claude AI analyzer capabilities directly. These endpoints offer pure AI-powered analysis without rule-based fallbacks.

---

## Prerequisites

**Required:**
- `ANTHROPIC_API_KEY` environment variable must be set
- Valid Claude API key from https://console.anthropic.com/

**Optional:**
- `CLAUDE_MODEL` - Default: `claude-3-5-sonnet-20241022`
- `CLAUDE_MAX_TOKENS` - Default: `2048`

---

## AI-Specific Endpoints

### 1. POST /api/ai/analyze

**Pure AI-powered error analysis without rule-based fallback**

#### Request

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45",
    "repo": "https://github.com/owner/repo",
    "filePath": "force-app/main/default/classes/AccountHandler.cls",
    "codeSnippet": {
      "errorLine": 45,
      "startLine": 40,
      "endLine": 50,
      "code": [
        { "lineNumber": 40, "content": "public void processAccount(Id accountId) {" },
        { "lineNumber": 41, "content": "  Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId];" },
        { "lineNumber": 42, "content": "  Contact primaryContact = acc.Primary_Contact__r;" },
        { "lineNumber": 45, "content": "  String email = primaryContact.Email;", "isError": true },
        { "lineNumber": 48, "content": "  sendEmail(email);" },
        { "lineNumber": 50, "content": "}" }
      ]
    }
  }'
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error` or `errorMessage` | string | **Yes** | The error message to analyze |
| `repo` or `repository` | string | No | GitHub repository URL (default: configured repo) |
| `filePath` | string | No | Path to the file where error occurred |
| `codeSnippet` | object | No | Code context around the error |

**Code Snippet Structure:**
```json
{
  "errorLine": 45,
  "startLine": 40,
  "endLine": 50,
  "code": [
    {
      "lineNumber": 40,
      "content": "code line text",
      "isError": false
    },
    {
      "lineNumber": 45,
      "content": "error line text",
      "isError": true
    }
  ]
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "AI-powered analysis completed",
  "aiPowered": true,
  "aiModel": "claude-3-5-sonnet-20241022",
  "data": {
    "aiPowered": true,
    "model": "claude-3-5-sonnet-20241022",
    "rootCauseAnalysis": "The NullPointerException occurs because the Primary_Contact__r relationship field is null. When attempting to access the Email field on line 45, the code tries to dereference a null Contact object...",
    "codeContextInsights": [
      "The SOQL query on line 41 does not include the Primary_Contact__r relationship",
      "No null check exists before accessing primaryContact.Email",
      "The relationship field is queried but not properly retrieved"
    ],
    "possibleCauses": [
      "Primary_Contact__r relationship not included in SOQL query",
      "Account record has no primary contact assigned",
      "Insufficient field-level security on Primary_Contact__c field"
    ],
    "suggestedFixes": [
      "Add relationship to SOQL query:\n\n```apex\nAccount acc = [SELECT Id, Name, Primary_Contact__r.Email \n               FROM Account \n               WHERE Id = :accountId];\nif (acc.Primary_Contact__r != null) {\n    String email = acc.Primary_Contact__r.Email;\n    sendEmail(email);\n}\n```",
      "Add null safety check before accessing email",
      "Use safe navigation operator or optional chaining if available"
    ],
    "bestPractices": [
      "Always include relationship fields in SOQL queries when accessing them",
      "Implement null checks before dereferencing objects",
      "Use try-catch blocks for defensive programming",
      "Consider using @TestVisible methods for better testability"
    ],
    "relatedComponents": [
      "AccountTrigger.trigger - May call this method",
      "AccountService.cls - Could have similar patterns",
      "ContactService.cls - Related to contact processing"
    ],
    "preventionStrategy": "Implement a coding standard that requires null checks for all relationship field accesses. Use static analysis tools like PMD to detect potential null pointer exceptions. Add unit tests that specifically test null scenarios.",
    "confidence": "high",
    "analysisTimestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

#### Response (Error - 503)

```json
{
  "success": false,
  "error": "AI analysis not available",
  "details": "ANTHROPIC_API_KEY not configured"
}
```

#### Response (Error - 400)

```json
{
  "success": false,
  "error": "Missing required field: error or errorMessage"
}
```

---

### 2. POST /api/ai/fix

**Generate fix code using AI**

#### Request

```bash
curl -X POST http://localhost:3000/api/ai/fix \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45",
    "filePath": "force-app/main/default/classes/AccountHandler.cls",
    "codeSnippet": {
      "errorLine": 45,
      "code": [
        { "lineNumber": 40, "content": "public void processAccount(Id accountId) {" },
        { "lineNumber": 41, "content": "  Account acc = [SELECT Id, Name FROM Account WHERE Id = :accountId];" },
        { "lineNumber": 42, "content": "  Contact primaryContact = acc.Primary_Contact__r;" },
        { "lineNumber": 45, "content": "  String email = primaryContact.Email;", "isError": true },
        { "lineNumber": 48, "content": "  sendEmail(email);" },
        { "lineNumber": 50, "content": "}" }
      ]
    }
  }'
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error` or `errorMessage` | string | **Yes** | The error message |
| `codeSnippet` | object | **Yes** | Code context (same structure as /api/ai/analyze) |
| `filePath` | string | No | Path to the file |

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "AI-powered fix generated",
  "aiPowered": true,
  "aiModel": "claude-3-5-sonnet-20241022",
  "data": {
    "fixedCode": "public void processAccount(Id accountId) {\n  // Fix: Include relationship field in SOQL query\n  Account acc = [SELECT Id, Name, Primary_Contact__r.Email \n                 FROM Account \n                 WHERE Id = :accountId];\n  \n  // Fix: Add null check before accessing email\n  if (acc.Primary_Contact__r != null && acc.Primary_Contact__r.Email != null) {\n    String email = acc.Primary_Contact__r.Email;\n    sendEmail(email);\n  } else {\n    // Handle case where primary contact doesn't exist\n    System.debug('No primary contact found for account: ' + acc.Name);\n  }\n}",
    "changes": [
      "Added Primary_Contact__r.Email to SOQL query SELECT clause",
      "Added null check for Primary_Contact__r before accessing Email",
      "Added null check for Email field itself",
      "Added else block to handle missing primary contact gracefully",
      "Added debug logging for troubleshooting"
    ],
    "explanation": "The fix addresses the NullPointerException by ensuring the relationship field is properly queried and adding defensive null checks. This prevents the error while maintaining code functionality."
  }
}
```

---

### 3. POST /api/ai/components

**Analyze how an error affects related components**

#### Request

```bash
curl -X POST http://localhost:3000/api/ai/components \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156",
    "repo": "https://github.com/owner/repo",
    "components": [
      {
        "path": "force-app/main/default/triggers/AccountTrigger.trigger",
        "reason": "Calls AccountDataProcessor"
      },
      {
        "path": "force-app/main/default/classes/AccountService.cls",
        "reason": "Uses similar SOQL patterns"
      },
      {
        "path": "force-app/main/default/classes/BatchAccountProcessor.cls",
        "reason": "Batch processor for accounts"
      }
    ]
  }'
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `error` or `errorMessage` | string | **Yes** | The error message |
| `components` | array | **Yes** | List of related components to analyze |
| `repo` or `repository` | string | No | GitHub repository URL |

**Component Structure:**
```json
{
  "path": "path/to/file.cls",
  "reason": "Why this component is related"
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "message": "Analyzed 3 related components",
  "aiPowered": true,
  "aiModel": "claude-3-5-sonnet-20241022",
  "data": {
    "componentCount": 3,
    "analysis": [
      {
        "component": "force-app/main/default/triggers/AccountTrigger.trigger",
        "impactLevel": "high",
        "affectedAreas": [
          "Trigger calls AccountDataProcessor which has the SOQL limit issue",
          "May cause trigger to fail on bulk operations",
          "Could affect all Account insert/update operations"
        ],
        "recommendedActions": [
          "Review trigger handler pattern to ensure bulkification",
          "Add governor limit monitoring in trigger",
          "Consider moving processing to async context (@future or Queueable)",
          "Test with 200+ records to verify bulk safety"
        ]
      },
      {
        "component": "force-app/main/default/classes/AccountService.cls",
        "impactLevel": "medium",
        "affectedAreas": [
          "Likely contains similar SOQL-in-loop patterns",
          "May hit same limits under bulk operations",
          "Shared code patterns with AccountDataProcessor"
        ],
        "recommendedActions": [
          "Audit all methods for SOQL queries in loops",
          "Refactor to use collection-based queries",
          "Add unit tests with bulk data (200+ records)",
          "Consider extracting common query logic to utility class"
        ]
      },
      {
        "component": "force-app/main/default/classes/BatchAccountProcessor.cls",
        "impactLevel": "low",
        "affectedAreas": [
          "Batch context has higher governor limits",
          "May still need bulkification improvements",
          "Could benefit from query optimization"
        ],
        "recommendedActions": [
          "Verify batch size is appropriate (recommended: 200)",
          "Ensure execute method is bulkified",
          "Monitor SOQL query count per batch",
          "Consider using Database.QueryLocator for large datasets"
        ]
      }
    ]
  }
}
```

---

### 4. GET /api/ai/status

**Check AI analyzer status and capabilities**

#### Request

```bash
curl http://localhost:3000/api/ai/status
```

#### Response (Success - 200)

```json
{
  "success": true,
  "ai": {
    "enabled": true,
    "provider": "Anthropic Claude",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 2048,
    "apiKeyConfigured": true,
    "useAI": true
  },
  "capabilities": [
    "Error analysis with root cause identification",
    "Code context insights",
    "Fix code generation",
    "Related component analysis",
    "Prevention strategy recommendations",
    "Best practices suggestions"
  ],
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/ai/analyze",
      "description": "AI-only error analysis",
      "requiresAI": true
    },
    {
      "method": "POST",
      "path": "/api/ai/fix",
      "description": "Generate fix code",
      "requiresAI": true
    },
    {
      "method": "POST",
      "path": "/api/ai/components",
      "description": "Analyze related components",
      "requiresAI": true
    },
    {
      "method": "GET",
      "path": "/api/ai/status",
      "description": "AI status and capabilities",
      "requiresAI": false
    }
  ],
  "pricing": {
    "model": "claude-3-5-sonnet-20241022",
    "estimatedCostPerAnalysis": "$0.01 - $0.02",
    "inputTokenCost": "$3.00 / million tokens",
    "outputTokenCost": "$15.00 / million tokens"
  },
  "documentation": "See AI-INTEGRATION-GUIDE.md for setup and usage"
}
```

#### Response (AI Disabled)

```json
{
  "success": true,
  "ai": {
    "enabled": false,
    "provider": "Anthropic Claude",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 2048,
    "apiKeyConfigured": false,
    "useAI": false
  },
  "capabilities": [],
  "endpoints": [
    {
      "method": "POST",
      "path": "/api/ai/analyze",
      "description": "AI-only error analysis",
      "requiresAI": true
    },
    {
      "method": "POST",
      "path": "/api/ai/fix",
      "description": "Generate fix code",
      "requiresAI": true
    },
    {
      "method": "POST",
      "path": "/api/ai/components",
      "description": "Analyze related components",
      "requiresAI": true
    },
    {
      "method": "GET",
      "path": "/api/ai/status",
      "description": "AI status and capabilities",
      "requiresAI": false
    }
  ],
  "pricing": {
    "model": "claude-3-5-sonnet-20241022",
    "estimatedCostPerAnalysis": "$0.01 - $0.02",
    "inputTokenCost": "$3.00 / million tokens",
    "outputTokenCost": "$15.00 / million tokens"
  },
  "documentation": "See AI-INTEGRATION-GUIDE.md for setup and usage"
}
```

---

## Error Responses

### 400 Bad Request

**Missing required fields:**
```json
{
  "success": false,
  "error": "Missing required field: error or errorMessage"
}
```

**Invalid repository URL:**
```json
{
  "success": false,
  "error": "Invalid repository URL"
}
```

**Missing components array:**
```json
{
  "success": false,
  "error": "Missing required field: components (array)"
}
```

### 500 Internal Server Error

**AI analysis failed:**
```json
{
  "success": false,
  "error": "AI analysis failed",
  "details": "Detailed error message from Claude API"
}
```

### 503 Service Unavailable

**AI not configured:**
```json
{
  "success": false,
  "error": "AI analysis not available",
  "details": "ANTHROPIC_API_KEY not configured"
}
```

---

## Complete Examples

### Example 1: Analyze Salesforce Apex Error

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1"
  }'
```

The AI will:
1. Parse the error type (LimitException)
2. Identify the class and method (AccountDataProcessor.processRecords)
3. Recognize it's an Apex/Salesforce error
4. Provide bulkification-specific analysis
5. Suggest SOQL query optimization

### Example 2: Generate Fix for JavaScript TypeError

```bash
curl -X POST http://localhost:3000/api/ai/fix \
  -H "Content-Type: application/json" \
  -d '{
    "error": "TypeError: Cannot read property name of undefined",
    "filePath": "src/services/userService.js",
    "codeSnippet": {
      "errorLine": 23,
      "code": [
        { "lineNumber": 20, "content": "function getUserName(user) {" },
        { "lineNumber": 21, "content": "  const profile = user.profile;" },
        { "lineNumber": 23, "content": "  return profile.name;", "isError": true },
        { "lineNumber": 24, "content": "}" }
      ]
    }
  }'
```

The AI will:
1. Identify the null/undefined access issue
2. Generate defensive code with null checks
3. Suggest optional chaining or safe navigation
4. Provide TypeScript recommendations

### Example 3: Analyze Related Components

```bash
curl -X POST http://localhost:3000/api/ai/components \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.DmlException: Update failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]",
    "components": [
      { "path": "AccountTrigger.trigger", "reason": "Trigger that updates accounts" },
      { "path": "AccountService.cls", "reason": "Service class for account operations" },
      { "path": "AccountValidator.cls", "reason": "Validation logic for accounts" }
    ]
  }'
```

The AI will:
1. Understand the required field validation error
2. Assess each component's involvement
3. Suggest validation improvements for each
4. Prioritize by impact level

---

## Integration Patterns

### Pattern 1: Pre-Analysis Check

```javascript
// Check if AI is available before making requests
const statusResponse = await fetch('http://localhost:3000/api/ai/status');
const status = await statusResponse.json();

if (status.ai.enabled) {
  // Use AI endpoints
  const analysisResponse = await fetch('http://localhost:3000/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errorMessage })
  });
  const analysis = await analysisResponse.json();
} else {
  // Fall back to regular /api/analyze endpoint
  const analysisResponse = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: errorMessage })
  });
}
```

### Pattern 2: Progressive Enhancement

```javascript
// Start with basic analysis
const basicAnalysis = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: errorMessage })
});

const basicResults = await basicAnalysis.json();

// If AI is enabled and error is complex, get AI fix suggestion
if (basicResults.aiPowered && basicResults.data.errorInfo.type === 'LimitException') {
  const fixResponse = await fetch('http://localhost:3000/api/ai/fix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: errorMessage,
      codeSnippet: basicResults.data.analysisResults[0].codeSnippet
    })
  });

  const fixSuggestion = await fixResponse.json();
  // Display fix code to user
}
```

### Pattern 3: Batch Component Analysis

```javascript
// Analyze error first
const analysisResponse = await fetch('http://localhost:3000/api/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ error: errorMessage })
});

const analysis = await analysisResponse.json();

// If AI identified related components, analyze them
if (analysis.data.relatedComponents && analysis.data.relatedComponents.length > 0) {
  const components = analysis.data.relatedComponents.map(path => ({
    path: path,
    reason: 'Identified by AI as potentially affected'
  }));

  const componentResponse = await fetch('http://localhost:3000/api/ai/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: errorMessage,
      components: components
    })
  });

  const componentAnalysis = await componentResponse.json();
  // Process component-specific recommendations
}
```

---

## Rate Limiting & Best Practices

### Cost Management

1. **Cache Results**: Store AI analysis results to avoid duplicate API calls
2. **Use Status Endpoint**: Check `/api/ai/status` before making expensive calls
3. **Selective AI Usage**: Use AI for complex errors, rule-based for simple ones
4. **Monitor Usage**: Track token consumption via response metadata

### Error Handling

```javascript
async function analyzeWithAI(errorMessage) {
  try {
    const response = await fetch('http://localhost:3000/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: errorMessage })
    });

    if (response.status === 503) {
      console.warn('AI not available, falling back to rule-based');
      // Fall back to /api/analyze
      return await analyzeWithRules(errorMessage);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();

  } catch (error) {
    console.error('AI analysis failed:', error);
    // Fall back to rule-based analysis
    return await analyzeWithRules(errorMessage);
  }
}
```

### Performance Optimization

1. **Provide Code Snippets**: Include code context to get better AI analysis
2. **Use Specific Endpoints**: Use `/api/ai/fix` for fixes, not generic `/api/ai/analyze`
3. **Batch Component Analysis**: Analyze multiple components in one call
4. **Monitor Response Times**: AI calls take 2-4 seconds, plan UI accordingly

---

## Comparison: AI Endpoints vs. Standard Endpoints

| Feature | `/api/analyze` | `/api/ai/analyze` |
|---------|---------------|-------------------|
| AI Analysis | Optional (with fallback) | Required (fails if unavailable) |
| Rule-Based Analysis | Always included | Not included |
| Response Time | 1-6 seconds | 2-4 seconds |
| Cost | Free (rule-based) + AI cost | AI cost only |
| Use Case | General purpose | Pure AI analysis |
| Fallback | Yes | No |

**When to use `/api/analyze`:**
- Production systems requiring high availability
- When rule-based analysis is acceptable fallback
- Cost-sensitive applications

**When to use `/api/ai/analyze`:**
- You specifically want AI-powered insights
- You handle AI unavailability in your client code
- You want pure AI results without rule-based mixing

---

## Testing the AI Endpoints

### Test Script (Node.js)

```javascript
const testAIEndpoints = async () => {
  const baseUrl = 'http://localhost:3000';

  // Test 1: AI Status
  console.log('Testing /api/ai/status...');
  const statusRes = await fetch(`${baseUrl}/api/ai/status`);
  const status = await statusRes.json();
  console.log('AI Enabled:', status.ai.enabled);

  if (!status.ai.enabled) {
    console.log('AI not enabled. Set ANTHROPIC_API_KEY to continue.');
    return;
  }

  // Test 2: AI Analysis
  console.log('\nTesting /api/ai/analyze...');
  const analyzeRes = await fetch(`${baseUrl}/api/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'System.NullPointerException: Attempt to de-reference a null object. Class.TestClass.testMethod: line 10'
    })
  });
  const analysis = await analyzeRes.json();
  console.log('Root Cause:', analysis.data.rootCauseAnalysis);

  // Test 3: Fix Generation
  console.log('\nTesting /api/ai/fix...');
  const fixRes = await fetch(`${baseUrl}/api/ai/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: 'TypeError: Cannot read property name of undefined',
      codeSnippet: {
        errorLine: 5,
        code: [
          { lineNumber: 5, content: 'const name = user.name;', isError: true }
        ]
      }
    })
  });
  const fix = await fixRes.json();
  console.log('Fix Suggested:', fix.data.changes);

  console.log('\nAll tests completed!');
};

testAIEndpoints().catch(console.error);
```

---

## Troubleshooting

### Issue: 503 Service Unavailable

**Cause**: `ANTHROPIC_API_KEY` not set

**Solution**:
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
# Restart the server
node api-server.js
```

### Issue: Slow Response Times

**Cause**: Large code snippets or complex errors

**Solution**:
- Limit code snippet to ±5 lines around error
- Use `CLAUDE_MODEL=claude-3-haiku` for faster responses
- Reduce `CLAUDE_MAX_TOKENS` to 1024

### Issue: AI Analysis Quality Poor

**Cause**: Insufficient context provided

**Solution**:
- Always include `codeSnippet` with actual code
- Provide accurate `filePath` and `repo` parameters
- Include complete error messages, not truncated

---

## Summary

The AI-specific REST API endpoints provide direct access to Claude AI's code analysis capabilities:

✅ **4 Dedicated Endpoints** for different AI use cases
✅ **Pure AI Analysis** without rule-based fallbacks
✅ **Rich Context** for accurate recommendations
✅ **Flexible Integration** patterns for various workflows
✅ **Cost Transparency** with pricing information
✅ **Comprehensive Error Handling** for production use

**Next Steps:**
1. Set `ANTHROPIC_API_KEY` environment variable
2. Test with `/api/ai/status` to verify setup
3. Try `/api/ai/analyze` with a sample error
4. Integrate into your application workflow

For more information, see:
- **AI-INTEGRATION-GUIDE.md** - Complete AI setup guide
- **APPLICATION-FLOW.md** - Technical architecture
- **SERVICENOW-INCIDENT-REQUEST.md** - ServiceNow integration
