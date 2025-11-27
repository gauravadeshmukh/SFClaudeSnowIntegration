# Error Analyzer

An intelligent error analysis system that analyzes error messages and exceptions against a GitHub codebase to provide:
- **Possible causes** of the error
- **Suggested fixes** with actionable steps
- **Best practices** to prevent similar issues
- **Code context** from the repository

## Features

- 🔍 **Smart Error Parsing**: Automatically detects error types, file locations, and stack traces
- 🌐 **GitHub Integration**: Fetches and analyzes code directly from GitHub repositories
- 💡 **Intelligent Recommendations**: Provides context-aware fixes based on error type
- 🎯 **Multi-Language Support**: Handles Apex, JavaScript, Java, Python errors
- 📊 **Detailed Reports**: Generates comprehensive analysis reports with code snippets
- 🚀 **Easy to Use**: CLI, programmatic API, and interactive modes
- 🎫 **ServiceNow Integration**: Automatically creates incidents with analysis attached (NEW!)

## Supported Error Types

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

### Java
- NullPointerException
- IllegalArgumentException
- IndexOutOfBoundsException

### Python
- AttributeError
- TypeError
- ValueError

## Installation

```bash
# Clone or download this repository
cd ClaudeCode-Demo2

# No external dependencies required (uses Node.js built-in modules)
# Requires Node.js 12.0.0 or higher
```

## Usage

### 1. CLI Mode (Recommended)

#### Basic Usage
```bash
# Analyze an error message
node cli.js --error "NullPointerException at AccountHandler.cls:45"

# Interactive mode
node cli.js -i

# Analyze against a different repository
node cli.js --repo https://github.com/user/repo --error "TypeError: undefined"
```

#### Interactive Mode
```bash
node cli.js -i
```
This will prompt you for:
1. Repository URL (or use default)
2. Error message (paste and press Enter twice)

### 2. Programmatic Usage

```javascript
const ErrorAnalyzer = require('./error-analyzer');

// Initialize with GitHub repository
const analyzer = new ErrorAnalyzer('https://github.com/gauravadeshmukh/agentforcedemo/tree/master');

// Analyze an error
const errorMessage = `
System.NullPointerException: Attempt to de-reference a null object
Class.AccountTriggerHandler.handleBeforeInsert: line 45, column 12
`;

analyzer.analyze(errorMessage)
  .then(results => {
    analyzer.displayResults(results);
  })
  .catch(error => {
    console.error('Analysis failed:', error.message);
  });
```

### 3. Run Examples

```bash
# Run predefined examples
node example-usage.js
```

Edit `example-usage.js` to uncomment different examples:
- `example1_ApexNullPointer()` - Apex null pointer exception
- `example2_ApexDmlException()` - DML operation failure
- `example3_JavaScriptError()` - JavaScript type error
- `example4_LimitException()` - Salesforce governor limits
- `example5_CustomError()` - Custom error messages
- `example6_ExceptionObject()` - Analyze caught exceptions

### 4. Analyze Custom Errors via Command Line

```bash
# Pass error message as argument
node example-usage.js "System.DmlException: Insert failed"
```

### 5. ServiceNow Integration (NEW!)

Create ServiceNow incidents with error analysis attached:

```bash
# Test locally without ServiceNow (creates report file)
node create-incident.js --error "Your error message" --local

# Create actual ServiceNow incident (requires configuration)
node create-incident.js --error "System.LimitException: Too many SOQL queries" --caller "dev@company.com"
```

See [SERVICENOW-INTEGRATION.md](SERVICENOW-INTEGRATION.md) for complete setup and usage guide.

## Configuration

### Changing the Target Repository

```javascript
// Option 1: In code
const analyzer = new ErrorAnalyzer('https://github.com/your-username/your-repo/tree/main');

// Option 2: Via CLI
node cli.js --repo https://github.com/your-username/your-repo --error "Your error"
```

### Supported Repository URL Formats
- `https://github.com/owner/repo`
- `https://github.com/owner/repo/tree/branch`
- `https://github.com/owner/repo.git`

## How It Works

### 1. Error Parsing
The system analyzes the error message to extract:
- Error type (NullPointerException, TypeError, etc.)
- File name and location
- Line and column numbers
- Stack trace
- Programming language

### 2. Repository Analysis
- Fetches the repository structure from GitHub
- Identifies relevant files based on:
  - Direct file name matches
  - Class name matches
  - Programming language
  - File patterns

### 3. Code Analysis
- Retrieves file content from GitHub
- Extracts code snippets around the error line
- Analyzes code context

### 4. Recommendation Generation
Based on the error type, provides:
- **Possible Causes**: Why the error occurred
- **Suggested Fixes**: Step-by-step remediation
- **Best Practices**: How to prevent future occurrences

## Example Output

```
================================================================================
ERROR ANALYSIS REPORT
================================================================================

📋 ERROR INFORMATION:
   Type: LimitException
   Language: apex
   Message: Too many SOQL queries: 101
   Location: AccountDataProcessor.cls:156:1

📁 REPOSITORY:
   gauravadeshmukh/agentforcedemo (master)

📂 RELEVANT FILES:
   1. force-app/main/default/classes/AccountDataProcessor.cls (Direct file match)

--------------------------------------------------------------------------------
ANALYSIS 1: force-app/main/default/classes/AccountDataProcessor.cls
--------------------------------------------------------------------------------

🔍 POSSIBLE CAUSES:
   1. Too many SOQL queries in a single transaction
   2. Too many DML statements
   3. CPU time limit exceeded
   4. Heap size limit exceeded
   5. Non-bulkified code in loops

💡 SUGGESTED FIXES:
   1. Move SOQL queries outside of loops
   2. Bulkify your code to handle multiple records
   3. Use aggregate queries instead of looping
   4. Optimize complex algorithms
   5. Use @future or Queueable for asynchronous processing

✅ BEST PRACTICES:
   1. Always write bulkified code
   2. Use collections to batch DML operations
   3. Monitor governor limits with Limits class
   4. Cache SOQL results when possible
   5. Use efficient data structures
```

