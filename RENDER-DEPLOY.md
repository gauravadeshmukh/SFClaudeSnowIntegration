# Render.com Deployment Guide

## ✅ Your Code is Already Render-Ready!

Your repository includes `render.yaml` which makes deployment automatic and easy.

---

## 🚀 Deploy to Render.com (5 Minutes)

### **Method 1: Blueprint Deploy (Recommended - Automated)**

This method uses your `render.yaml` configuration automatically.

#### **Step 1: Sign Up / Login**

Visit: **https://render.com**
- Click "Get Started"
- Sign up with GitHub (easiest)
- Or use email

#### **Step 2: New Blueprint**

1. Click **"New +"** (top right)
2. Select **"Blueprint"**
3. Click **"Connect account"** to connect GitHub
4. Authorize Render to access your repositories

#### **Step 3: Select Repository**

1. Search for: `SFClaudeSnowIntegration`
2. Click **"Connect"** next to your repository
3. Render will automatically detect `render.yaml`

#### **Step 4: Configure Blueprint**

Render reads your `render.yaml` and shows:

```yaml
Service: error-analyzer-api
Type: Web Service
Plan: Starter ($7/month)
Region: Oregon
Build: Automatic
Start: node api-server.js
```

**Environment Variables (Optional):**
- Click **"Add Environment Variable"** if using ServiceNow:
  - `SNOW_INSTANCE` = your-instance.service-now.com
  - `SNOW_USERNAME` = your-username
  - `SNOW_PASSWORD` = your-password

#### **Step 5: Deploy**

1. Review configuration
2. Click **"Apply"**
3. Add payment method (Starter plan = $7/month)
4. Click **"Create Services"**

#### **Step 6: Wait for Deployment**

- Build starts automatically
- Takes 2-3 minutes
- Watch build logs in real-time
- Status changes to "Live" when ready

#### **Step 7: Test Your Deployment**

1. Your URL will be: `https://error-analyzer-api.onrender.com`
2. Click the URL
3. Add `/api/health`:
   ```
   https://error-analyzer-api.onrender.com/api/health
   ```
4. You should see:
   ```json
   {
     "success": true,
     "service": "Error Analyzer API",
     "status": "healthy"
   }
   ```

🎉 **Success! Your API is live!**

---

### **Method 2: Manual Web Service (Without Blueprint)**

If you prefer manual setup:

#### **Step 1: New Web Service**

1. Click **"New +"** → **"Web Service"**
2. Connect GitHub
3. Select repository: `SFClaudeSnowIntegration`

#### **Step 2: Configure**

```yaml
Name: error-analyzer-api
Region: Oregon (US West)
Branch: main
Root Directory: (leave empty)
Environment: Node
Build Command: (leave empty - no dependencies!)
Start Command: node api-server.js
Plan: Starter
```

#### **Step 3: Advanced Settings**

```yaml
Auto-Deploy: Yes
Health Check Path: /api/health
```

#### **Step 4: Environment Variables** (Optional)

Add if using ServiceNow:
- `SNOW_INSTANCE`
- `SNOW_USERNAME`
- `SNOW_PASSWORD`

#### **Step 5: Create Service**

- Click "Create Web Service"
- Add payment method
- Wait for deployment

---

## 💰 Render.com Pricing

| Plan | Cost | RAM | CPU | Features |
|------|------|-----|-----|----------|
| **Free** | $0 | 512 MB | 0.1 | Sleeps after 15 min |
| **Starter** | $7/month | 512 MB | 0.5 | No sleeping ✅ |
| **Standard** | $25/month | 2 GB | 1 | Better performance |
| **Pro** | $85/month | 4 GB | 2 | High performance |

**Your config uses:** Starter ($7/month)

**Want free tier?** Change `render.yaml`:
```yaml
plan: free  # Instead of starter
```

---

## 🔧 Your render.yaml Configuration

Your repository includes this configuration:

```yaml
services:
  - type: web
    name: error-analyzer-api
    env: node
    plan: starter                    # $7/month, no sleeping
    buildCommand: echo "No build"    # No dependencies
    startCommand: node api-server.js # Start command
    region: oregon                   # US West
    envVars:
      - key: NODE_VERSION
        value: 18.0.0
      - key: DEFAULT_REPO
        value: https://github.com/gauravadeshmukh/agentforcedemo/tree/master
    healthCheckPath: /api/health     # Health monitoring
```

