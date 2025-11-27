# Postman Quick Start - Create ServiceNow Incident

## 🚀 Quick Setup (2 Minutes)

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Error-Analyzer-API.postman_collection.json`
4. Click **Import**

### Step 2: Test the Endpoint

Navigate to: **Render.com Deployment → Render - Create Incident (Local Mode)**

---

## 📋 Request Details

### Endpoint
```
POST https://sfclaudesnowintegration.onrender.com/api/incident/create
```

### Headers
```
Content-Type: application/json
```

### Request Body (Example 1 - SOQL Limit)
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1",
  "caller": "developer@company.com",
  "localOnly": true
}
```

### Request Body (Example 2 - NullPointerException)
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "developer@company.com",
  "localOnly": true
}
```

### Request Body (Example 3 - DML Exception)
```json
{
  "error": "System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]",
  "caller": "developer@company.com",
  "localOnly": true
}
```

---

## ✅ Expected Response

```json
{
  "success": true,
  "message": "Analysis completed and saved locally",
  "data": {
    "analysisResults": {
      "errorInfo": {
        "type": "LimitException",
        "message": "System.LimitException: Too many SOQL queries: 101...",
        "fileName": null,
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
      },
      "relatedFiles": []
    }
  }
}
```

---

## 🎯 What This Does

1. **Accepts Error:** Sends the error message to the API
2. **Analyzes Error:** AI analyzes the error against GitHub codebase
3. **Returns Analysis:** Provides:
   - Error type and location
   - Possible causes
   - Suggested fixes
   - Best practices
4. **Local Mode:** Saves report locally (doesn't require ServiceNow)

---

## 🔄 To Create Actual ServiceNow Incident

### Prerequisites
You need to configure ServiceNow credentials in Render.com:

1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Select your service: `error-analyzer-api`
3. Click **Environment** tab
4. Add these variables:
   - `SNOW_INSTANCE` = `your-instance.service-now.com`
   - `SNOW_USERNAME` = `your-username`
   - `SNOW_PASSWORD` = `your-password`
5. Click **Save Changes**
6. Wait 2-3 minutes for redeploy

### Then Use This Request Body
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "developer@company.com"
}
```

**Note:** Remove `"localOnly": true` to create actual ServiceNow incident.

---

## ⚠️ Important Notes

### Free Tier Sleep
If using Render.com free tier:
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Subsequent requests are fast

**Solution:** Wait 60 seconds if first request times out, then retry.

### Required Fields
- `error` (required): The error message to analyze
- `caller` (required): Email of person reporting the error
- `localOnly` (optional): Set to `true` to skip ServiceNow and save locally

### Optional Fields
- `repo`: Custom GitHub repository URL
- `assignmentGroup`: ServiceNow assignment group sys_id

---

## 📊 All Available Requests in Collection

### Render.com Deployment Folder
1. **Render - Health Check** - Verify deployment is live
2. **Render - Create Incident (Local Mode)** ⭐ Start here
3. **Render - Create ServiceNow Incident** - Creates actual incident
4. **Render - Analyze Error** - Just analyze, don't create incident

---

## 🧪 Test Flow

### Test 1: Health Check
```
GET https://sfclaudesnowintegration.onrender.com/api/health
```
Expected: `200 OK` with status "healthy"

### Test 2: Analyze Error Only
```
POST https://sfclaudesnowintegration.onrender.com/api/analyze
Body: {"error": "System.NullPointerException..."}
```
Expected: Analysis with recommendations (no incident created)

### Test 3: Create Incident (Local)
```
POST https://sfclaudesnowintegration.onrender.com/api/incident/create
Body: {"error": "...", "caller": "...", "localOnly": true}
```
Expected: Analysis saved as file (no ServiceNow)

### Test 4: Create ServiceNow Incident
```
POST https://sfclaudesnowintegration.onrender.com/api/incident/create
Body: {"error": "...", "caller": "..."}
```
Expected: Incident created in ServiceNow with incident number

---

## 🔧 Customization Examples

### Change Error Type
```json
{
  "error": "TypeError: Cannot read property 'name' of undefined at line 42",
  "caller": "yourname@company.com",
  "localOnly": true
}
```

### Analyze Different Repo
```json
{
  "error": "System.DmlException: Insert failed",
  "caller": "dev@company.com",
  "repo": "https://github.com/yourorg/yourproject",
  "localOnly": true
}
```

### Add Assignment Group
```json
{
  "error": "System.LimitException: CPU time limit exceeded",
  "caller": "dev@company.com",
  "assignmentGroup": "abc123-sys-id"
}
```

---

## 📖 More Documentation

- **Full Postman Guide:** See `POSTMAN-RENDER-GUIDE.md`
- **Deployment Guide:** See `RENDER-DEPLOY.md`
- **API Reference:** See `README.md`

---

## ✨ Summary

**To create an incident via Postman:**

1. Import collection
2. Open: **Render.com Deployment → Render - Create Incident (Local Mode)**
3. Click **Send**
4. Get instant error analysis!

**Endpoint:** `https://sfclaudesnowintegration.onrender.com/api/incident/create`

**Required Body:**
```json
{
  "error": "YOUR_ERROR_MESSAGE",
  "caller": "YOUR_EMAIL",
  "localOnly": true
}
```

That's it! 🎉
