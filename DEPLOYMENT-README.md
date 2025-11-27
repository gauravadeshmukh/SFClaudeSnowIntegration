# Complete Deployment Guide

## 🚀 Quick Overview

This Error Analyzer system is now fully **production-ready** and can be deployed to Heroku, tested with Postman, and integrated with Retool.

## 📦 What's Included

### Core Application Files
- `api-server.js` - REST API server (Heroku-compatible)
- `error-analyzer.js` - Error analysis engine
- `servicenow-integration.js` - ServiceNow incident creation
- `create-incident.js` - CLI for creating incidents
- `cli.js` - Interactive error analysis CLI

### Deployment Files
- **`Procfile`** - Heroku process file
- **`app.json`** - Heroku app configuration
- **`package.json`** - Node.js dependencies (updated for Heroku)
- **`.gitignore`** - Protects sensitive files

### Documentation
- **`HEROKU-DEPLOYMENT.md`** - Complete Heroku deployment guide
- **`POSTMAN-GUIDE.md`** - Postman testing guide
- **`RETOOL-INTEGRATION.md`** - Retool integration guide
- **`API-DOCUMENTATION.md`** - API reference
- **`SERVICENOW-INTEGRATION.md`** - ServiceNow setup guide

### Testing & Integration
- **`Error-Analyzer-API.postman_collection.json`** - Postman collection
- **`test-api-client.js`** - API test suite
- **`test-analyzer.js`** - Core functionality tests

## 🎯 Deployment Options

### Option 1: Heroku (Recommended)

**Time to Deploy**: ~5 minutes

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-app-name

# 3. Set environment variables (if using ServiceNow)
heroku config:set SNOW_INSTANCE=your-instance.service-now.com
heroku config:set SNOW_USERNAME=your-username
heroku config:set SNOW_PASSWORD=your-password

# 4. Deploy
git push heroku master

# 5. Open app
heroku open /api/health
```

**Your API is live at**: `https://your-app-name.herokuapp.com`

**Full Guide**: See [HEROKU-DEPLOYMENT.md](HEROKU-DEPLOYMENT.md)

### Option 2: Local Development

```bash
# 1. Start server
node api-server.js

# 2. Test
curl http://localhost:3000/api/health

# 3. Use Postman or any HTTP client
```

### Option 3: Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "api-server.js", "--host", "0.0.0.0"]
```

```bash
docker build -t error-analyzer .
docker run -p 3000:3000 error-analyzer
```

## 🔧 Configuration

### Environment Variables

The API supports configuration via environment variables (perfect for Heroku):

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No (Heroku sets this) | 3000 |
| `HOST` | Server host | No | localhost |
| `SNOW_INSTANCE` | ServiceNow instance URL | No | - |
| `SNOW_USERNAME` | ServiceNow username | No | - |
| `SNOW_PASSWORD` | ServiceNow password | No | - |
| `DEFAULT_REPO` | Default GitHub repository | No | agentforcedemo |

### Local Configuration File

Alternatively, use `servicenow-config.json`:

```json
{
  "instanceUrl": "your-instance.service-now.com",
  "username": "your-username",
  "password": "your-password"
}
```

**Priority**: Environment variables override config file.

## 📊 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-app.herokuapp.com/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy"
}
```

### 2. Analyze Error

```bash
curl -X POST https://your-app.herokuapp.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"error": "System.NullPointerException at line 45"}'
```

### 3. Create Incident

```bash
curl -X POST https://your-app.herokuapp.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101",
    "caller": "developer@company.com",
    "localOnly": true
  }'
```

## 🧪 Using Postman

### Quick Start

1. **Import Collection**
   - Open Postman
   - Import `Error-Analyzer-API.postman_collection.json`

2. **Set Variables**
   - Update `herokuUrl` to your Heroku app URL
   - Example: `https://your-app-name.herokuapp.com`

3. **Test Endpoints**
   - Run "Health Check"
   - Try "Analyze Error"
   - Test "Create Incident"

**Full Guide**: See [POSTMAN-GUIDE.md](POSTMAN-GUIDE.md)

## 🛠️ Retool Integration

### Quick Start

1. **Add Resource**
   - In Retool, add REST API resource
   - Base URL: `https://your-app-name.herokuapp.com`

2. **Create Queries**
   - POST `/api/analyze` - Analyze errors
   - POST `/api/incident/create` - Create incidents

3. **Build UI**
   - Text Area for error input
   - Button to trigger analysis
   - JSON viewer for results

**Full Guide**: See [RETOOL-INTEGRATION.md](RETOOL-INTEGRATION.md)

## 🎉 Complete Workflow Example

### Scenario: Production Error Occurred

**Step 1**: Error occurs in production
```
System.LimitException: Too many SOQL queries: 101
Class.AccountDataProcessor.processRecords: line 156
```

**Step 2**: Use API to analyze
```bash
curl -X POST https://your-app.herokuapp.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"error": "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156"}'
```

**Step 3**: Review analysis
- Error Type: LimitException
- Possible Causes: 5 identified
- Suggested Fixes: 5 solutions
- Best Practices: 8 recommendations

**Step 4**: Create incident
```bash
curl -X POST https://your-app.herokuapp.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries: 101",
    "caller": "oncall@company.com"
  }'
```

