# Error Analyzer API Documentation

## Overview

REST API server for error analysis and ServiceNow incident creation. No external dependencies required - uses only Node.js built-in modules.

## Quick Start

### 1. Start the API Server

```bash
node api-server.js
```

Server will start at `http://localhost:3000`

### 2. Test the API

```bash
# Health check
curl http://localhost:3000/api/health

# Create incident
curl -X POST http://localhost:3000/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{"error": "System.NullPointerException at line 45", "caller": "user@example.com", "localOnly": true}'
```

## API Endpoints

### Health Check

**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy",
  "timestamp": "2025-11-26T20:00:00.000Z",
  "servicenow": {
    "configured": true,
    "instance": "dev12345.service-now.com"
  },
  "defaultRepository": "https://github.com/gauravadeshmukh/agentforcedemo/tree/master"
}
```

### API Status

**GET** `/api/status`

Get API configuration and available endpoints.

**Response:**
```json
{
  "success": true,
  "api": {
    "version": "1.0.0",
    "host": "localhost",
    "port": 3000
  },
  "servicenow": {
    "configured": true,
    "instance": "dev12345.service-now.com",
    "mode": "ServiceNow"
  },
  "repository": {
    "default": "https://github.com/gauravadeshmukh/agentforcedemo/tree/master"
  },
  "endpoints": [...]
}
```

### Analyze Error

**POST** `/api/analyze`

Analyze an error without creating a ServiceNow incident.

**Request Body:**
```json
{
  "error": "System.LimitException: Too many SOQL queries: 101",
  "repo": "https://github.com/user/repo" // Optional
}
```

**Parameters:**
- `error` or `errorMessage` (string, required): Error message to analyze
- `repo` or `repository` (string, optional): GitHub repository URL

**Response:**
```json
{
  "success": true,
  "message": "Error analysis completed",
  "data": {
    "errorInfo": {
      "type": "LimitException",
      "message": "Too many SOQL queries: 101",
      "fileName": null,
      "lineNumber": null,
      "language": "apex"
    },
    "repository": {
      "owner": "gauravadeshmukh",
      "name": "agentforcedemo",
      "branch": "master"
    },
    "relevantFiles": [
      {
        "path": "force-app/main/default/classes/AccountTriggerHandler.cls",
        "priority": 3,
        "reason": "Same language file"
      }
    ],
    "analysisResults": [
      {
        "filePath": "force-app/main/default/classes/AccountTriggerHandler.cls",
        "errorType": "LimitException",
        "possibleCauses": [
          "Too many SOQL queries in a single transaction",
          "Too many DML statements",
          ...
        ],
        "suggestedFixes": [
          "Move SOQL queries outside of loops",
          "Bulkify your code to handle multiple records",
          ...
        ],
        "bestPractices": [
          "Always write bulkified code",
          "Use collections to batch DML operations",
          ...
        ]
      }
    ]
  }
}
```

### Create Incident

**POST** `/api/incident/create`

Analyze error and create ServiceNow incident (or save report locally).

**Request Body:**
```json
{
  "error": "System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12",
  "caller": "developer@company.com",
  "repo": "https://github.com/user/repo",
  "assignmentGroup": "group_sys_id",
  "localOnly": false
}
```

**Parameters:**
- `error` or `errorMessage` (string, required): Error message to analyze
- `caller` (string, required for ServiceNow): Email or user ID
- `repo` or `repository` (string, optional): GitHub repository URL
- `assignmentGroup` (string, optional): ServiceNow assignment group sys_id
- `localOnly` (boolean, optional): If true, saves report locally instead of creating incident

**Response (Local Mode):**
```json
{
  "success": true,
  "message": "Report saved locally",
  "data": {
    "mode": "local",
    "success": true,
    "reportFile": "error_analysis_1234567890.txt",
    "reportPath": "C:\\path\\to\\error_analysis_1234567890.txt",
    "reportSize": 5780,
    "errorType": "NullPointerException",
    "language": "apex",
    "relevantFiles": 10
  }
}
```

**Response (ServiceNow Mode):**
```json
{
  "success": true,
  "message": "ServiceNow incident created",
  "data": {
    "mode": "servicenow",
    "success": true,
    "incidentNumber": "INC0012345",
    "incidentSysId": "abc123xyz789",
    "incidentUrl": "https://dev12345.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123xyz789",
    "reportFile": "error_analysis_INC0012345_1234567890.txt",
    "priority": "1",
    "errorType": "LimitException",
    "language": "apex",
    "relevantFiles": 10
  }
}
```

## Error Responses

All endpoints return standard error format:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created (incident created)
- `400` - Bad Request (missing required fields)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error

## Usage Examples

### cURL Examples

#### Health Check
```bash
curl http://localhost:3000/api/health
```

#### Analyze Error
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "TypeError: Cannot read property \"name\" of undefined"
  }'
```

