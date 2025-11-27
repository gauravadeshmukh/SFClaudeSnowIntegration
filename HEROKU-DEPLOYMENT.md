# Heroku Deployment Guide

## Overview

This guide walks you through deploying the Error Analyzer API to Heroku, a cloud platform that makes it easy to deploy, manage, and scale applications.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Installed on your machine

## Quick Deploy (One-Click)

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Click the button above to deploy with one click. You'll be prompted to set environment variables.

## Manual Deployment

### Step 1: Login to Heroku

```bash
heroku login
```

This opens your browser for authentication.

### Step 2: Create Heroku Application

```bash
# Navigate to your project directory
cd ClaudeCode-Demo2

# Create a new Heroku app
heroku create your-app-name

# Or let Heroku generate a name
heroku create
```

### Step 3: Set Environment Variables

#### Required for ServiceNow Integration:

```bash
heroku config:set SNOW_INSTANCE=your-instance.service-now.com
heroku config:set SNOW_USERNAME=your-username
heroku config:set SNOW_PASSWORD=your-password
```

#### Optional Configuration:

```bash
# Default GitHub repository
heroku config:set DEFAULT_REPO=https://github.com/yourorg/yourrepo

# ServiceNow API version
heroku config:set SNOW_API_VERSION=v1

# Default assignment group
heroku config:set SNOW_DEFAULT_GROUP=group-sys-id
```

### Step 4: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 5: Deploy to Heroku

```bash
# Add Heroku remote
heroku git:remote -a your-app-name

# Push to Heroku
git push heroku master
```

### Step 6: Verify Deployment

```bash
# Open your app in browser
heroku open

# Or check specific endpoint
curl https://your-app-name.herokuapp.com/api/health

# View logs
heroku logs --tail
```

## Configuration

### Environment Variables

View all config vars:
```bash
heroku config
```

Set individual variables:
```bash
heroku config:set KEY=VALUE
```

Remove variables:
```bash
heroku config:unset KEY
```

### Complete Environment Variables List

```bash
# ServiceNow Configuration
SNOW_INSTANCE=dev12345.service-now.com
SNOW_USERNAME=integration.user
SNOW_PASSWORD=your-password-or-token
SNOW_API_VERSION=v1
SNOW_DEFAULT_GROUP=abc123xyz

# Application Configuration
DEFAULT_REPO=https://github.com/yourorg/yourrepo
HOST=0.0.0.0
PORT=# Automatically set by Heroku
```

## Scaling

### View Current Dynos

```bash
heroku ps
```

### Scale Dynos

```bash
# Scale web dyno
heroku ps:scale web=1

# Scale to multiple dynos (requires paid plan)
heroku ps:scale web=2
```

## Monitoring

### View Logs

```bash
# Real-time logs
heroku logs --tail

# Last 100 lines
heroku logs -n 100

# Filter by source
heroku logs --source app
```

### Metrics (requires Heroku Dashboard)

Visit your app dashboard: `https://dashboard.heroku.com/apps/your-app-name`

- Response time
- Throughput
- Memory usage
- Error rate

## Testing Your Deployment

### Using cURL

```bash
# Health check
curl https://your-app-name.herokuapp.com/api/health

# Analyze error
curl -X POST https://your-app-name.herokuapp.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"error": "System.NullPointerException at line 45"}'

# Create incident (local mode)
curl -X POST https://your-app-name.herokuapp.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d '{
    "error": "System.LimitException: Too many SOQL queries",
    "caller": "developer@company.com",
    "localOnly": true
  }'
```

### Using Postman

1. Import the collection: `Error-Analyzer-API.postman_collection.json`
2. Update the `herokuUrl` variable to your Heroku app URL
3. Test all endpoints

## Troubleshooting

### Application Crashes

```bash
# View crash logs
heroku logs --tail

# Restart app
heroku restart

# Check dyno status
heroku ps
```

### Common Issues

#### 1. Application Error (H10)

**Cause**: App failed to bind to PORT

**Solution**: Ensure api-server.js reads `process.env.PORT`

```bash
# Check if PORT is in your code
heroku config
```

#### 2. Build Failed

**Cause**: Missing dependencies or build errors

**Solution**: Check your package.json

```bash
# View build logs
heroku logs --tail

# Verify package.json has correct scripts
cat package.json
```

#### 3. ServiceNow Not Working

**Cause**: Environment variables not set

**Solution**:
```bash
# Check ServiceNow config
heroku config | grep SNOW

# Set missing variables
heroku config:set SNOW_INSTANCE=your-instance.service-now.com
```

#### 4. Request Timeout (H12)

**Cause**: GitHub API or ServiceNow API taking too long

**Solution**: Requests timeout after 30 seconds on free tier. Consider:
- Using local mode for testing
- Upgrading to paid tier
- Optimizing code

### Debug Mode

Enable detailed logging:

```bash
# View all logs
heroku logs --tail

# Filter by level
heroku logs --tail | grep Error
```