## API Reference

### ErrorAnalyzer Class

#### Constructor
```javascript
new ErrorAnalyzer(githubRepoUrl)
```

#### Methods

##### `async analyze(errorMessage)`
Analyzes an error message against the repository.

**Parameters:**
- `errorMessage` (string): The error message or exception to analyze

**Returns:**
- Promise resolving to analysis results object

##### `displayResults(results)`
Formats and displays analysis results to console.

**Parameters:**
- `results` (object): Results from `analyze()` method

##### `parseError(errorMessage)`
Parses error message to extract structured information.

**Returns:**
- Object with error details (type, file, line, etc.)

##### `async fetchRepoTree()`
Fetches repository file structure from GitHub.

**Returns:**
- Promise resolving to repository tree object

##### `async fetchFileContent(filePath)`
Fetches specific file content from GitHub.

**Parameters:**
- `filePath` (string): Path to file in repository

**Returns:**
- Promise resolving to file content string

## Advanced Usage

### Analyze Exception Objects

```javascript
try {
  // Some code that throws an error
  const data = null;
  const result = data.someProperty;
} catch (error) {
  // Analyze the caught exception
  const analyzer = new ErrorAnalyzer('https://github.com/user/repo');

  analyzer.analyze(error.stack)
    .then(results => analyzer.displayResults(results));
}
```

### Custom Error Handlers

```javascript
// Integrate with your error handling system
function globalErrorHandler(error) {
  console.error('Error occurred:', error);

  const analyzer = new ErrorAnalyzer('https://github.com/user/repo');

  analyzer.analyze(error.stack || error.message)
    .then(results => {
      // Send results to logging system
      logToSystem(results);

      // Display to developer
      analyzer.displayResults(results);
    });
}

process.on('uncaughtException', globalErrorHandler);
```

### Batch Error Analysis

```javascript
const errors = [
  'NullPointerException at Line 45',
  'DmlException: Insert failed',
  'TypeError: undefined is not a function'
];

const analyzer = new ErrorAnalyzer('https://github.com/user/repo');

Promise.all(errors.map(error => analyzer.analyze(error)))
  .then(resultsArray => {
    resultsArray.forEach((results, index) => {
      console.log(`\n=== Analysis ${index + 1} ===`);
      analyzer.displayResults(results);
    });
  });
```

## Limitations

1. **GitHub Rate Limits**: The analyzer uses the GitHub API without authentication. You may hit rate limits (60 requests/hour). To increase limits, modify the code to include a GitHub token.

2. **File Size**: Very large files may take longer to fetch and analyze.

3. **Private Repositories**: Only works with public repositories by default. For private repos, you need to add authentication.

4. **Error Pattern Recognition**: Works best with well-formatted error messages that include file names and line numbers.

## Extending the Analyzer

### Add Support for New Error Types

Edit `error-analyzer.js` in the `analyzeCodeAndRecommend` method:

```javascript
case 'YourCustomError':
  recommendations.possibleCauses.push('Your causes here');
  recommendations.suggestedFixes.push('Your fixes here');
  recommendations.bestPractices.push('Your practices here');
  break;
```

### Add New Language Support

Update the `parseError` method to recognize new language patterns:

```javascript
const patterns = {
  // Add your language pattern
  yourLanguage: /your-regex-pattern/g
};
```

### Add GitHub Authentication

To avoid rate limits and access private repos:

```javascript
const options = {
  hostname: 'api.github.com',
  path: `/repos/${this.repoOwner}/${this.repoName}/...`,
  headers: {
    'Authorization': `token YOUR_GITHUB_TOKEN`,
    'User-Agent': 'Error-Analyzer-Node'
  }
};
```

## Troubleshooting

### "GitHub API returned status 403"
You've hit the rate limit. Wait an hour or add authentication.

### "Invalid GitHub repository URL"
Ensure URL format is: `https://github.com/owner/repo`

### "Failed to fetch file"
The file may not exist in the repository or the path is incorrect.

### Error parsing doesn't detect file/line
The error message format may not match known patterns. You can manually specify the file in a custom analysis.

## Contributing

Feel free to extend this tool by:
- Adding support for more programming languages
- Improving error pattern recognition
- Adding more detailed recommendations
- Implementing caching mechanisms
- Adding unit tests

## License

MIT License - Feel free to use and modify as needed.

## Future Enhancements

- [ ] Support for GitLab and Bitbucket repositories
- [ ] Machine learning-based error classification
- [ ] Integration with issue tracking systems
- [ ] Automated fix generation and pull request creation
- [ ] Web-based UI for easier interaction
- [ ] Support for analyzing multiple errors in batch
- [ ] Integration with CI/CD pipelines
- [ ] Custom rule engine for organization-specific patterns

## Credits

Built with Node.js using only built-in modules (https, http, readline).

Designed to analyze the [agentforcedemo](https://github.com/gauravadeshmukh/agentforcedemo) repository but works with any public GitHub repository.