#### Create Incident (Local Mode)
```bash
curl -X POST http://localhost:3000/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101",
    "caller": "developer@company.com",
    "localOnly": true
  }'
```

#### Create Incident (ServiceNow Mode)
```bash
curl -X POST http://localhost:3000/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException at line 45",
    "caller": "developer@company.com",
    "assignmentGroup": "abc123"
  }'
```

### JavaScript Examples

#### Using Fetch API
```javascript
// Analyze error
const analyzeError = async (errorMessage) => {
  const response = await fetch('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      error: errorMessage
    })
  });

  const result = await response.json();
  console.log(result);
  return result;
};

// Create incident
const createIncident = async (errorMessage, caller) => {
  const response = await fetch('http://localhost:3000/api/incident/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      error: errorMessage,
      caller: caller,
      localOnly: false
    })
  });

  const result = await response.json();
  console.log(`Incident created: ${result.data.incidentNumber}`);
  return result;
};
```

#### Using Axios
```javascript
const axios = require('axios');

// Analyze error
const analyzeError = async (errorMessage) => {
  try {
    const response = await axios.post('http://localhost:3000/api/analyze', {
      error: errorMessage
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Create incident
const createIncident = async (errorMessage, caller) => {
  try {
    const response = await axios.post('http://localhost:3000/api/incident/create', {
      error: errorMessage,
      caller: caller
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};
```

#### Using Node.js http module
```javascript
const http = require('http');

const createIncident = (errorMessage, caller) => {
  const data = JSON.stringify({
    error: errorMessage,
    caller: caller,
    localOnly: true
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/incident/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      const result = JSON.parse(responseData);
      console.log('Result:', result);
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
};

createIncident('System.NullPointerException at line 45', 'user@example.com');
```

### Python Example

```python
import requests
import json

def create_incident(error_message, caller, local_only=True):
    url = 'http://localhost:3000/api/incident/create'

    payload = {
        'error': error_message,
        'caller': caller,
        'localOnly': local_only
    }

    headers = {
        'Content-Type': 'application/json'
    }

    response = requests.post(url, data=json.dumps(payload), headers=headers)
    result = response.json()

    if result['success']:
        print(f"Incident created: {result['data']['incidentNumber']}")
    else:
        print(f"Error: {result['error']}")

    return result

# Usage
create_incident(
    'System.LimitException: Too many SOQL queries: 101',
    'developer@company.com',
    local_only=True
)
```

## Server Configuration

### Command Line Options

```bash
node api-server.js [options]

Options:
  --port <number>     Port to listen on (default: 3000)
  --host <string>     Host to bind to (default: localhost)
  --config <path>     Path to ServiceNow config (default: servicenow-config.json)
  --repo <url>        Default GitHub repository URL
  --help, -h          Show help message
```

### Examples

```bash
# Start on different port
node api-server.js --port 8080

# Bind to all interfaces
node api-server.js --host 0.0.0.0 --port 3000

# Custom ServiceNow config
node api-server.js --config ./my-snow-config.json

# Custom default repository
node api-server.js --repo https://github.com/myorg/myrepo
```

