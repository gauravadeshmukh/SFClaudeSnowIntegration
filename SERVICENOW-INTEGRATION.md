# ServiceNow Integration Guide

## Overview

The ServiceNow integration allows you to automatically create incidents in ServiceNow with comprehensive error analysis, suggested fixes, and best practices attached as a detailed report.

## Features

- ✅ **Automatic Incident Creation**: Creates ServiceNow incidents with error details
- 📊 **Smart Prioritization**: Automatically sets priority based on error type
- 📎 **Attached Analysis Report**: Comprehensive error analysis attached as a text file
- 📝 **Work Notes**: Adds summary work notes to the incident
- 🔍 **Detailed Information**: Includes error type, language, location, and repository info
- 🌐 **Direct Links**: Provides direct URL to the created incident

## Quick Start

### 1. Setup ServiceNow Configuration

```bash
# Copy the example configuration
cp servicenow-config.example.json servicenow-config.json

# Edit with your ServiceNow credentials
# Use your favorite text editor
```

Edit `servicenow-config.json`:
```json
{
  "instanceUrl": "your-instance.service-now.com",
  "username": "your.username",
  "password": "your_password_or_token",
  "apiVersion": "v1",
  "defaultAssignmentGroup": "your_group_sys_id"
}
```

### 2. Test with Local Mode (No ServiceNow Required)

```bash
# This creates a local report file without connecting to ServiceNow
node create-incident.js --error "Your error message" --local
```

### 3. Create Actual ServiceNow Incident

```bash
# Once configured, create real incidents
node create-incident.js --error "System.NullPointerException at line 45" --caller "user@example.com"
```

## Usage Examples

### Example 1: Basic Incident Creation

```bash
node create-incident.js \
  --error "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12" \
  --caller "developer@company.com"
```

### Example 2: With Assignment Group

```bash
node create-incident.js \
  --error "System.LimitException: Too many SOQL queries: 101" \
  --caller "dev@company.com" \
  --assignment-group "abc123xyz456"
```

### Example 3: Different Repository

```bash
node create-incident.js \
  --repo "https://github.com/yourorg/yourrepo" \
  --error "TypeError: Cannot read property 'name' of undefined" \
  --local
```

### Example 4: Custom Config File

```bash
node create-incident.js \
  --config "./my-snow-config.json" \
  --error "DmlException: Insert failed" \
  --caller "admin@company.com"
```

## Programmatic Usage

### Basic Example

```javascript
const ErrorAnalyzer = require('./error-analyzer');
const ServiceNowIntegration = require('./servicenow-integration');

// Step 1: Analyze the error
const analyzer = new ErrorAnalyzer('https://github.com/user/repo');
const analysisResults = await analyzer.analyze(errorMessage);

// Step 2: Create ServiceNow incident
const serviceNow = new ServiceNowIntegration({
  instanceUrl: 'dev12345.service-now.com',
  username: 'your.username',
  password: 'your_password'
});

const result = await serviceNow.createIncidentWithAnalysis(
  errorMessage,
  analysisResults,
  {
    caller_id: 'user@example.com',
    assignment_group: 'group_sys_id'
  }
);

console.log(`Incident created: ${result.incidentNumber}`);
console.log(`URL: ${result.incidentUrl}`);
```

### Advanced Example with Error Handling

```javascript
const { createIncidentWithAnalysis } = require('./create-incident');

async function handleApplicationError(error) {
  try {
    const result = await createIncidentWithAnalysis({
      errorMessage: error.stack || error.message,
      repoUrl: 'https://github.com/yourorg/yourrepo',
      configPath: './servicenow-config.json',
      caller: 'system@company.com',
      assignmentGroup: null,
      localOnly: false
    });

    // Send notification
    sendEmailNotification({
      subject: `Incident ${result.incidentNumber} created`,
      body: `Error has been logged. View at: ${result.incidentUrl}`
    });

    return result;
  } catch (err) {
    console.error('Failed to create incident:', err);
    // Fallback: save locally
    return createIncidentWithAnalysis({
      errorMessage: error.stack || error.message,
      repoUrl: 'https://github.com/yourorg/yourrepo',
      localOnly: true
    });
  }
}

// Use in your error handler
process.on('uncaughtException', handleApplicationError);
```

### Integration with Express.js Error Handler

```javascript
const express = require('express');
const { createIncidentWithAnalysis } = require('./create-incident');

const app = express();

// Error handling middleware
app.use(async (err, req, res, next) => {
  console.error('Application error:', err);

  // Create ServiceNow incident in background
  createIncidentWithAnalysis({
    errorMessage: `${err.stack}\n\nRequest: ${req.method} ${req.path}`,
    repoUrl: 'https://github.com/yourorg/yourrepo',
    configPath: './servicenow-config.json',
    caller: req.user?.email || 'anonymous@company.com',
    localOnly: false
  }).catch(incidentErr => {
    console.error('Failed to create incident:', incidentErr);
  });

  // Return error response
  res.status(500).json({ error: 'Internal server error' });
});
```

