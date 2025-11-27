# ServiceNow Integration - Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Test Locally (No ServiceNow Required)

Try it out without any ServiceNow setup:

```bash
node create-incident.js --error "System.LimitException: Too many SOQL queries: 101" --local
```

This will:
- ✅ Analyze the error against the GitHub repository
- ✅ Generate a comprehensive analysis report
- ✅ Save it as a text file in the current directory

**Output:**
```
✓ Analysis completed
  Error Type: LimitException
  Language: apex
  Relevant Files: 10

✓ Report saved successfully!
  File: error_analysis_1234567890.txt
  Size: 5780 bytes
```

### Step 2: View the Generated Report

Open the generated file to see:
- Original error message
- Parsed error information (type, language, location)
- Repository and file information
- Possible causes (5+ reasons)
- Suggested fixes (5+ solutions)
- Best practices (6+ recommendations)

### Step 3: Setup ServiceNow (When Ready)

1. **Copy the configuration template:**
   ```bash
   cp servicenow-config.example.json servicenow-config.json
   ```

2. **Edit servicenow-config.json:**
   ```json
   {
     "instanceUrl": "your-instance.service-now.com",
     "username": "your.username",
     "password": "your_password"
   }
   ```

3. **Create your first incident:**
   ```bash
   node create-incident.js \
     --error "System.NullPointerException at line 45" \
     --caller "developer@company.com"
   ```

## 📋 Common Commands

### Analyze and Create Incident

```bash
# Basic incident creation
node create-incident.js --error "Your error message" --caller "you@company.com"

# With assignment group
node create-incident.js \
  --error "Error message" \
  --caller "you@company.com" \
  --assignment-group "abc123"

# Different repository
node create-incident.js \
  --repo "https://github.com/user/repo" \
  --error "Error message" \
  --local
```

### NPM Scripts

```bash
# Test locally
npm run incident:local -- --error "Your error message"

# Create incident (requires config)
npm run incident -- --error "Your error" --caller "you@company.com"
```

## 📊 What You Get

### In the ServiceNow Incident:

1. **Short Description**: Error type and message
2. **Full Description**: Complete error details with repository info
3. **Priority**: Auto-set based on error severity (1-5)
4. **Attached Report**: Comprehensive analysis file
5. **Work Notes**: Summary of the analysis

### In the Analysis Report:

- ✅ Detailed error breakdown
- ✅ Code snippets (when available)
- ✅ 3-5 possible causes
- ✅ 4-5 suggested fixes
- ✅ 6-8 best practices
- ✅ Links to relevant files in the repository

## 🎯 Example Use Cases

### Use Case 1: Production Error

```bash
# Copy error from production logs
node create-incident.js \
  --error "$(cat production-error.log)" \
  --caller "oncall@company.com" \
  --local
```

### Use Case 2: Automated Error Handling

```javascript
// In your application
process.on('uncaughtException', async (error) => {
  const { createIncidentWithAnalysis } = require('./create-incident');

  await createIncidentWithAnalysis({
    errorMessage: error.stack,
    repoUrl: 'https://github.com/yourorg/yourrepo',
    configPath: './servicenow-config.json',
    caller: 'system@company.com',
    localOnly: process.env.NODE_ENV !== 'production'
  });
});
```

### Use Case 3: CI/CD Integration

```yaml
# In your .gitlab-ci.yml or similar
on_failure:
  script:
    - node create-incident.js --error "$ERROR_MESSAGE" --caller "ci-cd@company.com"
```

## 🔒 Security Best Practices

1. **Never commit servicenow-config.json**
   - It's already in .gitignore
   - Keep credentials secure

2. **Use environment variables in production**
   ```javascript
   const config = {
     instanceUrl: process.env.SNOW_INSTANCE,
     username: process.env.SNOW_USERNAME,
     password: process.env.SNOW_PASSWORD
   };
   ```

3. **Create a dedicated ServiceNow user**
   - Don't use personal accounts
   - Use least-privilege permissions
   - Enable API access only

## 🛠 Troubleshooting

### "Config file not found"
```bash
# Make sure you've created the config file
cp servicenow-config.example.json servicenow-config.json
# Then edit it with your credentials
```

### "Authentication failed"
- Verify username and password in servicenow-config.json
- Check if user has API access enabled in ServiceNow
- Try using --local mode to test without ServiceNow

### "Want to test without ServiceNow"
```bash
# Just add --local flag
node create-incident.js --error "Your error" --local
```

## 📖 Next Steps

1. ✅ Try local mode to see the analysis
2. ✅ Review the generated report
3. ✅ Set up ServiceNow configuration
4. ✅ Create a test incident
5. ✅ Integrate with your error handling

## 📚 Full Documentation

- **Complete Setup Guide**: [SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md)
- **Error Analyzer Guide**: [README.md](README.md)
- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)

## 💡 Pro Tips

1. **Test First**: Always use `--local` to preview the analysis
2. **Assignment Groups**: Set `defaultAssignmentGroup` in config
3. **Batch Processing**: Process multiple errors with a script
4. **Custom Fields**: Add extra fields via `additionalFields` parameter
5. **Error Patterns**: The analyzer learns from error patterns

## 🎉 Success Indicators

You'll know it's working when you see:

```
═══════════════════════════════════════════════════════════════════════════════
✓ INCIDENT CREATED SUCCESSFULLY
═══════════════════════════════════════════════════════════════════════════════

Incident Details:
  Number: INC0012345
  Sys ID: abc123xyz789
  URL: https://your-instance.service-now.com/nav_to.do?uri=incident.do?sys_id=abc123xyz789
  Report File: error_analysis_INC0012345_1234567890.txt

Next Steps:
  1. Open the incident in ServiceNow
  2. Review the attached analysis report
  3. Follow the suggested fixes
  4. Update the incident with your progress
```

## 🆘 Need Help?

1. Run with `--help` flag
2. Check the full documentation: [SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md)
3. Test with `--local` mode first
4. Review the examples in the documentation

Happy debugging! 🐛➡️✅
