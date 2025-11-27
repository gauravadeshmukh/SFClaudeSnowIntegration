# Deploy to Heroku - Step by Step Guide

## 🚀 Quick Deploy (Windows)

### Option 1: Automated Script

1. **Run the deployment script:**
   ```cmd
   deploy-to-heroku.bat
   ```

The script will:
- Check if Heroku CLI is installed
- Login to Heroku
- Initialize Git repository
- Create Heroku app
- Configure environment variables
- Deploy your application

### Option 2: Manual Deployment

If you prefer manual control, follow these steps:

## 📋 Prerequisites

### Step 1: Install Heroku CLI

**Download and Install:**
1. Visit: https://devcenter.heroku.com/articles/heroku-cli
2. Download Heroku CLI for Windows
3. Run the installer
4. Restart your terminal/command prompt

**Verify Installation:**
```cmd
heroku --version
```

### Step 2: Login to Heroku

```cmd
heroku login
```

This will open your browser for authentication.

## 🔧 Deployment Steps

### Step 1: Initialize Git Repository

```cmd
cd "C:\Workspace\NodeJs\New folder\ClaudeCode-Demo2"
git init
git add .
git commit -m "Initial deployment to Heroku"
```

### Step 2: Create Heroku Application

**Option A: Random app name**
```cmd
heroku create
```

**Option B: Custom app name**
```cmd
heroku create your-app-name
```

**Note:** App names must be unique across all of Heroku.

### Step 3: Configure Environment Variables (Optional)

**For ServiceNow Integration:**
```cmd
heroku config:set SNOW_INSTANCE=your-instance.service-now.com
heroku config:set SNOW_USERNAME=your-username
heroku config:set SNOW_PASSWORD=your-password
```

**For Custom Repository:**
```cmd
heroku config:set DEFAULT_REPO=https://github.com/yourorg/yourrepo
```

**View Configuration:**
```cmd
heroku config
```

### Step 4: Deploy to Heroku

```cmd
git push heroku master
```

**If you get an error about main branch:**
```cmd
git push heroku main
```

### Step 5: Verify Deployment

**Open your app:**
```cmd
heroku open /api/health
```

**Or visit manually:**
```
https://your-app-name.herokuapp.com/api/health
```

**Check logs:**
```cmd
heroku logs --tail
```

## ✅ Verify Deployment

### Test 1: Health Check

```cmd
curl https://your-app-name.herokuapp.com/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy"
}
```

### Test 2: Analyze Error

```cmd
curl -X POST https://your-app-name.herokuapp.com/api/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"error\": \"System.NullPointerException at line 45\"}"
```

### Test 3: Create Incident (Local Mode)

```cmd
curl -X POST https://your-app-name.herokuapp.com/api/incident/create ^
  -H "Content-Type: application/json" ^
  -d "{\"error\": \"System.LimitException: Too many SOQL queries\", \"caller\": \"dev@company.com\", \"localOnly\": true}"
```

## 🔍 Troubleshooting

### Issue 1: Heroku CLI Not Found

**Solution:**
1. Download from: https://devcenter.heroku.com/articles/heroku-cli
2. Install and restart terminal
3. Run `heroku --version` to verify

### Issue 2: App Name Already Taken

**Solution:**
```cmd
# Let Heroku generate a random name
heroku create

# Or try a different name
heroku create my-error-analyzer-api-123
```

### Issue 3: Deployment Failed

**Solution:**
```cmd
# Check logs
heroku logs --tail

# Restart app
heroku restart

# Redeploy
git push heroku master --force
```

### Issue 4: App Crashed (H10 Error)

**Solution:**
```cmd
# Check dyno status
heroku ps

# Scale up
heroku ps:scale web=1

# Check logs for errors
heroku logs --tail
```

### Issue 5: Port Error

**Solution:**
The app is already configured to use `process.env.PORT` which Heroku sets automatically. No action needed.

## 📊 Post-Deployment

### View App Information

