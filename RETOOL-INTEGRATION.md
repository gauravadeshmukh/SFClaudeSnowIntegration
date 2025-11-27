# Retool Integration Guide

## Overview

Retool is a low-code platform for building internal tools. This guide shows you how to integrate the Error Analyzer API with Retool to create a user-friendly interface for error analysis and incident creation.

## Prerequisites

1. Retool account (free tier available at [retool.com](https://retool.com))
2. Error Analyzer API deployed (Heroku or local)
3. API URL (e.g., `https://your-app.herokuapp.com`)

## Quick Start

### Step 1: Create New Retool App

1. Login to Retool
2. Click **Create new** → **Application**
3. Choose **Blank app**
4. Name it "Error Analyzer"

### Step 2: Add REST API Resource

1. Click **Resources** (bottom left)
2. Click **+** to add resource
3. Select **REST API**
4. Name it "ErrorAnalyzerAPI"
5. Configure base URL: `https://your-app.herokuapp.com`
6. Click **Save**

### Step 3: Create Queries

#### Query 1: Health Check

1. Click **+ New** → **Resource query**
2. Select "ErrorAnalyzerAPI"
3. Name: `healthCheck`
4. Method: `GET`
5. URL path: `/api/health`
6. Click **Save**

#### Query 2: Analyze Error

1. Click **+ New** → **Resource query**
2. Select "ErrorAnalyzerAPI"
3. Name: `analyzeError`
4. Method: `POST`
5. URL path: `/api/analyze`
6. Headers:
   ```
   Content-Type: application/json
   ```
7. Body (JSON):
   ```json
   {
     "error": {{ errorInput.value }}
   }
   ```
8. Click **Save**

#### Query 3: Create Incident

1. Click **+ New** → **Resource query`
2. Select "ErrorAnalyzerAPI"
3. Name: `createIncident`
4. Method: `POST`
5. URL path: `/api/incident/create`
6. Headers:
   ```
   Content-Type: application/json
   ```
7. Body (JSON):
   ```json
   {
     "error": {{ errorInput.value }},
     "caller": {{ callerInput.value }},
     "localOnly": {{ localModeSwitch.value }}
   }
   ```
8. Click **Save**

## Building the UI

### Layout 1: Simple Error Analyzer

#### Components:

1. **Text Area** (Error Input)
   - Name: `errorInput`
   - Label: "Error Message"
   - Placeholder: "Paste your error message here..."
   - Rows: 6

2. **Text Input** (Caller)
   - Name: `callerInput`
   - Label: "Your Email"
   - Placeholder: "developer@company.com"
   - Default value: "developer@company.com"

3. **Switch** (Local Mode)
   - Name: `localModeSwitch`
   - Label: "Local Mode (Test without ServiceNow)"
   - Default: `true`

4. **Button** (Analyze)
   - Text: "Analyze Error"
   - Event handler: Run query → `analyzeError`
   - Success notification: "Analysis complete!"

5. **Button** (Create Incident)
   - Text: "Create Incident"
   - Event handler: Run query → `createIncident`
   - Success notification: "Incident created!"
   - Disabled when: `{{ !errorInput.value || !callerInput.value }}`

6. **JSON Viewer** (Results)
   - Name: `resultsViewer`
   - Data: `{{ analyzeError.data || createIncident.data }}`

### Layout 2: Advanced Dashboard

#### Tab 1: Error Analysis

**Components:**

1. **Container** (Input Section)
   - Text Area: Error input
   - Select: Repository (dropdown with common repos)
   - Button: Analyze

2. **Container** (Results Section)
   - Text: Error Type (`{{ analyzeError.data.data.errorInfo.type }}`)
   - Text: Language (`{{ analyzeError.data.data.errorInfo.language }}`)
   - Text: Relevant Files Count
   - Divider

3. **Container** (Analysis Details)
   - **Listbox**: Possible Causes
     - Data: `{{ analyzeError.data.data.analysisResults[0].possibleCauses }}`
   - **Listbox**: Suggested Fixes
     - Data: `{{ analyzeError.data.data.analysisResults[0].suggestedFixes }}`
   - **Listbox**: Best Practices
     - Data: `{{ analyzeError.data.data.analysisResults[0].bestPractices }}`

#### Tab 2: Create Incident

**Components:**

1. **Form** (Incident Details)
   - Text Area: Error message
   - Text Input: Caller email
   - Text Input: Assignment Group (optional)
   - Switch: Local mode
   - Button: Create Incident

2. **Container** (Incident Result)
   - Statistic: Incident Number
     - Value: `{{ createIncident.data.data.incidentNumber }}`
   - Link: Open in ServiceNow
     - URL: `{{ createIncident.data.data.incidentUrl }}`
   - Text: Priority
   - Text: Error Type

#### Tab 3: History

**Components:**

1. **Table** (Past Incidents)
   - Columns: Timestamp, Error Type, Incident Number, Status
   - Data: Store in Retool DB or State

## Advanced Features

### Feature 1: Auto-Complete Error Patterns

```javascript
// In a Select component
{{ [
  "System.NullPointerException: Attempt to de-reference a null object",
  "System.LimitException: Too many SOQL queries: 101",
  "System.DmlException: Insert failed",
  "TypeError: Cannot read property 'name' of undefined"
] }}
```

### Feature 2: Real-time Validation

```javascript
// In errorInput's validation
{{ errorInput.value.length < 10 ? "Error message too short" : "" }}
```

### Feature 3: Status Indicator

```javascript
// Add a Status Text component
{{
  createIncident.isFetching ? "Creating incident..." :
  createIncident.data ? "✓ Incident created" :
  createIncident.error ? "✗ Error occurred" :
  "Ready"
}}
```

### Feature 4: Conditional Rendering

```javascript
// Show incident details only after creation
{{ createIncident.data !== null }}
```

## Event Handlers

### On Analyze Success

```javascript
// Show success notification
utils.showNotification({
  title: "Analysis Complete",
  description: `Found ${analyzeError.data.data.relevantFiles.length} relevant files`,
  notificationType: "success"
});

// Auto-scroll to results
resultsContainer.scrollIntoView();
```

### On Create Incident Success

```javascript
// Show success with incident number
utils.showNotification({
  title: "Incident Created",
  description: `Incident ${createIncident.data.data.incidentNumber} created successfully`,
  notificationType: "success",
  duration: 5000
});

// Copy incident URL to clipboard
utils.copyToClipboard(createIncident.data.data.incidentUrl);

// Clear form
errorInput.setValue("");
```

### On Error

```javascript
// Show error notification
utils.showNotification({
  title: "Error",
  description: createIncident.error.message || "An error occurred",
  notificationType: "error"
});
```

## Complete Example App

### Step-by-Step Setup

#### 1. Add Components

Drag and drop these components:

```
[Container: mainContainer]
├── [Text] Title: "Error Analyzer"
├── [Divider]
├── [Container: inputSection]
│   ├── [TextArea] errorInput
│   ├── [TextInput] callerInput
│   ├── [Switch] localModeSwitch
│   └── [Container: buttonRow]
│       ├── [Button] analyzeButton
│       └── [Button] createIncidentButton
├── [Divider]
└── [Tabs: resultsTabs]
    ├── [Tab: Analysis]
    │   └── [JSONEditor] analysisResults
    └── [Tab: Incident]
        └── [Container] incidentDetails
```

#### 2. Configure Queries

Add these queries as shown in Step 3 above.

#### 3. Link Components to Queries

**Analyze Button:**
- Primary action: Run `analyzeError`
- Success handler: Show notification
- Loading text: "Analyzing..."

**Create Incident Button:**
- Primary action: Run `createIncident`
- Success handler: Show notification with incident number
- Disabled: `{{ !errorInput.value || !callerInput.value }}`

**Results Display:**
```javascript
// In analysisResults component
{{ {
  errorType: analyzeError.data?.data?.errorInfo?.type,
  language: analyzeError.data?.data?.errorInfo?.language,
  possibleCauses: analyzeError.data?.data?.analysisResults?.[0]?.possibleCauses,
  suggestedFixes: analyzeError.data?.data?.analysisResults?.[0]?.suggestedFixes,
  bestPractices: analyzeError.data?.data?.analysisResults?.[0]?.bestPractices
} }}
```

## Workflow Automation

### Workflow 1: Error → Analysis → Incident

Create a JavaScript query:

```javascript
// Query name: analyzeAndCreateIncident

async function run() {
  try {
    // Step 1: Analyze error
    await analyzeError.trigger();

    // Step 2: Show analysis
    utils.showNotification({
      title: "Analysis Complete",
      description: `Error Type: ${analyzeError.data.data.errorInfo.type}`,
      notificationType: "info"
    });

    // Step 3: Ask user to create incident
    const shouldCreate = await utils.showModal('confirmModal');

    if (shouldCreate) {
      // Step 4: Create incident
      await createIncident.trigger();

      utils.showNotification({
        title: "Incident Created",
        description: `Incident ${createIncident.data.data.incidentNumber}`,
        notificationType: "success"
      });
    }
  } catch (error) {
    utils.showNotification({
      title: "Error",
      description: error.message,
      notificationType: "error"
    });
  }
}

return run();
```

### Workflow 2: Batch Processing

```javascript
// Process multiple errors
const errors = errorListTable.selectedRows;

for (const error of errors) {
  errorInput.setValue(error.message);
  await createIncident.trigger();
  await utils.wait(1000); // Rate limiting
}

utils.showNotification({
  title: "Batch Complete",
  description: `Processed ${errors.length} errors`,
  notificationType: "success"
});
```

## State Management

### Store Recent Analyses

```javascript
// In a Transformer or JS query
const history = localStorage.values.analysisHistory || [];

history.unshift({
  timestamp: new Date().toISOString(),
  errorType: analyzeError.data.data.errorInfo.type,
  incidentNumber: createIncident.data?.data?.incidentNumber,
  caller: callerInput.value
});

localStorage.setValue('analysisHistory', history.slice(0, 50));
```

### Display History

```javascript
// In a Table component
{{ localStorage.values.analysisHistory || [] }}
```

## Permissions & Security

### Role-Based Access

```javascript
// Show create incident button only for admins
{{ current_user.groups.includes('admin') }}
```

### Audit Logging

```javascript
// Log all incident creations
const logEntry = {
  user: current_user.email,
  action: 'create_incident',
  timestamp: new Date().toISOString(),
  incidentNumber: createIncident.data.data.incidentNumber
};

auditLogQuery.trigger({ additionalScope: { entry: logEntry } });
```

## Mobile Responsive Design

### Tips for Mobile Layout

1. Use **Mobile View** in editor
2. Stack components vertically
3. Use full-width buttons
4. Collapse detailed analysis into accordions
5. Use bottom sheets for actions

## Debugging

### Test API Connection

Add a debug panel:

```javascript
// Health Check Status
{{ healthCheck.data?.status || "Not checked" }}

// Last Error
{{ analyzeError.error?.message || createIncident.error?.message }}

// Request/Response
{{ {
  request: createIncident.metadata,
  response: createIncident.data
} }}
```

### Console Logging

```javascript
console.log('Error Input:', errorInput.value);
console.log('API Response:', analyzeError.data);
console.log('Incident Created:', createIncident.data);
```

## Performance Optimization

### 1. Debounce API Calls

```javascript
// In errorInput onChange
{{ _.debounce(() => analyzeError.trigger(), 500) }}
```

### 2. Cache Results

```javascript
const cacheKey = `analysis_${btoa(errorInput.value)}`;
const cached = localStorage.values[cacheKey];

if (cached && Date.now() - cached.timestamp < 3600000) {
  return cached.data;
}

await analyzeError.trigger();
localStorage.setValue(cacheKey, {
  data: analyzeError.data,
  timestamp: Date.now()
});
```

### 3. Lazy Loading

Load analysis details only when tab is opened.

## Deployment & Sharing

### Share App

1. Click **Share** (top right)
2. Set permissions:
   - View only
   - Can edit
   - Can use
3. Generate link
4. Share with team

### Embed in Website

```html
<iframe
  src="https://yourorg.retool.com/embedded/public/your-app-uuid"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch
2. **Loading States**: Show spinners during API calls
3. **Validation**: Validate inputs before sending
4. **Notifications**: Provide user feedback for all actions
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Security**: Never expose sensitive credentials in frontend
7. **Performance**: Cache frequent requests
8. **Documentation**: Add tooltips and help text

## Example Use Cases

### Use Case 1: Support Dashboard

**Purpose**: Support team analyzes customer-reported errors

**Features**:
- Error input from support tickets
- Quick analysis
- One-click incident creation
- History of analyzed errors

### Use Case 2: Developer Tool

**Purpose**: Developers analyze errors during development

**Features**:
- Paste stack traces
- View analysis results
- Copy suggested fixes
- Local mode for testing

### Use Case 3: Automated Monitoring

**Purpose**: Auto-analyze errors from monitoring systems

**Features**:
- Webhook receiver
- Automatic analysis
- Incident auto-creation
- Dashboard with statistics

## Troubleshooting

### CORS Errors

If you see CORS errors:

1. API has CORS enabled by default
2. Check browser console for specific error
3. Verify API URL is correct
4. Ensure Heroku app is running

### API Not Responding

1. Check API health: `curl https://your-app.herokuapp.com/api/health`
2. Verify Heroku app is awake
3. Check Retool resource configuration
4. Review query configuration

### Invalid Response

1. Check API response in Retool debugger
2. Verify request body format
3. Check required fields are provided
4. Review API logs: `heroku logs --tail`

## Complete App Template

Download or copy this Retool JSON configuration:

```json
{
  "name": "Error Analyzer Dashboard",
  "description": "Analyze errors and create ServiceNow incidents",
  "version": "1.0.0",
  "queries": [
    { "name": "healthCheck", "type": "restapi", "method": "GET", "path": "/api/health" },
    { "name": "analyzeError", "type": "restapi", "method": "POST", "path": "/api/analyze" },
    { "name": "createIncident", "type": "restapi", "method": "POST", "path": "/api/incident/create" }
  ],
  "components": [
    { "type": "textarea", "name": "errorInput", "label": "Error Message" },
    { "type": "textinput", "name": "callerInput", "label": "Your Email" },
    { "type": "switch", "name": "localModeSwitch", "label": "Local Mode" },
    { "type": "button", "name": "analyzeButton", "text": "Analyze", "event": "analyzeError" },
    { "type": "button", "name": "createButton", "text": "Create Incident", "event": "createIncident" }
  ]
}
```

## Resources

- [Retool Documentation](https://docs.retool.com/)
- [Retool University](https://docs.retool.com/docs/retool-university)
- [REST API Integration](https://docs.retool.com/docs/rest-api)

## Next Steps

1. Create Retool account
2. Add Error Analyzer API as resource
3. Build basic UI with input and buttons
4. Test analyze and create incident flows
5. Enhance UI with advanced features
6. Share with your team

Your Retool app is ready to use! 🎉