### Environment Variables

You can also configure via environment variables:

```bash
export API_PORT=8080
export API_HOST=0.0.0.0
export SNOW_CONFIG_PATH=./servicenow-config.json
export DEFAULT_REPO=https://github.com/user/repo

node api-server.js
```

## Integration Examples

### Express.js Application

```javascript
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Error handling middleware
app.use(async (err, req, res, next) => {
  console.error('Application error:', err);

  // Create incident via API
  try {
    await axios.post('http://localhost:3000/api/incident/create', {
      error: `${err.stack}\n\nRequest: ${req.method} ${req.path}`,
      caller: req.user?.email || 'system@company.com',
      localOnly: process.env.NODE_ENV !== 'production'
    });
  } catch (apiError) {
    console.error('Failed to create incident:', apiError.message);
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(4000);
```

### Lambda Function

```javascript
const https = require('https');

exports.handler = async (event) => {
  const error = event.error;

  const data = JSON.stringify({
    error: error,
    caller: 'lambda@company.com',
    localOnly: false
  });

  const options = {
    hostname: 'your-api-server.com',
    port: 3000,
    path: '/api/incident/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};
```

### Webhook Integration

```javascript
// Receive webhooks and create incidents
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

app.post('/webhook/error', async (req, res) => {
  const { error, source, user } = req.body;

  try {
    const result = await axios.post('http://localhost:3000/api/incident/create', {
      error: error,
      caller: user || 'webhook@company.com'
    });

    res.json({
      success: true,
      incidentNumber: result.data.data.incidentNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(5000);
```

## CORS Support

The API has CORS enabled by default, allowing requests from any origin. This can be disabled in the configuration.

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider adding:
- Rate limiting middleware
- Authentication
- Request validation
- Logging

## Security Considerations

1. **Authentication**: Add authentication for production use
2. **HTTPS**: Use HTTPS in production
3. **Input Validation**: All inputs are validated
4. **Error Handling**: Errors don't expose sensitive information
5. **Config Security**: Keep ServiceNow config secure

## Production Deployment

### Using PM2

```bash
npm install -g pm2

# Start server
pm2 start api-server.js --name error-analyzer-api

# Start with custom config
pm2 start api-server.js --name error-analyzer-api -- --port 8080

# Monitor
pm2 monit

# Logs
pm2 logs error-analyzer-api

# Auto-restart on file changes
pm2 start api-server.js --watch
```

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY *.js ./
COPY *.json ./

EXPOSE 3000

CMD ["node", "api-server.js", "--host", "0.0.0.0"]
```

```bash
docker build -t error-analyzer-api .
docker run -p 3000:3000 error-analyzer-api
```

### Using systemd

```ini
[Unit]
Description=Error Analyzer API
After=network.target

[Service]
Type=simple
User=nodeuser
WorkingDirectory=/opt/error-analyzer
ExecStart=/usr/bin/node api-server.js --port 3000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Monitoring

### Health Check Endpoint

Use `/api/health` for monitoring:

```bash
# Simple uptime monitoring
while true; do
  curl -s http://localhost:3000/api/health | jq .status
  sleep 30
done
```

### Logging

All requests are logged to console:
```
[API] POST /api/incident/create
[API] Analysis completed. Error Type: LimitException
[API] Incident created: INC0012345
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
node api-server.js --port 8080
```

### ServiceNow Not Configured

If `servicenow-config.json` doesn't exist, API runs in local-only mode. All incidents are saved as text files.

### Connection Refused

- Check if server is running
- Verify port and host settings
- Check firewall rules

## Next Steps

1. Start the API server: `node api-server.js`
2. Test with health check: `curl http://localhost:3000/api/health`
3. Try creating an incident: Use the cURL examples above
4. Integrate with your application
5. Deploy to production

## Support

For issues or questions:
- Check the main [README.md](README.md)
- Review [SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md)
- Test with `--help` flag