```cmd
# App info
heroku apps:info

# View config
heroku config

# View logs
heroku logs --tail

# Open app
heroku open

# Open dashboard
start https://dashboard.heroku.com/apps/your-app-name
```

### Manage Dynos

```cmd
# View dynos
heroku ps

# Scale dynos
heroku ps:scale web=1

# Restart app
heroku restart
```

### Update Environment Variables

```cmd
# Set variable
heroku config:set KEY=VALUE

# Unset variable
heroku config:unset KEY

# View all variables
heroku config
```

## 🔄 Update Deployment

After making code changes:

```cmd
# Add changes
git add .

# Commit changes
git commit -m "Your commit message"

# Deploy
git push heroku master
```

## 🎯 Quick Reference Commands

```cmd
# Login
heroku login

# Create app
heroku create your-app-name

# Deploy
git push heroku master

# View logs
heroku logs --tail

# Open app
heroku open

# Restart
heroku restart

# Scale
heroku ps:scale web=1

# Config
heroku config:set KEY=VALUE
```

## 🌐 Access Your API

### Your App URLs

**Base URL:**
```
https://your-app-name.herokuapp.com
```

**Health Check:**
```
https://your-app-name.herokuapp.com/api/health
```

**API Status:**
```
https://your-app-name.herokuapp.com/api/status
```

**Analyze Endpoint:**
```
POST https://your-app-name.herokuapp.com/api/analyze
```

**Create Incident:**
```
POST https://your-app-name.herokuapp.com/api/incident/create
```

## 📱 Test with Postman

1. **Import Collection:**
   - Open Postman
   - Import `Error-Analyzer-API.postman_collection.json`

2. **Update Variable:**
   - Set `herokuUrl` to: `https://your-app-name.herokuapp.com`

3. **Test All Endpoints:**
   - Health Check ✓
   - Analyze Error ✓
   - Create Incident ✓

## 🛠️ Retool Integration

1. **Add Resource:**
   - Resource Type: REST API
   - Base URL: `https://your-app-name.herokuapp.com`
   - Save

2. **Create Queries:**
   - POST `/api/analyze`
   - POST `/api/incident/create`

3. **Build UI:**
   - Add text area for error input
   - Add button to trigger analysis
   - Add JSON viewer for results

## 📈 Monitoring

### Free Monitoring Tools

**UptimeRobot:**
1. Sign up at https://uptimerobot.com
2. Add monitor for `https://your-app-name.herokuapp.com/api/health`
3. Set interval to 5 minutes
4. Get alerts via email

**Heroku Metrics:**
1. Visit dashboard: https://dashboard.heroku.com/apps/your-app-name
2. Click "Metrics" tab
3. View response time, throughput, errors

## 💰 Costs

**Free Tier:**
- 550-1000 dyno hours/month
- App sleeps after 30 minutes of inactivity
- Free!

**Keep App Awake:**
- Use UptimeRobot to ping every 25 minutes
- Or upgrade to Hobby ($7/month)

## 🎉 Success!

Your Error Analyzer API is now deployed to Heroku!

**Next Steps:**
1. ✓ Verify health endpoint works
2. ✓ Test with Postman
3. ✓ Set up monitoring
4. ✓ Share URL with team
5. ✓ Build Retool dashboard
6. ✓ Integrate with applications

## 📞 Need Help?

**Documentation:**
- API Documentation: `API-DOCUMENTATION.md`
- Heroku Guide: `HEROKU-DEPLOYMENT.md`
- Postman Guide: `POSTMAN-GUIDE.md`

**Common Commands:**
```cmd
heroku help              # Show help
heroku logs --tail       # View logs
heroku restart           # Restart app
heroku ps               # View dynos
heroku config           # View config
```

**Heroku Support:**
- Help Center: https://help.heroku.com
- Dev Center: https://devcenter.heroku.com
- Status: https://status.heroku.com

---

**Your app is live at:** `https://your-app-name.herokuapp.com`

**Test it now:**
```cmd
curl https://your-app-name.herokuapp.com/api/health
```

🚀 Happy Deploying!
