# ServiceNow Incident Creation - Request Format

## 🎯 Actual ServiceNow Incident Creation

This guide shows the **exact request format** for creating incidents in ServiceNow (not local mode).

---

## 📋 Prerequisites

### 1. Configure ServiceNow Environment Variables in Render.com

Before creating actual incidents, set these in your Render.com dashboard:

```
SNOW_INSTANCE=your-instance.service-now.com
SNOW_USERNAME=your-username
SNOW_PASSWORD=your-password-or-api-token
```

**Steps:**
1. Go to https://dashboard.render.com
2. Click on your service: `error-analyzer-api`
3. Click **Environment** tab
4. Click **Add Environment Variable**
5. Add the three variables above
6. Click **Save Changes** (triggers auto-redeploy, wait 2-3 minutes)

---

## 🚀 Request Format

### Endpoint
```
POST https://sfclaudesnowintegration.onrender.com/api/incident/create
```

### Headers
```
Content-Type: application/json
```

### Request Body - Basic Format
```json
{
  "error": "YOUR_ERROR_MESSAGE_HERE",
  "caller": "user@company.com"
}
```

**⚠️ Important:** Remove `"localOnly": true` to create actual ServiceNow incident!

---

## 📝 Request Examples

### Example 1: SOQL Governor Limit Exception
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1",
  "caller": "developer@company.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "incidentNumber": "INC0012345",
    "incidentSysId": "abc123def456...",
    "incidentUrl": "https://your-instance.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123def456...",
    "attachmentSysId": "xyz789...",
    "analysisResults": {
      "errorInfo": {
        "type": "LimitException",
        "message": "System.LimitException: Too many SOQL queries: 101...",
        "lineNumber": 156,
        "language": "apex",
        "className": "AccountDataProcessor"
      },
      "recommendations": {
        "possibleCauses": [
          "Too many SOQL queries in a single transaction (Governor Limit: 100)",
          "Non-bulkified code processing records in loops",
          "Trigger or batch processing not optimized"
        ],
        "suggestedFixes": [
          "Move SOQL queries outside of loops",
          "Bulkify your code to handle multiple records in single queries",
          "Use collections (List/Map) to aggregate data before querying",
          "Consider using @future or Queueable for async processing"
        ],
        "bestPractices": [
          "Always design with bulkification in mind",
          "Use Limits.getQueries() to monitor SOQL usage",
          "Follow one-trigger-per-object pattern",
          "Implement proper error handling and governor limit checks"
        ]
      }
    }
  }
}
```

---

### Example 2: NullPointerException
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "john.doe@company.com"
}
```

**What gets created in ServiceNow:**
- **Short Description:** "System.NullPointerException in AccountHandler.cls"
- **Description:** Full error details with analysis
- **Category:** "Software"
- **Impact:** "3 - Moderate"
- **Urgency:** "3 - Moderate"
- **Priority:** "4"
- **Caller:** john.doe@company.com
- **Work Notes:** Analysis summary with recommendations
- **Attachment:** Full analysis report file

---

### Example 3: DML Exception
```json
{
  "error": "System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]",
  "caller": "jane.smith@company.com"
}
```

---

### Example 4: JavaScript TypeError
```json
{
  "error": "TypeError: Cannot read property 'name' of undefined at AccountController.getDetails (AccountController.js:34:21)",
  "caller": "dev.team@company.com"
}
```

---

### Example 5: With Assignment Group
```json
{
  "error": "System.LimitException: CPU time limit exceeded",
  "caller": "developer@company.com",
  "assignmentGroup": "abc123-assignment-group-sys-id"
}
```

**Note:** To find assignment group sys_id:
1. Go to ServiceNow
2. Navigate to: **User Administration → Groups**
3. Open your group
4. Copy the `sys_id` from URL or right-click → Copy sys_id

---

