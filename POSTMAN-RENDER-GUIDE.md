# Postman Guide for Render.com Deployment

## Quick Start

Your API is deployed at: **https://sfclaudesnowintegration.onrender.com**

## 📥 Import Postman Collection

1. Open Postman
2. Click **Import** (top left)
3. Select **File** tab
4. Choose `Error-Analyzer-API.postman_collection.json`
5. Click **Import**

## 🌐 Available Endpoints

### Collection Variable
The collection includes a `{{renderUrl}}` variable set to:
```
https://sfclaudesnowintegration.onrender.com
```

## 🧪 Test Requests

### 1. Health Check (GET)
**Endpoint:** `{{renderUrl}}/api/health`

**Request:**
```
GET https://sfclaudesnowintegration.onrender.com/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy",
  "timestamp": "2025-11-27T...",
  "servicenow": {
    "configured": false,
    "instance": "Not configured"
  }
}
```

---

### 2. Create Incident (Local Mode) - POST
**Endpoint:** `{{renderUrl}}/api/incident/create`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1",
  "caller": "developer@company.com",
  "localOnly": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Analysis completed and saved locally",
  "data": {
    "analysisResults": {
      "errorInfo": {
        "type": "LimitException",
        "language": "apex",
        "lineNumber": 156
      },
      "recommendations": {
        "possibleCauses": [
          "Too many SOQL queries in a single transaction",
          "Non-bulkified code in loops"
        ],
        "suggestedFixes": [
          "Move SOQL queries outside of loops",
          "Bulkify your code to handle multiple records"
        ]
      }
    }
  }
}
```

---

### 3. Create ServiceNow Incident - POST
**Endpoint:** `{{renderUrl}}/api/incident/create`

**Prerequisites:** ServiceNow environment variables must be configured in Render.com dashboard:
- `SNOW_INSTANCE`
- `SNOW_USERNAME`
- `SNOW_PASSWORD`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "developer@company.com"
}
```

**Expected Response (with ServiceNow configured):**
```json
{
  "success": true,
  "message": "Incident created successfully",
  "data": {
    "incidentNumber": "INC0012345",
    "incidentSysId": "abc123...",
    "incidentUrl": "https://your-instance.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123...",
    "attachmentSysId": "def456...",
    "analysisResults": {
      "errorInfo": {...},
      "recommendations": {...}
    }
  }
}
```

**Expected Response (without ServiceNow - falls back to local mode):**
```json
{
  "success": true,
  "message": "Analysis completed and saved locally (ServiceNow not configured)",
  "data": {
    "analysisResults": {...}
  }
}
```

---

### 4. Analyze Error - POST
**Endpoint:** `{{renderUrl}}/api/analyze`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "error": "System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "errorInfo": {
      "type": "DmlException",
      "message": "Insert failed...",
      "language": "apex"
    },
    "recommendations": {
      "possibleCauses": [
        "Missing required fields in DML operation",
        "Field validation rules not met"
      ],
      "suggestedFixes": [
        "Ensure all required fields are populated before DML",
        "Check field-level security and validation rules"
      ],
      "bestPractices": [
        "Always validate data before DML operations",
        "Use try-catch to handle DML exceptions gracefully"
      ]
    }
  }
}
```

---

## 📁 Postman Collection Structure

```
Error Analyzer API
├── Health & Status
│   ├── Health Check
│   └── API Status
├── Error Analysis
│   ├── Analyze Apex NullPointerException
│   ├── Analyze Governor Limit Exception
│   ├── Analyze JavaScript TypeError
│   └── Analyze with Custom Repository
├── Incident Creation
│   ├── Create Incident (Local Mode)
│   ├── Create ServiceNow Incident
│   ├── Create Incident with Assignment Group
│   └── Create Incident - Custom Repository
├── Render.com Deployment ⭐ NEW
│   ├── Render - Health Check
│   ├── Render - Create Incident (Local Mode)
│   ├── Render - Create ServiceNow Incident
│   └── Render - Analyze Error
└── Error Scenarios (Testing)
    ├── Test Missing Error Field
    └── Test Invalid Endpoint
```

---

## 🔑 Using Variables in Postman

The collection includes three environment variables:

| Variable | Value | Use Case |
|----------|-------|----------|
| `{{baseUrl}}` | `http://localhost:3000` | Local development |
| `{{herokuUrl}}` | `https://your-app-name.herokuapp.com` | Heroku deployment |
| `{{renderUrl}}` | `https://sfclaudesnowintegration.onrender.com` | Render.com deployment ⭐ |

### Switch Between Environments

**To use local development:**
```
{{baseUrl}}/api/health
```

**To use Render.com deployment:**
```
{{renderUrl}}/api/health
```

---

## 🎯 Step-by-Step Testing Guide

### Test 1: Verify Deployment is Live

1. Open Postman
2. Find: **Render.com Deployment → Render - Health Check**
3. Click **Send**
4. Status should be `200 OK`
5. Response should show `"status": "healthy"`

### Test 2: Test Error Analysis (No ServiceNow Needed)

