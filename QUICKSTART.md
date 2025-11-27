# Quick Start Guide

## What is this?

The **Error Analyzer** is a smart tool that:
1. Takes an error message or exception from your code
2. Analyzes it against the GitHub repository: https://github.com/gauravadeshmukh/agentforcedemo
3. Provides you with:
   - What likely caused the error
   - How to fix it
   - Best practices to prevent it

## 5-Minute Quick Start

### 1. Check Prerequisites

```bash
# You need Node.js 12.0.0 or higher
node --version
```

### 2. Run the Test Suite

```bash
node test-analyzer.js
```

You should see:
```
🎉 ALL TESTS PASSED!
```

### 3. Run Examples

```bash
node example-usage.js
```

This will show you a complete analysis of a Salesforce Governor Limit Exception.

### 4. Analyze Your Own Error

#### Option A: Interactive Mode (Easiest)

```bash
node cli.js -i
```

Then:
1. Press Enter to use the default repository
2. Paste your error message
3. Press Enter twice to analyze

#### Option B: Command Line

```bash
node cli.js --error "Your error message here"
```

#### Option C: Programmatically

Create a new file `my-analysis.js`:

```javascript
const ErrorAnalyzer = require('./error-analyzer');

const analyzer = new ErrorAnalyzer('https://github.com/gauravadeshmukh/agentforcedemo/tree/master');

const myError = `
System.NullPointerException: Attempt to de-reference a null object
Class.MyClass.myMethod: line 123, column 45
`;

analyzer.analyze(myError)
  .then(results => analyzer.displayResults(results))
  .catch(error => console.error('Error:', error.message));
```

Then run:
```bash
node my-analysis.js
```

## Example Error Messages You Can Try

### Apex NullPointerException
```bash
node cli.js --error "System.NullPointerException: Attempt to de-reference a null object. Class.AccountTriggerHandler.handleBeforeInsert: line 45, column 12"
```

### JavaScript TypeError
```bash
node cli.js --error "TypeError: Cannot read property 'name' of undefined at AccountController.js:34:21"
```

### Salesforce Governor Limit
```bash
node cli.js --error "System.LimitException: Too many SOQL queries: 101. Class.AccountDataProcessor.processRecords: line 156, column 1"
```

### DML Exception
```bash
node cli.js --error "System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, Required fields are missing: [Name]"
```

## Understanding the Output

The analyzer provides:

### 📋 ERROR INFORMATION
- Error type (e.g., NullPointerException, TypeError)
- Programming language
- Location (file and line number)

### 📂 RELEVANT FILES
- Files in the repository that might be related to your error
- Ranked by relevance

### 📝 CODE SNIPPET
- The actual code around the error line (if found)

### 🔍 POSSIBLE CAUSES
- Reasons why this error might occur

### 💡 SUGGESTED FIXES
- Step-by-step recommendations to fix the issue

### ✅ BEST PRACTICES
- How to prevent similar errors in the future

## Analyzing Against a Different Repository

```bash
node cli.js --repo https://github.com/username/repo --error "Your error message"
```

Or in code:

```javascript
const analyzer = new ErrorAnalyzer('https://github.com/username/your-repo');
```

## Common Use Cases

### 1. Debug Production Errors

Copy the error from your logs and analyze it:

```bash
node cli.js -i
# Paste your production error
```

### 2. Code Review

When reviewing code that throws errors during testing:

```bash
node cli.js --error "Error from your test suite"
```

### 3. Learning

Understand why certain errors occur:

```bash
node example-usage.js
```

Edit the file to uncomment different examples.

### 4. Integrate with Your Error Handling

```javascript
// In your app's error handler
process.on('uncaughtException', async (error) => {
  const ErrorAnalyzer = require('./error-analyzer');
  const analyzer = new ErrorAnalyzer('https://github.com/your/repo');

  const results = await analyzer.analyze(error.stack);
  analyzer.displayResults(results);
});
```

## Tips

1. **More context = better analysis**: Include the full stack trace when possible
2. **Line numbers help**: Errors with file names and line numbers get better recommendations
3. **Use the cache**: The analyzer caches GitHub API responses for 15 minutes
4. **Rate limits**: GitHub API has a 60 requests/hour limit for unauthenticated requests

## Troubleshooting

### "GitHub API returned status 403"
You've hit the rate limit. Wait an hour or add a GitHub token (see README.md).

### "Invalid GitHub repository URL"
Make sure the URL is in this format: `https://github.com/owner/repo`

### No relevant files found
The error message might not contain enough information. Try including the full stack trace.

## Next Steps

- Read the full [README.md](README.md) for advanced features
- Customize the error patterns in `error-analyzer.js`
- Add support for your organization's specific error types
- Integrate with your CI/CD pipeline

## Support

For issues or questions:
- Check the [README.md](README.md) for detailed documentation
- Run `node test-analyzer.js` to verify everything works
- Review the examples in `example-usage.js`

## Summary of Files

- `error-analyzer.js` - Main analyzer class
- `cli.js` - Command-line interface
- `example-usage.js` - Example demonstrations
- `test-analyzer.js` - Test suite
- `README.md` - Full documentation
- `QUICKSTART.md` - This file
- `package.json` - Package configuration

Ready to analyze errors? Try:
```bash
node cli.js -i
```