### Example 6: Analyze Against Different Repository
```json
{
  "error": "System.QueryException: List has no rows for assignment",
  "caller": "developer@company.com",
  "repo": "https://github.com/yourorg/yourproject/tree/main"
}
```

---

## 🔑 All Request Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `error` | string | The error message/exception | `"System.NullPointerException..."` |
| `caller` | string | Email of person reporting | `"user@company.com"` |

### Optional Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `errorMessage` | string | Alias for `error` | - |
| `repo` | string | GitHub repository URL | `https://github.com/gauravadeshmukh/agentforcedemo/tree/master` |
| `assignmentGroup` | string | ServiceNow assignment group sys_id | - |
| `localOnly` | boolean | Skip ServiceNow, save locally | `false` |

---

## 📊 Incident Fields Created

When an incident is created in ServiceNow, these fields are populated:

### Automatically Set Fields

```javascript
{
  short_description: "Error in [ClassName] - [ErrorType]",
  description: "[Full error message with stack trace and analysis]",
  category: "Software",
  subcategory: "Application Error",
  impact: "3",        // 3 - Moderate
  urgency: "3",       // 3 - Moderate
  priority: "4",      // Calculated from impact + urgency
  caller_id: "[User sys_id from email]",
  assignment_group: "[If provided]",
  work_notes: "[Analysis summary with recommendations]",
  state: "1",         // 1 - New
  contact_type: "api"
}
```

### Attachment Added

A detailed analysis report file is attached:
- **Filename:** `error_analysis_INC[number]_[timestamp].txt`
- **Content:**
  - Error details
  - Parsed information (type, location, line number)
  - Possible causes
  - Suggested fixes
  - Best practices
  - Related code files (if found)

---

## 🧪 Testing in Postman

### Step-by-Step:

1. **Import Collection**
   - Open Postman
   - Import `Error-Analyzer-API.postman_collection.json`

2. **Find Request**
   - Navigate to: **Render.com Deployment → Render - Create ServiceNow Incident**

3. **Review Body**
   ```json
   {
     "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
     "caller": "developer@company.com"
   }
   ```

   ⚠️ **Notice:** No `"localOnly": true` field!

4. **Send Request**
   - Click **Send**
   - Wait for response (may take 5-10 seconds for analysis + ServiceNow creation)

5. **Check Response**
   - Should include `incidentNumber` (e.g., INC0012345)
   - Should include `incidentUrl` (clickable link to ServiceNow)

6. **Verify in ServiceNow**
   - Click the `incidentUrl` from response
   - Or go to ServiceNow → Incidents
   - Find the incident by number
   - Check attached analysis file
   - Review work notes

---

## 🔄 Comparison: Local vs ServiceNow Mode

### Local Mode (Testing)
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101",
  "caller": "dev@company.com",
  "localOnly": true     ← This makes it local mode
}
```

**Result:**
- ✅ Error analyzed
- ✅ Recommendations generated
- ✅ Report saved on server
- ❌ NO ServiceNow incident created

---

### ServiceNow Mode (Production)
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101",
  "caller": "dev@company.com"
}
```
**Note:** No `localOnly` field or set to `false`

**Result:**
- ✅ Error analyzed
- ✅ Recommendations generated
- ✅ ServiceNow incident created
- ✅ Analysis attached to incident
- ✅ Work notes added
- ✅ Returns incident number & URL

---

## ⚠️ Error Handling

### If ServiceNow Not Configured

**Request:**
```json
{
  "error": "System.NullPointerException...",
  "caller": "dev@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed and saved locally (ServiceNow not configured)",
  "data": {
    "analysisResults": { ... }
  }
}
```

**Fix:** Configure `SNOW_INSTANCE`, `SNOW_USERNAME`, `SNOW_PASSWORD` in Render.com

---

### If Missing Required Fields

**Request:**
```json
{
  "caller": "dev@company.com"
}
```
**Note:** Missing `error` field

**Response:**
```json
{
  "success": false,
  "error": "Missing required field: error"
}
```

**Status Code:** `400 Bad Request`