**Step 5**: Incident created
- Incident Number: INC0012345
- Priority: 1 (Critical)
- Attached: Comprehensive analysis report
- URL: Direct link to incident

**Step 6**: Resolve
- Review suggested fixes in attached report
- Implement solution
- Update incident

## 📈 API Endpoints Summary

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/health` | GET | Check API status | No |
| `/api/status` | GET | Get configuration | No |
| `/api/analyze` | POST | Analyze error | No |
| `/api/incident/create` | POST | Create incident | No |

**Full API Reference**: See [API-DOCUMENTATION.md](API-DOCUMENTATION.md)

## 🔒 Security Considerations

### Production Checklist

- [ ] Set ServiceNow credentials via environment variables
- [ ] Never commit `servicenow-config.json` to git
- [ ] Use HTTPS (automatically on Heroku)
- [ ] Consider adding API key authentication
- [ ] Review ServiceNow user permissions
- [ ] Monitor API usage
- [ ] Set up error alerting

### Adding Authentication (Optional)

```javascript
// In api-server.js
const API_KEY = process.env.API_KEY;

// Add to request handler
if (req.headers['x-api-key'] !== API_KEY) {
  return sendError(res, 401, 'Unauthorized');
}
```

Then set:
```bash
heroku config:set API_KEY=your-secret-key
```

## 📊 Monitoring

### Heroku Logs

```bash
# Real-time logs
heroku logs --tail

# Last 100 lines
heroku logs -n 100

# Filter by app
heroku logs --source app
```

### Health Monitoring

Use services like:
- **UptimeRobot**: Ping `/api/health` every 5 minutes
- **Pingdom**: Monitor API availability
- **New Relic**: APM monitoring (Heroku add-on)

## 🆘 Troubleshooting

### API Not Responding

1. Check Heroku status:
   ```bash
   heroku ps
   ```

2. Check logs:
   ```bash
   heroku logs --tail
   ```

3. Restart app:
   ```bash
   heroku restart
   ```

### ServiceNow Incidents Not Creating

1. Verify environment variables:
   ```bash
   heroku config | grep SNOW
   ```

2. Test in local mode first:
   ```json
   {"localOnly": true}
   ```

3. Check ServiceNow permissions

### Common Error Codes

- **H10**: App crashed - Check logs
- **H12**: Request timeout - API call too slow
- **H14**: No web processes running - Check Procfile
- **503**: App unavailable - Dyno sleeping (free tier)

## 💰 Cost Considerations

### Heroku Free Tier

- 550-1000 dyno hours/month (FREE)
- Apps sleep after 30 min inactivity
- 10,000 rows in Postgres (if added)

### Upgrade Options

- **Hobby**: $7/month - No sleeping
- **Standard**: $25/month - Better performance
- **Performance**: $250+/month - High traffic

## 🔄 Continuous Deployment

### GitHub Integration

1. **Connect Repository**
   ```bash
   # In Heroku Dashboard
   Deploy → GitHub → Connect Repository
   ```

2. **Enable Auto-Deploy**
   - Enable automatic deploys from `main` branch
   - Optionally enable CI (wait for tests)

3. **Push Updates**
   ```bash
   git push origin main
   # Auto-deploys to Heroku
   ```

### Manual Deploy

```bash
git push heroku master
```

## 📚 Additional Resources

### Documentation
- [API Documentation](API-DOCUMENTATION.md)
- [ServiceNow Integration](SERVICENOW-INTEGRATION.md)
- [Heroku Deployment](HEROKU-DEPLOYMENT.md)
- [Postman Guide](POSTMAN-GUIDE.md)
- [Retool Integration](RETOOL-INTEGRATION.md)

### Quick Links
- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Postman Learning](https://learning.postman.com/)
- [Retool Documentation](https://docs.retool.com/)

## ✅ Post-Deployment Checklist

After deploying, verify:

- [ ] Health endpoint responds: `curl /api/health`
- [ ] Analyze endpoint works: Test with Postman
- [ ] Incident creation works: Test in local mode
- [ ] ServiceNow integration works (if configured)
- [ ] Logs are accessible: `heroku logs --tail`
- [ ] Environment variables set correctly
- [ ] Monitoring configured (UptimeRobot, etc.)
- [ ] Team has access to Heroku dashboard
- [ ] Postman collection shared with team
- [ ] Retool dashboard created (if using)
- [ ] Documentation shared with team

## 🎓 Next Steps

1. **Deploy to Heroku** using [HEROKU-DEPLOYMENT.md](HEROKU-DEPLOYMENT.md)
2. **Test with Postman** using [POSTMAN-GUIDE.md](POSTMAN-GUIDE.md)
3. **Build Retool UI** using [RETOOL-INTEGRATION.md](RETOOL-INTEGRATION.md)
4. **Configure ServiceNow** using [SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md)
5. **Integrate with your app** using [API-DOCUMENTATION.md](API-DOCUMENTATION.md)

## 🎉 You're Ready!

Your Error Analyzer API is production-ready and can be deployed immediately. Choose your deployment method and follow the corresponding guide.

**Need Help?**
- Review the comprehensive documentation
- Check troubleshooting sections
- Test locally first before deploying

**Happy Deploying! 🚀**