## Updating Your Application

### Deploy Updates

```bash
# Make changes to your code
git add .
git commit -m "Update message"
git push heroku master
```

### Rollback

```bash
# View releases
heroku releases

# Rollback to previous version
heroku rollback
```

## Security Best Practices

### 1. Use Environment Variables

Never commit credentials:
```bash
# Set via Heroku CLI
heroku config:set SNOW_PASSWORD=your-password
```

### 2. Enable HTTPS

Heroku provides HTTPS by default on `*.herokuapp.com` domains.

### 3. Add Authentication (Optional)

Consider adding API key authentication for production:

```javascript
// In api-server.js
const API_KEY = process.env.API_KEY;

if (req.headers['x-api-key'] !== API_KEY) {
  return sendError(res, 401, 'Unauthorized');
}
```

Then set:
```bash
heroku config:set API_KEY=your-secret-key
```

### 4. Rate Limiting

Consider adding rate limiting for production use.

## Cost Optimization

### Free Tier Limits

- 550-1000 dyno hours/month (free)
- Apps sleep after 30 min of inactivity
- 30-second request timeout

### Keep App Awake (Free)

Use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 25 minutes.

### Upgrade Options

```bash
# View available dynos
heroku ps:type

# Upgrade to hobby ($7/month)
heroku ps:type hobby
```

## Custom Domain (Optional)

### Add Custom Domain

```bash
# Add domain
heroku domains:add www.yourdomain.com

# View DNS targets
heroku domains

# Configure DNS with your provider
# CNAME: www -> your-app-name.herokuapp.com
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Heroku

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "your-app-name"
          heroku_email: "your-email@example.com"
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
deploy:
  stage: deploy
  script:
    - apt-get update -qy
    - apt-get install -y ruby-dev
    - gem install dpl
    - dpl --provider=heroku --app=your-app-name --api-key=$HEROKU_API_KEY
  only:
    - main
```

## Backup and Restore

### Backup Configuration

```bash
# Save current config
heroku config -s > heroku.env

# Restore config
cat heroku.env | xargs heroku config:set
```

## Monitoring with Add-ons

### Papertrail (Logging)

```bash
heroku addons:create papertrail:chopper
heroku addons:open papertrail
```

### New Relic (APM)

```bash
heroku addons:create newrelic:wayne
heroku addons:open newrelic
```

## Advanced Configuration

### Buildpacks

View buildpacks:
```bash
heroku buildpacks
```

Add custom buildpack:
```bash
heroku buildpacks:add heroku/nodejs
```

### Procfile Customization

Your current `Procfile`:
```
web: node api-server.js --host 0.0.0.0 --port $PORT
```

Multiple processes:
```
web: node api-server.js
worker: node background-worker.js
```

### Runtime

Specify Node.js version in `package.json`:
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

## Performance Tips

### 1. Enable HTTP/2

Already enabled on Heroku's routing layer.

### 2. Caching

GitHub API responses are already cached for 15 minutes.

### 3. Compression

Consider adding compression:

```bash
npm install compression --save
```

### 4. Keep-Alive

Already enabled in Node.js http module.

## Getting Help

### Heroku Resources

- [Heroku Dev Center](https://devcenter.heroku.com/)
- [Heroku Status](https://status.heroku.com/)
- [Heroku Support](https://help.heroku.com/)

### Application Support

- Check logs: `heroku logs --tail`
- Check status: `heroku ps`
- Restart: `heroku restart`

## Complete Deployment Checklist

- [ ] Install Heroku CLI
- [ ] Login to Heroku: `heroku login`
- [ ] Create app: `heroku create your-app-name`
- [ ] Set environment variables (ServiceNow credentials)
- [ ] Initialize git repository
- [ ] Deploy: `git push heroku master`
- [ ] Verify: `heroku open /api/health`
- [ ] Test with Postman
- [ ] Monitor logs: `heroku logs --tail`
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring (optional)
- [ ] Enable auto-deploy from GitHub (optional)

## Example: Complete Deployment

```bash
# 1. Login
heroku login

# 2. Create app
heroku create error-analyzer-api

# 3. Set config
heroku config:set SNOW_INSTANCE=dev12345.service-now.com
heroku config:set SNOW_USERNAME=integration.user
heroku config:set SNOW_PASSWORD=your-password
heroku config:set DEFAULT_REPO=https://github.com/yourorg/yourrepo

# 4. Deploy
git init
git add .
git commit -m "Initial deployment"
git push heroku master

# 5. Open app
heroku open /api/health

# 6. View logs
heroku logs --tail
```

## Next Steps

1. Deploy to Heroku using this guide
2. Test with Postman (see POSTMAN-GUIDE.md)
3. Integrate with Retool (see RETOOL-INTEGRATION.md)
4. Set up monitoring and alerts
5. Configure CI/CD for automatic deployments

Your app is now live at: `https://your-app-name.herokuapp.com`

Test it: `curl https://your-app-name.herokuapp.com/api/health`
