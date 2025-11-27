# Heroku Deployment Guide (Eco Plan - $5/month)

## ⚠️ Important: Heroku No Longer Offers Free Dynos

Heroku eliminated the free tier on November 28, 2022. The minimum plan is now **Eco** at **$5/month**.

---

## 🎯 Heroku Eco Plan Details

**Cost:** $5/month for your account (not per app)
- ✅ 1000 dyno hours per month (enough for 1-2 apps running 24/7)
- ✅ Shared across all Eco dynos in your account
- ⚠️ Sleeps after 30 minutes of inactivity
- ✅ Wakes up automatically on first request (~5 seconds)

---

## 🚀 Deployment Options

### **Option 1: Deploy via Heroku Dashboard (No CLI Required)**

This is the easiest method and doesn't require installing Heroku CLI.

#### **Step 1: Create Heroku Account**

1. Visit: https://signup.heroku.com/
2. Sign up (free account)
3. Verify your email
4. **Add payment method** in account settings (required for Eco)
   - Go to: https://dashboard.heroku.com/account/billing
   - Click "Add payment method"

#### **Step 2: Create New App**

1. Go to: https://dashboard.heroku.com/new-app
2. **App name:** `error-analyzer-api` (or choose unique name)
3. **Region:** United States or Europe
4. Click **"Create app"**

#### **Step 3: Connect GitHub**

1. In your new app, go to **"Deploy"** tab
2. **Deployment method:** Click **"GitHub"**
3. Click **"Connect to GitHub"** button
4. Authorize Heroku to access your GitHub
5. Search for: `SFClaudeSnowIntegration`
6. Click **"Connect"** next to your repository

#### **Step 4: Configure Eco Dyno**

**⚠️ IMPORTANT:** You must configure Eco dyno BEFORE deploying

1. Go to **"Resources"** tab
2. Under "Dynos" section, you'll see "web" dyno
3. Click the **pencil icon** (✏️) next to "web"
4. In the dropdown, select: **"Eco"** ($5/month)
5. Click **"Confirm"**

#### **Step 5: Configure Environment Variables** (Optional - for ServiceNow)

1. Go to **"Settings"** tab
2. Click **"Reveal Config Vars"**
3. Add these variables (if using ServiceNow):

   | KEY | VALUE |
   |-----|-------|
   | `SNOW_INSTANCE` | `your-instance.service-now.com` |
   | `SNOW_USERNAME` | `your-username` |
   | `SNOW_PASSWORD` | `your-password` |

4. Click **"Add"** for each variable

**Skip this step if you want to run in local mode (test without ServiceNow)**

#### **Step 6: Deploy**

1. Go back to **"Deploy"** tab
2. Scroll to **"Manual deploy"** section
3. Branch: **main** (should be selected)
4. Click **"Deploy Branch"**
5. Wait 1-2 minutes for deployment

#### **Step 7: Verify Deployment**

1. Click **"Open app"** button (top right)
2. You'll see an error page - that's normal!
3. Add `/api/health` to the URL:
   ```
   https://your-app-name.herokuapp.com/api/health
   ```
4. You should see:
   ```json
   {
     "success": true,
     "service": "Error Analyzer API",
     "status": "healthy"
   }
   ```

🎉 **Success!** Your API is now live!

---

### **Option 2: Deploy via Heroku CLI**

If you prefer command line deployment:

#### **Step 1: Install Heroku CLI**

**Windows:**
- Download: https://devcenter.heroku.com/articles/heroku-cli
- Run installer
- Restart terminal

**Verify:**
```bash
heroku --version
```

#### **Step 2: Login**

```bash
heroku login
```

#### **Step 3: Create App**

```bash
cd "C:\Workspace\NodeJs\New folder\ClaudeCode-Demo2"
heroku create your-app-name
```

#### **Step 4: Set Dyno to Eco**

```bash
heroku ps:type eco -a your-app-name
```

#### **Step 5: Set Environment Variables** (Optional)

```bash
heroku config:set SNOW_INSTANCE=your-instance.service-now.com -a your-app-name
heroku config:set SNOW_USERNAME=your-username -a your-app-name
heroku config:set SNOW_PASSWORD=your-password -a your-app-name
```

#### **Step 6: Deploy**

```bash
git push heroku main
```

If you get branch error:
```bash
git push heroku master:main
```

#### **Step 7: Verify**

```bash
heroku open /api/health -a your-app-name
```

---

### **Option 3: One-Click Deploy** (Updated for Eco)

**Note:** One-click deploy button uses the `app.json` configuration which is now set to Eco.

1. Visit: https://heroku.com/deploy?template=https://github.com/gauravadeshmukh/SFClaudeSnowIntegration

2. **App name:** Choose unique name

3. **Add payment method** if prompted

4. **Environment variables:** (Optional)
   - SNOW_INSTANCE
   - SNOW_USERNAME
   - SNOW_PASSWORD

5. Click **"Deploy app"**

6. Wait for deployment

7. Click **"View"** button

8. Add `/api/health` to URL

---

## 💰 Heroku Pricing Breakdown

| Plan | Cost | Sleep? | Memory | Features |
|------|------|--------|--------|----------|
| **Eco** | **$5/month** | Yes (30 min) | 512 MB | 1000 hours/month |
| **Basic** | $7/month | No | 512 MB | Always on |
| **Standard-1X** | $25/month | No | 512 MB | Better performance |
| **Standard-2X** | $50/month | No | 1 GB | 2x performance |