---

## 🎯 Switch to Free Plan (Optional)

If you want to use the FREE tier instead:

### **Edit render.yaml**

Change line 5:
```yaml
plan: free  # Changed from starter
```

**Trade-offs:**
- ✅ Free (no cost)
- ⚠️ Sleeps after 15 minutes
- ⚠️ Slower CPU (0.1 vs 0.5)
- ⚠️ First request after sleep: 10-30 seconds

### **Commit and Push**

```bash
cd "C:\Workspace\NodeJs\New folder\ClaudeCode-Demo2"
git add render.yaml
git commit -m "Switch to free plan"
git push origin main
```

Then redeploy in Render dashboard.

---

## 📊 Post-Deployment Management

### **View Logs**

1. Go to your service dashboard
2. Click "Logs" tab
3. View real-time logs
4. Filter by date/time

### **Manual Deploy**

1. Go to service dashboard
2. Click "Manual Deploy"
3. Select branch: main
4. Click "Deploy"

### **Environment Variables**

1. Click "Environment" tab
2. Add/Edit variables
3. Click "Save Changes"
4. Service auto-redeploys

### **Custom Domain**

1. Go to "Settings" tab
2. Click "Add Custom Domain"
3. Enter domain: `api.yourdomain.com`
4. Add CNAME record in your DNS:
   ```
   CNAME api your-app.onrender.com
   ```

### **Auto-Deploy**

Enabled by default! Every push to main branch auto-deploys.

**Disable auto-deploy:**
1. Settings → Build & Deploy
2. Toggle "Auto-Deploy" off

---

## ✅ Testing Your Deployment

### **Test 1: Health Check**

```bash
curl https://error-analyzer-api.onrender.com/api/health
```

**Expected:**
```json
{
  "success": true,
  "service": "Error Analyzer API",
  "status": "healthy",
  "timestamp": "2025-11-26T...",
  "servicenow": {
    "configured": false,
    "instance": "Not configured"
  }
}
```

### **Test 2: API Status**

```bash
curl https://error-analyzer-api.onrender.com/api/status
```

### **Test 3: Analyze Error**

```bash
curl -X POST https://error-analyzer-api.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"System.NullPointerException at line 45\"}"
```

### **Test 4: Create Incident (Local Mode)**

```bash
curl -X POST https://error-analyzer-api.onrender.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"System.LimitException: Too many SOQL queries: 101\", \"caller\": \"test@example.com\", \"localOnly\": true}"
```

---

## 🔄 Update Deployment

### **Automatic (Recommended)**

Just push to GitHub:
```bash
git add .
git commit -m "Update features"
git push origin main
```

Render auto-deploys in 2-3 minutes.

### **Manual Deploy**

1. Go to Render dashboard
2. Click "Manual Deploy"
3. Click "Deploy latest commit"

---

## 🛠️ Troubleshooting

### **Issue 1: Build Fails**

**Check:**
- Build logs in Render dashboard
- Ensure `package.json` has correct scripts
- Verify `node` version is compatible

**Solution:**
Your app has no dependencies, so builds should succeed. If failing, check build logs.

### **Issue 2: Service Doesn't Start**

**Check:**
- Start command: `node api-server.js`
- Ensure file exists in repository
- Check runtime logs

**Solution:**
```bash
# Test locally first
node api-server.js
# Should start without errors
```

### **Issue 3: Environment Variables Not Working**

**Verify:**
1. Go to Environment tab
2. Check variables are set
3. Click "Save Changes" (triggers redeploy)

**Test:**
Check `/api/status` endpoint to see config.

### **Issue 4: 503 Service Unavailable**

**Causes:**
- Service is deploying (wait 2-3 min)
- Service crashed (check logs)
- Health check failing

**Solution:**
1. Check logs
2. Verify health check path: `/api/health`
3. Restart service if needed

### **Issue 5: Free Tier Sleep Issues**

If on free plan and service sleeps:

