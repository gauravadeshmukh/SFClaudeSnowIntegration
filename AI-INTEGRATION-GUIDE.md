# AI-Powered Error Analysis - Complete Integration Guide

## 🤖 Claude AI Integration

The Error Analyzer now includes **AI-powered intelligent code analysis** using Anthropic's Claude AI. This provides deep, context-aware insights that go far beyond simple pattern matching.

---

## 🎯 What's New

### AI-Powered Features

1. **Root Cause Analysis** - Claude AI examines code and explains the fundamental reason for the error
2. **Context-Aware Insights** - Analyzes actual code patterns, variable usage, and logic flow
3. **Intelligent Fix Suggestions** - Provides specific, code-level fixes with examples
4. **Prevention Strategies** - Long-term recommendations to prevent similar errors
5. **Related Component Analysis** - Identifies other files/classes that might be affected

### Dual-Mode Operation

- **AI Mode** (when ANTHROPIC_API_KEY is set) - Uses Claude AI for intelligent analysis
- **Rule-Based Mode** (fallback) - Uses pattern matching when AI is unavailable

---

## 🚀 Quick Start

### Step 1: Get Claude API Key

1. Visit https://console.anthropic.com/
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`)

### Step 2: Configure Environment

**For Local Development:**
```bash
# Create .env file
cp .env.example .env

# Edit .env and add your key
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**For Render.com Deployment:**
1. Go to https://dashboard.render.com
2. Select your service
3. Click **Environment** tab
4. Add environment variable:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-api03-your-key-here`
5. Click **Save Changes**

**For Heroku Deployment:**
```bash
heroku config:set ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Step 3: Test AI Analysis

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12"
  }'
```

**Look for** in response:
```json
{
  "aiPowered": true,
  "aiModel": "claude-3-5-sonnet-20241022",
  "message": "AI-powered analysis completed"
}
```

---

## 📊 Complete Application Flow (AI-Powered)

```
User Request
    ↓
API Server (api-server.js)
    ↓
Error Analyzer (error-analyzer.js)
    ├─→ Parse Error (Regex)
    ├─→ Find Target File (GitHub API)
    ├─→ Fetch Code (GitHub API)
    ├─→ Extract Code Snippet
    ├─→ **Claude AI Analysis** ← NEW!
    │   └─→ Anthropic API Call
    │       ├─→ Send: Error + Code Context
    │       └─→ Receive: AI Analysis
    ├─→ Merge AI + Rule-based Results
    └─→ Return Comprehensive Analysis
    ↓
ServiceNow Integration (if enabled)
    ↓
User Response
```

---

## 🧠 How Claude AI Analysis Works

### 1. Context Gathering

The analyzer sends Claude:
- **Error details** (type, message, line number, class)
- **Code snippet** (5 lines before/after error)
- **Repository context** (owner, name, branch)
- **Language** (Apex, JavaScript, Java, Python)
- **Error-specific instructions** (based on error type)

### 2. AI Processing

Claude AI:
- Examines actual code at error line
- Identifies root cause
- Considers language-specific patterns
- Analyzes variable usage and data flow
- Generates specific, actionable fixes
- Suggests prevention strategies

### 3. Structured Response

Claude returns JSON with:
```json
{
  "rootCauseAnalysis": "Detailed explanation...",
  "codeContextInsights": ["insight 1", "insight 2"],
  "possibleCauses": ["cause 1", "cause 2"],
  "suggestedFixes": ["fix with code example", "alternative fix"],
  "bestPractices": ["practice 1", "practice 2"],
  "relatedComponents": ["file1.cls", "file2.cls"],
  "preventionStrategy": "How to prevent this..."
}
```

---

## 📝 Example Request/Response

### Request
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1",
  "caller": "developer@company.com"
}
```