## What Gets Created in ServiceNow

### Incident Fields

| Field | Value | Source |
|-------|-------|--------|
| **Short Description** | Error type and message (first 100 chars) | Extracted from error |
| **Description** | Detailed error information with repository and file details | Generated from analysis |
| **Priority** | 1-5 based on error severity | Auto-determined |
| **Impact** | 1-3 based on error type | Auto-determined |
| **Urgency** | 1-3 based on error type | Auto-determined |
| **Category** | Software | Default |
| **Subcategory** | Application Error | Default |
| **Caller** | Specified via --caller | Command line or API |
| **Assignment Group** | Specified or from config | Command line or config |
| **Custom Fields** | u_error_type, u_programming_language | Extracted from error |

### Priority Mapping

- **Priority 1 (Critical)**: LimitException (Governor limits)
- **Priority 2 (High)**: DmlException, NullPointerException, SyntaxError
- **Priority 3 (Moderate)**: Other errors

### Attached Report Contents

The attached text file includes:

1. **Original Error Message**: The complete error as received
2. **Parsed Error Information**:
   - Error type
   - Programming language
   - File location
   - Line and column numbers
   - Class and method names
3. **Repository Information**: GitHub repository details
4. **Relevant Files**: List of files that might be related
5. **Code Snippets**: Actual code around the error line (if available)
6. **Possible Causes**: Why this error might have occurred
7. **Suggested Fixes**: Step-by-step remediation instructions
8. **Best Practices**: How to prevent similar errors

### Work Notes

Automatically added work notes include:
- Error type and language
- Name of attached analysis file
- Summary of what's included in the report

## ServiceNow API Configuration

### Authentication

The integration supports:
- **Basic Authentication**: Username and password
- **OAuth 2.0**: Use access token as password (recommended)

### Required ServiceNow Permissions

Your ServiceNow user needs:
- `incident` table: Create, Read, Update
- `sys_attachment` table: Create, Read
- API access enabled

### ServiceNow Instance Setup

1. **Enable REST API**:
   - Navigate to System Web Services → REST → REST API
   - Ensure REST API is active

2. **Create Integration User** (Recommended):
   - Create a dedicated user for the integration
   - Assign appropriate roles (itil, api_analytics_read)
   - Generate API credentials

3. **Custom Fields** (Optional):
   - Create custom fields: `u_error_type`, `u_programming_language`
   - Add to incident form layout

## Configuration Options

### servicenow-config.json

```json
{
  "instanceUrl": "dev12345.service-now.com",
  "username": "integration.user",
  "password": "password_or_token",
  "apiVersion": "v1",
  "defaultAssignmentGroup": "sys_id_of_group",
  "defaultCategory": "Software",
  "defaultSubcategory": "Application Error"
}
```

### Environment Variables (Alternative)

You can also use environment variables:

```javascript
const config = {
  instanceUrl: process.env.SNOW_INSTANCE,
  username: process.env.SNOW_USERNAME,
  password: process.env.SNOW_PASSWORD
};
```

## API Reference

### ServiceNowIntegration Class

#### Constructor

```javascript
new ServiceNowIntegration(config)
```

**Parameters:**
- `config.instanceUrl` (string): ServiceNow instance URL
- `config.username` (string): Username or client ID
- `config.password` (string): Password or access token
- `config.apiVersion` (string): API version (default: 'v1')

#### Methods

##### createIncidentWithAnalysis()

```javascript
await serviceNow.createIncidentWithAnalysis(errorMessage, analysisResults, additionalFields)
```

**Parameters:**
- `errorMessage` (string): Original error message
- `analysisResults` (object): Results from ErrorAnalyzer.analyze()
- `additionalFields` (object): Additional ServiceNow fields

**Returns:**
- Promise resolving to incident details object

##### createIncident()

```javascript
await serviceNow.createIncident(incidentData)
```

**Parameters:**
- `incidentData` (object): Incident fields

**Returns:**
- Promise resolving to created incident

##### attachFileToIncident()

```javascript
await serviceNow.attachFileToIncident(incidentSysId, fileName, fileContent)
```

**Parameters:**
- `incidentSysId` (string): Incident sys_id
- `fileName` (string): Name for the attachment
- `fileContent` (string): File content

**Returns:**
- Promise resolving to attachment details

##### saveAnalysisReportToFile()

```javascript
serviceNow.saveAnalysisReportToFile(errorMessage, analysisResults, outputDir)
```

**Parameters:**
- `errorMessage` (string): Original error message
- `analysisResults` (object): Analysis results
- `outputDir` (string): Output directory (default: '.')

**Returns:**
- Object with file details

## Troubleshooting

### Error: "ServiceNow API error (401)"

**Cause**: Authentication failed

**Solutions**:
- Verify username and password in config
- Check if user has API access enabled
- Try using an OAuth token instead of password

### Error: "ServiceNow API error (403)"

**Cause**: Insufficient permissions

**Solutions**:
- Ensure user has `incident` table permissions
- Check if user has attachment permissions
- Verify user has itil role