1. Find: **Render.com Deployment → Render - Analyze Error**
2. Click **Send**
3. Check the response includes:
   - `possibleCauses`
   - `suggestedFixes`
   - `bestPractices`

### Test 3: Create Incident in Local Mode

1. Find: **Render.com Deployment → Render - Create Incident (Local Mode)**
2. Review the request body:
   ```json
   {
     "error": "System.LimitException: Too many SOQL queries: 101...",
     "caller": "developer@company.com",
     "localOnly": true
   }
   ```
3. Click **Send**
4. Response should include analysis results
5. Note: Report is saved on server (not in ServiceNow)

### Test 4: Create ServiceNow Incident (Requires Configuration)

**Prerequisites:**
1. Go to Render.com dashboard
2. Navigate to your service
3. Click **Environment** tab
4. Add environment variables:
   - `SNOW_INSTANCE` = your-instance.service-now.com
   - `SNOW_USERNAME` = your-username
   - `SNOW_PASSWORD` = your-password
5. Click **Save Changes** (triggers redeploy)
6. Wait 2-3 minutes for redeploy

**Then in Postman:**
1. Find: **Render.com Deployment → Render - Create ServiceNow Incident**
2. Click **Send**
3. Response should include:
   - `incidentNumber` (e.g., INC0012345)
   - `incidentUrl` (link to ServiceNow)

---

## 🔧 Customizing Requests

### Change Error Message

Edit the request body:
```json
{
  "error": "YOUR_ERROR_MESSAGE_HERE",
  "caller": "your-email@company.com"
}
```

### Analyze Against Different Repository

Add `repo` field:
```json
{
  "error": "System.NullPointerException...",
  "repo": "https://github.com/yourorg/yourrepo"
}
```

### Add Assignment Group

```json
{
  "error": "System.DmlException...",
  "caller": "developer@company.com",
  "assignmentGroup": "your-group-sys-id"
}
```

---

## 🚨 Troubleshooting

### Error: "Cannot GET /api/incident/create"
**Problem:** Using GET instead of POST

**Solution:** Ensure method is set to `POST` for incident creation

---

### Error: Connection Timeout
**Possible Causes:**
1. **Free tier sleep:** Render.com free tier sleeps after 15 minutes
2. **First request:** Cold start takes 30-60 seconds

**Solution:**
- Wait 60 seconds and retry
- If using free plan, first request may be slow

---

### Error: "ServiceNow configuration not found"
**Problem:** ServiceNow environment variables not set

**Solutions:**

**Option 1: Use Local Mode**
Add `"localOnly": true` to request body:
```json
{
  "error": "...",
  "caller": "...",
  "localOnly": true
}
```

**Option 2: Configure ServiceNow**
1. Go to Render.com dashboard
2. Add environment variables (SNOW_INSTANCE, SNOW_USERNAME, SNOW_PASSWORD)
3. Redeploy

---

### Error: 404 Not Found
**Problem:** Wrong endpoint URL

**Solution:** Check endpoint path:
- ✅ `/api/incident/create`
- ❌ `/incident/create`
- ❌ `/api/incidents/create`

---

## 📊 Response Codes

| Code | Meaning | Typical Cause |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Incident created successfully |
| 400 | Bad Request | Missing required fields (error, caller) |
| 404 | Not Found | Invalid endpoint URL |
| 500 | Server Error | Internal server error (check logs) |
| 503 | Service Unavailable | Service is deploying or sleeping |

---

## 🔐 Authentication (Future)

Currently, the API has no authentication. For production use, consider:
- API keys
- OAuth tokens
- JWT authentication

---

## 💡 Tips

1. **Use Collections:** Organize related requests in folders
2. **Save Examples:** Save successful responses as examples
3. **Use Tests:** Add test scripts to validate responses
4. **Environment Variables:** Create separate environments for dev/staging/prod

### Example Postman Test Script

Add to the "Tests" tab of any request:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response includes data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});
```

---

## 📚 Additional Resources

- **API Documentation:** See `README.md` in repository
- **Render.com Deployment:** See `RENDER-DEPLOY.md`
- **Heroku Deployment:** See `HEROKU-ECO-DEPLOY.md`
- **ServiceNow Integration:** See `servicenow-integration.js`

---

## ✅ Quick Reference - Common Requests

### Health Check
```bash
curl https://sfclaudesnowintegration.onrender.com/api/health
```

### Analyze Error
```bash
curl -X POST https://sfclaudesnowintegration.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"error": "System.NullPointerException: Attempt to de-reference a null object"}'
```

### Create Incident (Local Mode)
```bash
curl -X POST https://sfclaudesnowintegration.onrender.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{"error": "System.LimitException: Too many SOQL queries: 101", "caller": "dev@company.com", "localOnly": true}'
```

---

## 🎉 You're Ready!

Your Postman collection is configured to test the Render.com deployment at:
**https://sfclaudesnowintegration.onrender.com**

Start with the **Health Check** request to verify the deployment is live, then explore the other requests!