**Option 1: Use UptimeRobot**
- Sign up: https://uptimerobot.com
- Add monitor for your Render URL
- Check every 14 minutes
- Keeps service awake

**Option 2: Upgrade to Starter**
- No sleeping
- Better performance
- $7/month

---

## 📱 Integration After Deployment

### **Update Postman**

1. Open Postman collection
2. Update `baseUrl` variable:
   ```
   https://error-analyzer-api.onrender.com
   ```
3. Test all endpoints

### **Update Retool**

1. Go to Retool resources
2. Edit REST API resource
3. Update base URL:
   ```
   https://error-analyzer-api.onrender.com
   ```
4. Test queries

### **Use in Your App**

```javascript
const API_URL = 'https://error-analyzer-api.onrender.com';

// Analyze error
const response = await fetch(`${API_URL}/api/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    error: errorMessage
  })
});

const result = await response.json();
console.log(result.data.analysisResults);
```

---

## 🔒 Security Best Practices

### **1. Use Environment Variables**

Never hardcode secrets in code:
```yaml
# In Render dashboard Environment tab
SNOW_INSTANCE=your-instance.service-now.com
SNOW_USERNAME=your-username
SNOW_PASSWORD=your-secure-password
```

### **2. HTTPS Enabled**

Render provides HTTPS automatically - always enforced.

### **3. Health Checks**

Already configured in `render.yaml`:
```yaml
healthCheckPath: /api/health
```

Render monitors and restarts if unhealthy.

### **4. Add Rate Limiting** (Optional)

For production, consider adding rate limiting in your code.

---

## 💡 Performance Tips

### **1. Choose Right Region**

```yaml
region: oregon      # US West
# Or
region: frankfurt   # Europe
# Or
region: singapore   # Asia
```

Choose closest to your users.

### **2. Monitor Performance**

- Go to "Metrics" tab
- View response times
- Check memory usage
- Monitor CPU

### **3. Upgrade if Needed**

If slow:
```yaml
plan: standard  # 2GB RAM, 1 CPU
```

### **4. Use CDN** (Optional)

For static assets, use Render's CDN or Cloudflare.

---

## 📊 Monitoring & Alerts

### **Built-in Monitoring**

Render provides:
- ✅ Uptime monitoring
- ✅ Health checks (every 30 sec)
- ✅ Auto-restart on failure
- ✅ Metrics dashboard

### **Email Alerts**

1. Go to "Settings"
2. Notification settings
3. Add email for alerts
4. Choose: Deploy, Health, Performance

### **External Monitoring**

**UptimeRobot (Free):**
- Monitor: `https://your-app.onrender.com/api/health`
- Email on downtime
- SMS alerts (paid)

---

## 💰 Cost Optimization

### **Free Plan**
- $0/month
- Good for testing
- Acceptable 15-min sleep

### **Starter Plan** ($7/month)
- No sleeping
- Good performance
- Best value for small apps

### **Comparison**

| Feature | Free | Starter |
|---------|------|---------|
| Cost | $0 | $7/month |
| Sleep | Yes (15 min) | No |
| CPU | 0.1 | 0.5 |
| RAM | 512 MB | 512 MB |
| Build Minutes | 500/month | 500/month |

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Status Page:** https://status.render.com
- **Community:** https://community.render.com
- **Pricing:** https://render.com/pricing

---

## ✨ Summary

**Your app is ready for Render.com:**

✅ **Configuration Files:**
- `render.yaml` - Automated deployment config
- `package.json` - Node.js configuration
- `.gitignore` - Protects sensitive files

✅ **Features:**
- Health check endpoint
- Environment variable support
- No build dependencies
- Auto-deploy from GitHub

✅ **Deployment Methods:**
1. Blueprint (uses render.yaml) ⭐ **Recommended**
2. Manual web service setup

**Deploy now:** https://render.com

**Your URL:** `https://error-analyzer-api.onrender.com`

**Time to deploy:** 5 minutes

🚀 **Let's deploy!**

---

## 🎯 Quick Start Command

**One command to test locally:**
```bash
cd "C:\Workspace\NodeJs\New folder\ClaudeCode-Demo2"
node api-server.js
```

**Then visit:** http://localhost:3000/api/health

**Works locally?** → Deploy to Render! ✨
