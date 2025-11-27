# Postman Integration Guide

## Overview

This guide shows you how to use Postman to test and interact with the Error Analyzer API.

## Quick Start

### Step 1: Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `Error-Analyzer-API.postman_collection.json`
5. Click **Import**

### Step 2: Configure Variables

1. Click on the collection name
2. Select **Variables** tab
3. Update these variables:

| Variable | Current Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | Local development URL |
| `herokuUrl` | `https://your-app-name.herokuapp.com` | Your Heroku app URL |

### Step 3: Test API

1. Expand the collection folders
2. Select any request
3. Click **Send**
4. View response

## Collection Structure

### 1. Health & Status

#### Health Check
- **Method**: GET
- **Endpoint**: `/api/health`
- **Purpose**: Verify API is running

**Example Response**:
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy",
  "timestamp": "2025-11-26T21:00:00.000Z",
  "servicenow": {
    "configured": true,
    "instance": "dev12345.service-now.com"
  }
}
```

#### API Status
- **Method**: GET
- **Endpoint**: `/api/status`
- **Purpose**: Get API configuration

### 2. Error Analysis

#### Analyze Apex NullPointerException
- **Method**: POST
- **Endpoint**: `/api/analyze`
- **Body**:
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12"
}
```

#### Analyze Governor Limit Exception
- **Method**: POST
- **Endpoint**: `/api/analyze`
- **Body**:
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1"
}
```

#### Analyze JavaScript TypeError
- **Method**: POST
- **Endpoint**: `/api/analyze`
- **Body**:
```json
{
  "error": "TypeError: Cannot read property 'name' of undefined\n    at AccountController.getDetails (AccountController.js:34:21)"
}
```

### 3. Incident Creation

#### Create Incident (Local Mode)
- **Method**: POST
- **Endpoint**: `/api/incident/create`
- **Body**:
```json
{
  "error": "System.NullPointerException at line 45",
  "caller": "developer@company.com",
  "localOnly": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Report saved locally",
  "data": {
    "mode": "local",
    "reportFile": "error_analysis_1234567890.txt",
    "reportSize": 5780,
    "errorType": "NullPointerException"
  }
}
```

#### Create ServiceNow Incident
- **Method**: POST
- **Endpoint**: `/api/incident/create`
- **Body**:
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101",
  "caller": "developer@company.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "ServiceNow incident created",
  "data": {
    "mode": "servicenow",
    "incidentNumber": "INC0012345",
    "incidentUrl": "https://dev12345.service-now.com/...",
    "priority": "1"
  }
}
```

## Switching Between Environments

### Using Local Server

1. Update `baseUrl` variable: `http://localhost:3000`
2. Ensure local server is running: `node api-server.js`
3. Send requests

### Using Heroku Deployment

1. Update `baseUrl` variable: `{{herokuUrl}}`
2. Ensure you've set `herokuUrl` to your Heroku app URL
3. Send requests

### Quick Switch

Use Postman Environments for easy switching:

1. Click **Environments** (top right)
2. Create two environments:
   - **Local**: Set `url` to `http://localhost:3000`
   - **Heroku**: Set `url` to `https://your-app.herokuapp.com`
3. Switch environments as needed

## Testing Workflows

### Workflow 1: Analyze and Create Incident

1. **Health Check**
   - Send `Health Check` request
   - Verify API is running

2. **Analyze Error**
   - Send `Analyze Apex NullPointerException`
   - Review analysis results

3. **Create Incident**
   - Send `Create Incident (Local Mode)`
   - Verify report was created

### Workflow 2: Production Error Handling

1. **Capture Error**
   - Copy error from production logs

2. **Test Analysis**
   - Send to `/api/analyze`
   - Review possible causes and fixes

3. **Create Incident**
   - Send to `/api/incident/create`
   - Get incident number
   - Open incident in ServiceNow

## Advanced Features

### Pre-request Scripts

Add authentication or dynamic variables:

```javascript
// Generate timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Add API key header (if implemented)
pm.request.headers.add({
    key: "X-API-Key",
    value: pm.environment.get("api_key")
});
```

### Tests

Add automatic validation:

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test: Response has success field
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

// Test: Error type is correct
pm.test("Error type is LimitException", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.errorInfo.type).to.eql("LimitException");
});
```

### Collection Runner

Run all requests automatically:

1. Click **Runner** button
2. Select collection
3. Click **Run Error Analyzer API**
4. View results

## Common Use Cases

### Use Case 1: API Development

```
1. Start local server: node api-server.js
2. Use Local environment in Postman
3. Test each endpoint as you develop
4. Add tests to verify responses
```

### Use Case 2: Integration Testing

```
1. Deploy to Heroku
2. Switch to Heroku environment
3. Run Collection Runner
4. Verify all endpoints work in production
```

### Use Case 3: Error Analysis

```
1. Copy error from production
2. Paste into "Analyze Error" request body
3. Send request
4. Review analysis
5. Use "Create Incident" to log in ServiceNow
```

## Troubleshooting

### Connection Error

**Problem**: "Could not send request"

**Solutions**:
- Check if server is running: `curl http://localhost:3000/api/health`
- Verify URL is correct
- Check firewall settings

### 401 Unauthorized (if auth is added)

**Problem**: Unauthorized response

**Solutions**:
- Check API key in headers
- Verify authentication credentials
- Check token expiration

### 400 Bad Request

**Problem**: Missing required fields

**Solutions**:
- Verify request body has all required fields
- Check JSON syntax
- Review error message in response

### 500 Internal Server Error

**Problem**: Server error

**Solutions**:
- Check server logs: `heroku logs --tail`
- Verify ServiceNow credentials
- Ensure GitHub repository is accessible

## Sharing Collections

### Export Collection

1. Right-click collection
2. Select **Export**
3. Choose format (v2.1 recommended)
4. Share file with team

### Publish to Postman

1. Right-click collection
2. Select **Share Collection**
3. Generate link
4. Share with team

## Automation with Newman

Newman is Postman's CLI tool:

### Install Newman

```bash
npm install -g newman
```

### Run Collection

```bash
# Run locally
newman run Error-Analyzer-API.postman_collection.json \
  --env-var "baseUrl=http://localhost:3000"

# Run against Heroku
newman run Error-Analyzer-API.postman_collection.json \
  --env-var "baseUrl=https://your-app.herokuapp.com"

# Generate HTML report
newman run Error-Analyzer-API.postman_collection.json \
  --reporters html \
  --reporter-html-export report.html
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions
- name: Run API Tests
  run: |
    npm install -g newman
    newman run Error-Analyzer-API.postman_collection.json \
      --env-var "baseUrl=${{ secrets.API_URL }}"
```

## Best Practices

1. **Use Variables**: Store URLs and common values as variables
2. **Add Tests**: Validate responses automatically
3. **Organize Requests**: Group related requests in folders
4. **Document Requests**: Add descriptions to each request
5. **Version Control**: Commit collection JSON to git
6. **Use Environments**: Separate dev, staging, production configs

## Example: Complete Test Flow

```javascript
// 1. Health Check
GET {{baseUrl}}/api/health

// 2. Analyze Error
POST {{baseUrl}}/api/analyze
{
  "error": "System.NullPointerException at line 45"
}

// 3. Create Incident
POST {{baseUrl}}/api/incident/create
{
  "error": "System.NullPointerException at line 45",
  "caller": "developer@company.com",
  "localOnly": true
}

// 4. Verify Response
Tests:
- Status code is 201
- Response has incidentNumber
- Report file was created
```

## Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman Documentation](https://www.npmjs.com/package/newman)
- [Postman Learning Center](https://learning.postman.com/)

## Next Steps

1. Import collection into Postman
2. Configure environment variables
3. Test all endpoints
4. Add custom tests
5. Share with your team
6. Integrate with CI/CD using Newman

Happy testing! 🚀