### Response (AI-Powered)
```json
{
  "success": true,
  "message": "AI-powered analysis completed",
  "aiPowered": true,
  "aiModel": "claude-3-5-sonnet-20241022",
  "data": {
    "errorInfo": {
      "type": "LimitException",
      "className": "AccountDataProcessor",
      "lineNumber": 156
    },
    "targetFile": "force-app/main/default/classes/AccountDataProcessor.cls",
    "analysisResults": [
      {
        "filePath": "force-app/main/default/classes/AccountDataProcessor.cls",
        "errorType": "LimitException",
        "codeSnippet": {
          "errorLine": 156,
          "code": [
            { "lineNumber": 151, "content": "for (Account acc : accounts) {" },
            { "lineNumber": 152, "content": "  List<Contact> contacts = [SELECT Id FROM Contact WHERE AccountId = :acc.Id];" },
            { "lineNumber": 156, "content": "  List<Opportunity> opps = [SELECT Id FROM Opportunity WHERE AccountId = :acc.Id];", "isError": true }
          ]
        },
        "rootCauseAnalysis": "The error occurs because a SOQL query is being executed inside a for-loop at line 156. Each iteration of the loop executes a separate SOQL query, and with 101 accounts, this exceeds the Salesforce governor limit of 100 SOQL queries per transaction. The code is not bulkified.",
        "codeContextInsights": [
          "SOQL query detected inside a loop structure",
          "Non-bulkified pattern: one query per record",
          "Multiple SOQL queries in same loop (lines 152 and 156)"
        ],
        "possibleCauses": [
          "SOQL queries inside loop violate bulkification principles",
          "Processing 101+ accounts triggers the 100 SOQL limit",
          "No collection-based data aggregation before querying"
        ],
        "suggestedFixes": [
          "Collect all Account IDs first, then query contacts and opportunities in bulk:\n\n```apex\nSet<Id> accountIds = new Set<Id>();\nfor (Account acc : accounts) {\n    accountIds.add(acc.Id);\n}\n\nList<Contact> allContacts = [SELECT Id, AccountId FROM Contact WHERE AccountId IN :accountIds];\nList<Opportunity> allOpps = [SELECT Id, AccountId FROM Opportunity WHERE AccountId IN :accountIds];\n\nMap<Id, List<Contact>> contactsByAccount = new Map<Id, List<Contact>>();\nfor (Contact c : allContacts) {\n    if (!contactsByAccount.containsKey(c.AccountId)) {\n        contactsByAccount.put(c.AccountId, new List<Contact>());\n    }\n    contactsByAccount.get(c.AccountId).add(c);\n}\n// Similar mapping for opportunities\n```",
          "Use aggregate queries if you only need counts or summary data",
          "Consider async processing (@future, Queueable) for large data volumes"
        ],
        "bestPractices": [
          "Always bulkify Apex code to handle collections, not single records",
          "Move SOQL queries outside loops",
          "Use maps to organize related data by key",
          "Monitor governor limits with Limits class methods",
          "Test with realistic data volumes (200+ records)"
        ],
        "preventionStrategy": "Implement a code review checklist that includes bulkification verification. Use static analysis tools like PMD or ApexMetrics to automatically detect SOQL-in-loop patterns. Always design triggers and batch classes with bulk operations in mind from the start.",
        "relatedComponents": [
          "AccountTrigger.trigger - May need bulkification review",
          "AccountTriggerHandler.cls - Check for similar patterns",
          "BatchAccountProcessor.cls - Verify batch size handling"
        ]
      }
    ]
  }
}
```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | **Yes (for AI)** | - | Your Claude API key |
| `CLAUDE_MODEL` | No | `claude-3-5-sonnet-20241022` | Claude model to use |
| `CLAUDE_MAX_TOKENS` | No | `2048` | Max tokens for AI response |
| `USE_AI` | No | `true` | Enable/disable AI analysis |

### Model Options

| Model | Speed | Cost | Intelligence | Best For |
|-------|-------|------|--------------|----------|
| **claude-3-5-sonnet-20241022** | Fast | Low | High | **Recommended - Best balance** |
| claude-3-opus-20240229 | Slow | High | Highest | Complex analysis, critical errors |
| claude-3-haiku-20240307 | Fastest | Lowest | Good | Simple errors, high volume |

---

## 💰 Cost Considerations

### Anthropic Pricing (as of 2024)

**Claude 3.5 Sonnet:**
- Input: $3.00 / million tokens
- Output: $15.00 / million tokens

### Typical Usage Per Analysis

- **Input tokens:** ~500-800 (error + code snippet)
- **Output tokens:** ~300-500 (analysis response)
- **Cost per analysis:** ~$0.01 - $0.02

### Monthly Estimates

| Analyses/Month | Estimated Cost |
|----------------|----------------|
| 100 | $1 - $2 |
| 500 | $5 - $10 |
| 1,000 | $10 - $20 |
| 10,000 | $100 - $200 |

**💡 Tip:** Use `USE_AI=false` for development/testing to avoid costs

---

## ⚡ Performance

### Response Times

**With AI (Claude API):**
- GitHub file fetch: ~1-2 seconds
- Claude AI analysis: ~2-4 seconds
- **Total: 3-6 seconds**

**Without AI (Rule-based):**
- GitHub file fetch: ~1-2 seconds
- Pattern matching: <100ms
- **Total: 1-2 seconds**

**Caching:**
- File content cached after first fetch
- Subsequent analyses of same file: ~2-4 seconds (AI) or <100ms (rule-based)

---

## 🔒 Security Best Practices

### API Key Protection

✅ **DO:**
- Store API key in environment variables
- Use `.env` file for local development
- Add `.env` to `.gitignore`
- Use dashboard environment variables for deployment
- Rotate API keys periodically

❌ **DON'T:**
- Commit API keys to version control
- Hardcode keys in source code
- Share keys in public channels
- Use production keys in development

### Rate Limiting

Claude API has rate limits:
- Tokens per minute
- Requests per minute
- Tokens per day

The analyzer handles this gracefully:
- Falls back to rule-based analysis on API errors
- Logs API failures for monitoring

---

## 🧪 Testing AI Integration

### Test 1: Verify AI is Enabled

```bash
curl http://localhost:3000/api/health
```

Look for:
```json
{
  "ai": {
    "enabled": true,
    "model": "claude-3-5-sonnet-20241022"
  }
}
```

### Test 2: Simple Error Analysis

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "TypeError: Cannot read property name of undefined"
  }'
```