### Error: "ServiceNow API error (404)"

**Cause**: Invalid instance URL or endpoint

**Solutions**:
- Verify instanceUrl in config (without https://)
- Check ServiceNow instance is accessible
- Ensure REST API is enabled

### Error: "Request failed: ENOTFOUND"

**Cause**: Cannot reach ServiceNow instance

**Solutions**:
- Check network connectivity
- Verify instance URL is correct
- Check if VPN is required

### Attachment Failed but Incident Created

**Cause**: Attachment size limit or permissions

**Solutions**:
- Check ServiceNow attachment size limits
- Verify sys_attachment table permissions
- Review ServiceNow logs for details

## Best Practices

### 1. Use Dedicated Integration User

Create a specific ServiceNow user for the integration:
- Easier to track automated incidents
- Separate permissions from personal accounts
- Better audit trail

### 2. Secure Credentials

- Never commit `servicenow-config.json` to source control
- Add to `.gitignore`
- Use environment variables in production
- Consider using a secrets manager

### 3. Test with Local Mode First

```bash
# Always test your error messages locally first
node create-incident.js --error "Test error" --local
```

### 4. Error Handling

Always handle ServiceNow API failures gracefully:

```javascript
try {
  await createIncident(...);
} catch (error) {
  // Fallback: save locally
  saveAnalysisReportToFile(...);
  // Log error
  console.error('ServiceNow incident creation failed:', error);
}
```

### 5. Rate Limiting

Be mindful of ServiceNow API rate limits:
- Don't create incidents in tight loops
- Batch errors when possible
- Implement retry logic with exponential backoff

### 6. Assignment Groups

Configure default assignment groups in config:
```json
{
  "defaultAssignmentGroup": "your_team_sys_id"
}
```

## Examples of Generated Incidents

### Example 1: Apex Governor Limit Exception

**Short Description:**
```
LimitException: Too many SOQL queries: 101
```

**Priority:** 1 (Critical)

**Description:**
```
Error Analysis Report
================================================================================

ERROR DETAILS:
- Type: LimitException
- Language: apex
- Message: Too many SOQL queries: 101
- Location: AccountDataProcessor.cls:156:1
- Class: AccountDataProcessor.processRecords

REPOSITORY:
- gauravadeshmukh/agentforcedemo (master)

RELEVANT FILES:
1. force-app/main/default/classes/AccountTriggerHandler.cls (Same language file)
2. force-app/main/default/classes/AccountDataProcessor.cls (Class name match)
...

For detailed analysis, fixes, and recommendations, please see the attached file.
```

**Attached File:** `error_analysis_INC0012345_1234567890.txt`

### Example 2: JavaScript TypeError

**Short Description:**
```
TypeError: Cannot read property 'name' of undefined
```

**Priority:** 3 (Moderate)

**Work Notes:**
```
Error analysis completed and detailed report attached.

Error Type: TypeError
Language: javascript
Analysis File: error_analysis_INC0012346_1234567891.txt

The attached file contains:
- Detailed error information
- Code snippets (if available)
- Possible causes
- Suggested fixes
- Best practices
```

## Advanced Features

### Custom Incident Fields

Add custom fields to incidents:

```javascript
const additionalFields = {
  caller_id: 'user@example.com',
  assignment_group: 'group_sys_id',
  cmdb_ci: 'application_ci_sys_id',
  business_service: 'service_sys_id',
  u_application: 'My Application',
  u_environment: 'Production'
};

await serviceNow.createIncidentWithAnalysis(
  errorMessage,
  analysisResults,
  additionalFields
);
```

### Batch Error Processing

Process multiple errors:

```javascript
const errors = [error1, error2, error3];

for (const error of errors) {
  const analysisResults = await analyzer.analyze(error);
  await serviceNow.createIncidentWithAnalysis(error, analysisResults);

  // Add delay to respect rate limits
  await sleep(1000);
}
```

### Incident Updates

Update incidents after creation:

```javascript
const result = await serviceNow.createIncidentWithAnalysis(...);

// Later, update the incident
await serviceNow.updateIncident(result.incidentSysId, {
  state: '2', // In Progress
  work_notes: 'Fix has been deployed'
});
```

## Support and Resources

- **ServiceNow REST API Documentation**: https://docs.servicenow.com/
- **Test Mode**: Use `--local` flag to test without ServiceNow
- **Example Config**: `servicenow-config.example.json`
- **Integration Code**: `servicenow-integration.js`

## Security Considerations

1. **Credentials**: Never expose credentials in code or logs
2. **HTTPS**: Always use HTTPS for ServiceNow connections (enforced)
3. **Permissions**: Use least-privilege principle for integration user
4. **Secrets**: Store credentials in secure vault in production
5. **Audit**: Review ServiceNow audit logs regularly

## Next Steps

1. Set up ServiceNow configuration
2. Test with `--local` mode
3. Create a test incident in your dev instance
4. Integrate with your error handling
5. Monitor and refine assignment groups and priorities