**Recommendation:** Start with **Eco** ($5/month)

---

## 🔧 Post-Deployment Management

### **View Logs**

**Via Dashboard:**
1. Go to your app dashboard
2. Click "More" → "View logs"

**Via CLI:**
```bash
heroku logs --tail -a your-app-name
```

### **Restart App**

**Via Dashboard:**
1. Go to your app
2. Click "More" → "Restart all dynos"

**Via CLI:**
```bash
heroku restart -a your-app-name
```

### **Scale Dynos**

**Via Dashboard:**
1. Go to "Resources" tab
2. Click pencil icon next to dyno
3. Change plan

**Via CLI:**
```bash
# Change to Basic (always on)
heroku ps:type basic -a your-app-name

# Scale to multiple dynos
heroku ps:scale web=2 -a your-app-name
```

### **Update Environment Variables**

**Via Dashboard:**
1. Settings → Config Vars → Add/Edit

**Via CLI:**
```bash
heroku config:set KEY=VALUE -a your-app-name
```

### **View Configuration**

```bash
heroku config -a your-app-name
```

---

## 📊 Monitoring & Maintenance

### **Keep App Awake**

Since Eco dynos sleep after 30 minutes:

**Option 1: UptimeRobot** (Free)
1. Sign up: https://uptimerobot.com
2. Add monitor for: `https://your-app-name.herokuapp.com/api/health`
3. Set interval: 25 minutes
4. App stays awake during monitored hours

**Option 2: Upgrade to Basic**
```bash
heroku ps:type basic -a your-app-name
```
Cost: $7/month, no sleeping

### **View Metrics**

1. Go to app dashboard
2. Click "Metrics" tab
3. View:
   - Response time
   - Throughput
   - Memory usage
   - Errors

---

## 🔄 Update Deployment

After making code changes:

```bash
# Commit changes
git add .
git commit -m "Your update message"
git push origin main

# Deploy to Heroku
git push heroku main
```

**Or enable auto-deploy:**
1. Go to "Deploy" tab
2. Scroll to "Automatic deploys"
3. Click "Enable Automatic Deploys"
4. Every push to main will auto-deploy

---

## ✅ Testing Your Deployment

### **Test 1: Health Check**

```bash
curl https://your-app-name.herokuapp.com/api/health
```

**Expected:**
```json
{"success": true, "status": "healthy"}
```

### **Test 2: Analyze Error**

```bash
curl -X POST https://your-app-name.herokuapp.com/api/analyze \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"System.NullPointerException at line 45\"}"
```

### **Test 3: Create Incident (Local Mode)**

```bash
curl -X POST https://your-app-name.herokuapp.com/api/incident/create \
  -H "Content-Type: application/json" \
  -d "{\"error\": \"System.LimitException: Too many SOQL queries\", \"caller\": \"test@example.com\", \"localOnly\": true}"
```

---

## 🆘 Troubleshooting

### **Error: "You can't use free"**

**Solution:** This is why we updated `app.json` to use "eco"
- Redeploy using one-click deploy
- Or manually set dyno to eco in Resources tab

### **App Crashes (H10 Error)**

**Check:**
```bash
heroku logs --tail -a your-app-name
```

**Common causes:**
- Port not set correctly (should use `process.env.PORT`)
- Missing dependencies
- Code errors

**Fix:**
```bash
heroku restart -a your-app-name
```

### **Slow First Request**

- Normal for Eco dynos after sleeping
- First request takes 5-10 seconds
- Use UptimeRobot to keep awake
- Or upgrade to Basic plan

### **Config Vars Not Working**

**Verify:**
```bash
heroku config -a your-app-name
```

**Update:**
```bash
heroku config:set KEY=VALUE -a your-app-name
heroku restart -a your-app-name
```

---

## 📱 Integration After Deployment

### **Update Postman Collection**

1. Open Postman
2. Update `herokuUrl` variable: `https://your-app-name.herokuapp.com`
3. Test all endpoints

### **Update Retool Dashboard**

1. Go to Retool
2. Edit REST API resource
3. Update base URL: `https://your-app-name.herokuapp.com`
4. Test queries

---

## 💡 Cost Optimization Tips

### **Eco Plan ($5/month)**
- Good for 1-2 apps
- Acceptable sleep time
- Cost-effective for testing/development

### **Basic Plan ($7/month)**
- No sleeping
- Better for production
- Worth it for critical apps

### **Shared Account**
- Eco hours shared across all apps
- Consider which apps really need 24/7

---

## 📚 Additional Resources

- **Heroku Dashboard:** https://dashboard.heroku.com/apps/your-app-name
- **Heroku Docs:** https://devcenter.heroku.com/
- **Pricing:** https://www.heroku.com/pricing
- **Status:** https://status.heroku.com/

---

## ✨ Summary

**Your app is configured for Heroku Eco deployment:**
- ✅ `app.json` updated to use "eco" plan
- ✅ `Procfile` configured
- ✅ Environment variables supported
- ✅ Ready to deploy

**Cost:** $5/month
**Deployment time:** 5-10 minutes
**Your URL:** `https://your-app-name.herokuapp.com`

**Deploy now:** https://heroku.com/deploy?template=https://github.com/gauravadeshmukh/SFClaudeSnowIntegration

🚀 **Happy deploying!**