Check response for:
- `"aiPowered": true`
- `"rootCauseAnalysis": "..."`
- `"preventionStrategy": "..."`

### Test 3: Complex Salesforce Error

```bash
curl -X POST http://localhost:3000/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156",
    "caller": "dev@company.com",
    "localOnly": true
  }'
```

Review the generated report file for AI-powered sections.

---

## 🛠️ Troubleshooting

### AI Analysis Not Working

**Problem:** `"aiPowered": false` in response

**Solutions:**
1. Check if `ANTHROPIC_API_KEY` is set:
   ```bash
   echo $ANTHROPIC_API_KEY
   ```
2. Verify API key is valid (starts with `sk-ant-`)
3. Check environment variables in deployment dashboard
4. Look for error messages in logs
5. Restart service after adding environment variables

---

### API Key Invalid Error

**Problem:** `❌ Claude AI analysis failed: 401 Unauthorized`

**Solutions:**
- Verify API key is correct
- Check if API key has expired
- Ensure no extra spaces in `.env` file
- Generate a new API key from console.anthropic.com

---

### Rate Limit Exceeded

**Problem:** `429 Too Many Requests`

**Solutions:**
- Wait a few minutes before retrying
- Upgrade to higher tier Anthropic plan
- Implement request queuing/throttling
- Use `USE_AI=false` temporarily

---

### Slow Response Times

**Problem:** Analysis takes >10 seconds

**Possible Causes:**
- Large code snippets (>10 lines)
- Complex error types
- Network latency to Anthropic API
- Using Claude Opus (slower model)

**Solutions:**
- Switch to `claude-3-haiku` for faster responses
- Reduce `CLAUDE_MAX_TOKENS` to 1024
- Use CDN/caching for file content
- Monitor Anthropic API status

---

## 📚 Advanced Usage

### Custom Prompts

You can modify `claude-ai-analyzer.js` to customize the AI analysis prompts for your specific use cases.

### Multi-Component Analysis

```javascript
const analyzer = new ErrorAnalyzer(repoUrl, { useAI: true });
const results = await analyzer.analyze(errorMessage);

if (results.aiPowered && results.analysisResults[0].relatedComponents.length > 0) {
  // Analyze related components
  const relatedAnalysis = await analyzer.claudeAnalyzer.analyzeRelatedComponents(
    results.errorInfo,
    results.analysisResults[0].relatedComponents,
    results.repository
  );
}
```

### Generate Fix Code

```javascript
const fixCode = await analyzer.claudeAnalyzer.generateFixCode(
  errorInfo,
  codeSnippet,
  filePath
);

console.log(fixCode.fixedCode);
console.log(fixCode.explanation);
```

---

## 📈 Monitoring & Analytics

### Track AI Usage

Add logging to monitor AI API usage:
```javascript
// In claude-ai-analyzer.js
console.log(`AI tokens used: ${message.usage.input_tokens + message.usage.output_tokens}`);
```

### Cost Tracking

Monitor monthly costs:
- Input tokens × $0.000003
- Output tokens × $0.000015

### Performance Metrics

Track:
- AI analysis success rate
- Average response time
- Fallback to rule-based frequency

---

## ✅ Summary

**AI Integration Complete!**

✓ Claude AI SDK installed
✓ AI-powered analyzer module created
✓ Error analyzer updated with AI integration
✓ API endpoints support AI analysis
✓ ServiceNow reports include AI insights
✓ Environment variables configured
✓ Fallback to rule-based analysis
✓ Comprehensive documentation

**To Enable:**
1. Set `ANTHROPIC_API_KEY` environment variable
2. Deploy/restart service
3. Test with `/api/analyze` endpoint
4. Verify `"aiPowered": true` in response

**Cost:** ~$0.01 - $0.02 per analysis
**Speed:** 3-6 seconds with AI, 1-2 seconds without
**Quality:** Significantly better than rule-based analysis

---

## 🔗 Related Documentation

- **Application Flow:** See `APPLICATION-FLOW.md`
- **Context-Aware Analysis:** See `CONTEXT-AWARE-ANALYSIS.md`
- **Deployment:** See `RENDER-DEPLOY.md`
- **API Reference:** See `SERVICENOW-INCIDENT-REQUEST.md`

---

## 🎉 You're Ready!

Your error analyzer now has the power of Claude AI! Enjoy intelligent, context-aware code analysis that goes far beyond simple pattern matching.
