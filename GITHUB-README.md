# Salesforce Claude & ServiceNow Integration

**Intelligent Error Analysis System** - Automatically analyze errors from your Salesforce/Apex codebase against GitHub repositories and create ServiceNow incidents with comprehensive analysis and recommendations.

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/gauravadeshmukh/SFClaudeSnowIntegration)

## 🎯 Overview

This system provides:

- **🔍 Smart Error Analysis**: Automatically detects error types, file locations, and stack traces
- **🌐 GitHub Integration**: Fetches and analyzes code directly from GitHub repositories
- **💡 Intelligent Recommendations**: Provides context-aware fixes based on error type
- **🎯 Multi-Language Support**: Handles Apex, JavaScript, Java, Python errors
- **📊 Detailed Reports**: Generates comprehensive analysis reports with code snippets
- **🎫 ServiceNow Integration**: Automatically creates incidents with analysis attached
- **🚀 REST API**: Easy integration with any application
- **🔧 Production Ready**: Heroku-compatible with environment variable support

## ⚡ Quick Start

### Option 1: Deploy to Heroku (1-Click)

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/gauravadeshmukh/SFClaudeSnowIntegration)

### Option 2: Local Development

```bash
# Clone repository
git clone https://github.com/gauravadeshmukh/SFClaudeSnowIntegration.git
cd SFClaudeSnowIntegration

# Start API server
node api-server.js

# Test
curl http://localhost:3000/api/health
```

### Option 3: Manual Heroku Deploy

```bash
# Login and create app
heroku login
heroku create your-app-name

# Configure ServiceNow (optional)
heroku config:set SNOW_INSTANCE=your-instance.service-now.com
heroku config:set SNOW_USERNAME=your-username
heroku config:set SNOW_PASSWORD=your-password

# Deploy
git push heroku main
heroku open /api/health
```

## 📋 Features

### Error Analysis Engine

- Parses error messages to extract type, location, and context
- Identifies relevant files in the codebase
- Provides 3-5 possible causes
- Suggests 4-5 actionable fixes
- Recommends 6-8 best practices

### ServiceNow Integration

- Creates incidents automatically
- Sets priority based on error severity
- Attaches comprehensive analysis reports
- Adds work notes with summary
- Provides direct links to incidents

### REST API

- `GET /api/health` - Health check
- `GET /api/status` - API configuration
- `POST /api/analyze` - Analyze error
- `POST /api/incident/create` - Create ServiceNow incident

## 🎓 Usage Examples

### Analyze Error via API

```bash
curl -X POST https://your-app.herokuapp.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101"
  }'
```

### Create ServiceNow Incident

```bash
curl -X POST https://your-app.herokuapp.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.NullPointerException at line 45",
    "caller": "developer@company.com"
  }'
```

### Using JavaScript

```javascript
const response = await fetch('https://your-app.herokuapp.com/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: 'Your error message here'
  })
});

const result = await response.json();
console.log(result.data.analysisResults);
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (auto-set by Heroku) |
| `SNOW_INSTANCE` | ServiceNow instance URL | No |
| `SNOW_USERNAME` | ServiceNow username | No |
| `SNOW_PASSWORD` | ServiceNow password | No |
| `DEFAULT_REPO` | Default GitHub repository | No |

### Configuration File (Alternative)

Create `servicenow-config.json`:

```json
{
  "instanceUrl": "your-instance.service-now.com",
  "username": "your-username",
  "password": "your-password"
}
```

## 📚 Documentation

- **[START-HERE.md](START-HERE.md)** - Quick start guide
- **[DEPLOYMENT-README.md](DEPLOYMENT-README.md)** - Deployment overview
- **[HEROKU-DEPLOYMENT.md](HEROKU-DEPLOYMENT.md)** - Heroku deployment guide
- **[API-DOCUMENTATION.md](API-DOCUMENTATION.md)** - Complete API reference
- **[SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md)** - ServiceNow setup
- **[POSTMAN-GUIDE.md](POSTMAN-GUIDE.md)** - Postman testing guide
- **[RETOOL-INTEGRATION.md](RETOOL-INTEGRATION.md)** - Retool dashboard guide

## 🧪 Testing

### Run Tests

```bash
# Core functionality tests
npm test

# API tests
npm run test:api
```

### Using Postman

1. Import `Error-Analyzer-API.postman_collection.json`
2. Update `herokuUrl` variable
3. Test all endpoints

## 🛠️ Integration Options

### Retool Dashboard

Build internal tools with Retool:

1. Add REST API resource
2. Create POST queries for analyze and create incident
3. Build UI with forms and displays

### Webhook Integration

```javascript
app.post('/webhook/error', async (req, res) => {
  const response = await fetch('https://your-app.herokuapp.com/api/incident/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: req.body.error,
      caller: req.body.user
    })
  });

  const result = await response.json();
  res.json(result);
});
```

### Express.js Error Handler

```javascript
app.use(async (err, req, res, next) => {
  // Create incident for production errors
  await fetch('https://your-app.herokuapp.com/api/incident/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: err.stack,
      caller: 'system@company.com'
    })
  });

  res.status(500).json({ error: 'Internal server error' });
});
```

## 🎯 Supported Error Types

### Salesforce/Apex
- NullPointerException
- DmlException
- LimitException (Governor Limits)
- QueryException
- SyntaxError

### JavaScript
- TypeError
- ReferenceError
- SyntaxError
- RangeError

### Java & Python
- Various common exceptions

## 📊 Example Output

### Error Analysis

```json
{
  "errorInfo": {
    "type": "LimitException",
    "language": "apex",
    "message": "Too many SOQL queries: 101"
  },
  "possibleCauses": [
    "Too many SOQL queries in a single transaction",
    "Non-bulkified code in loops"
  ],
  "suggestedFixes": [
    "Move SOQL queries outside of loops",
    "Bulkify your code to handle multiple records"
  ],
  "bestPractices": [
    "Always write bulkified code",
    "Use collections to batch DML operations"
  ]
}
```

### ServiceNow Incident

```json
{
  "incidentNumber": "INC0012345",
  "incidentUrl": "https://instance.service-now.com/...",
  "priority": "1",
  "reportFile": "error_analysis_INC0012345.txt"
}
```

## 🔒 Security

- HTTPS enforced on Heroku
- Environment variables for sensitive data
- No credentials in code
- CORS enabled for API access
- Input validation on all endpoints

## 🚀 Deployment

### Heroku

```bash
heroku create
git push heroku main
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "api-server.js"]
```

## 📈 Monitoring

- Health check endpoint: `/api/health`
- Heroku logs: `heroku logs --tail`
- Use UptimeRobot or similar for uptime monitoring

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/gauravadeshmukh/SFClaudeSnowIntegration/issues)
- **Documentation**: See docs folder
- **Examples**: Check example-usage.js

## 🎉 Credits

Built with:
- Node.js (no external dependencies!)
- GitHub API
- ServiceNow REST API
- Heroku platform

## 🔗 Links

- **Repository**: https://github.com/gauravadeshmukh/SFClaudeSnowIntegration
- **Demo**: Deploy your own with the Heroku button above
- **Documentation**: See README and docs folder

---

**Made with ❤️ for better error handling and incident management**

⭐ Star this repo if you find it useful!