---

### If ServiceNow API Fails

**Response:**
```json
{
  "success": false,
  "error": "Failed to create ServiceNow incident",
  "details": "[ServiceNow API error message]"
}
```

**Status Code:** `500 Internal Server Error`

---

## 🔐 Authentication

### ServiceNow Credentials

The API uses Basic Authentication to connect to ServiceNow:

```
Username: [SNOW_USERNAME]
Password: [SNOW_PASSWORD]
```

**Security Notes:**
- Credentials stored as environment variables in Render.com
- Never hardcoded in source code
- Transmitted over HTTPS only
- Can use API tokens instead of passwords

### Using API Token (Recommended)

1. Generate API token in ServiceNow
2. Use token as `SNOW_PASSWORD` environment variable
3. More secure than using actual password

---

## 📈 Response Structure

### Success Response

```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "incidentNumber": "INC0012345",
    "incidentSysId": "abc123...",
    "incidentUrl": "https://instance.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123",
    "attachmentSysId": "def456...",
    "analysisResults": {
      "errorInfo": {
        "type": "LimitException",
        "message": "...",
        "fileName": null,
        "lineNumber": 156,
        "language": "apex",
        "className": "AccountDataProcessor"
      },
      "recommendations": {
        "possibleCauses": [...],
        "suggestedFixes": [...],
        "bestPractices": [...],
        "relatedFiles": [...]
      }
    }
  }
}
```

### Field Descriptions

| Field | Description |
|-------|-------------|
| `incidentNumber` | ServiceNow incident number (e.g., INC0012345) |
| `incidentSysId` | ServiceNow internal sys_id |
| `incidentUrl` | Direct link to incident in ServiceNow |
| `attachmentSysId` | sys_id of attached analysis file |
| `analysisResults` | Complete error analysis and recommendations |

---

## 🎯 Complete cURL Example

```bash
curl -X POST https://sfclaudesnowintegration.onrender.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1",
    "caller": "developer@company.com"
  }'
```

---

## 💡 Tips

1. **Start with Local Mode**
   - Test with `"localOnly": true` first
   - Verify analysis results
   - Then remove `localOnly` for production

2. **Use Meaningful Caller Email**
   - Should be actual user in ServiceNow
   - Used to lookup caller_id in ServiceNow
   - Falls back to default if not found

3. **Include Full Error Context**
   - Include line numbers if available
   - Include class/file names
   - Include full stack trace for best analysis

4. **Monitor Response Time**
   - Analysis + ServiceNow creation takes 5-15 seconds
   - First request after sleep (free tier) may take 30-60 seconds

5. **Check ServiceNow Permissions**
   - User must have rights to create incidents
   - User must have rights to attach files
   - User must have rights to update work notes

---

## 🔗 Related Documentation

- **Quick Start:** See `POSTMAN-QUICK-START.md`
- **Full Postman Guide:** See `POSTMAN-RENDER-GUIDE.md`
- **Deployment:** See `RENDER-DEPLOY.md`
- **ServiceNow Integration Code:** See `servicenow-integration.js`

---

## ✅ Checklist Before Creating Incidents

- [ ] ServiceNow credentials configured in Render.com
- [ ] Service deployed and healthy (`/api/health` returns 200)
- [ ] Postman collection imported
- [ ] Tested with `localOnly: true` first
- [ ] ServiceNow user has incident creation permissions
- [ ] Caller email exists in ServiceNow (or use valid fallback)

---

## 🎉 Summary

**To create an actual ServiceNow incident:**

1. **Configure ServiceNow** in Render.com environment variables
2. **Use this request body:**
   ```json
   {
     "error": "YOUR_ERROR_MESSAGE",
     "caller": "user@company.com"
   }
   ```
3. **Send POST request** to `/api/incident/create`
4. **Get incident number** in response
5. **Click incident URL** to view in ServiceNow

**The key difference from local mode:** Remove `"localOnly": true`!
