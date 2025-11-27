/**
 * Error Analyzer System
 * Analyzes errors/exceptions against a GitHub codebase and provides fixes and recommendations
 */

const https = require('https');
const http = require('http');

class ErrorAnalyzer {
  constructor(githubRepo) {
    this.githubRepo = githubRepo;
    this.repoOwner = null;
    this.repoName = null;
    this.branch = 'master';
    this.codebaseCache = new Map();

    this.parseRepoUrl(githubRepo);
  }

  /**
   * Parse GitHub repository URL
   */
  parseRepoUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (match) {
      this.repoOwner = match[1];
      this.repoName = match[2].replace(/\.git$/, '');
      if (match[3]) this.branch = match[3];
    } else {
      throw new Error('Invalid GitHub repository URL');
    }
  }

  /**
   * Fetch repository tree structure
   */
  async fetchRepoTree() {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${this.repoOwner}/${this.repoName}/git/trees/${this.branch}?recursive=1`,
        method: 'GET',
        headers: {
          'User-Agent': 'Error-Analyzer-Node',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`GitHub API returned status ${res.statusCode}: ${data}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Fetch file content from GitHub
   */
  async fetchFileContent(filePath) {
    if (this.codebaseCache.has(filePath)) {
      return this.codebaseCache.get(filePath);
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'raw.githubusercontent.com',
        path: `/${this.repoOwner}/${this.repoName}/${this.branch}/${filePath}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Error-Analyzer-Node'
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            this.codebaseCache.set(filePath, data);
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch file: ${filePath}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Parse error message to extract useful information
   */
  parseError(errorMessage) {
    const errorInfo = {
      type: 'Unknown',
      message: errorMessage,
      fileName: null,
      lineNumber: null,
      columnNumber: null,
      className: null,
      methodName: null,
      stackTrace: [],
      language: null
    };

    // Common error patterns
    const patterns = {
      // JavaScript/Node.js errors
      js: /at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/g,
      // Apex errors - more flexible pattern
      apex: /Class\.([^:]+):\s*line\s+(\d+)(?:,\s*column\s+(\d+))?/i,
      apexException: /([\w\.]+Exception):\s*(.+)/i,
      // Java errors
      java: /at\s+([\w\.$]+)\.(\w+)\([^:]+:(\d+)\)/g,
      // Python errors
      python: /File\s+"([^"]+)",\s+line\s+(\d+)/g,
      // General file reference
      fileRef: /(?:in|at)\s+([^\s:]+\.(?:js|apex|cls|trigger|java|py)):?(\d+)?:?(\d+)?/gi
    };

    // Detect Apex exception type first
    const apexExceptionMatch = errorMessage.match(patterns.apexException);
    if (apexExceptionMatch) {
      // Normalize exception type (remove System. prefix if present)
      errorInfo.type = apexExceptionMatch[1].replace(/^System\./, '');
      errorInfo.message = apexExceptionMatch[2];
    }

    // Detect Apex errors
    const apexMatch = errorMessage.match(patterns.apex);
    if (apexMatch) {
      errorInfo.language = 'apex';
      errorInfo.className = apexMatch[1];
      errorInfo.lineNumber = parseInt(apexMatch[2]);
      errorInfo.columnNumber = apexMatch[3] ? parseInt(apexMatch[3]) : null;
    }

    // Extract JavaScript stack trace
    let match;
    while ((match = patterns.js.exec(errorMessage)) !== null) {
      errorInfo.stackTrace.push({
        function: match[1] || 'anonymous',
        file: match[2],
        line: parseInt(match[3]),
        column: parseInt(match[4])
      });
      if (!errorInfo.fileName) {
        errorInfo.fileName = match[2];
        errorInfo.lineNumber = parseInt(match[3]);
        errorInfo.columnNumber = parseInt(match[4]);
        errorInfo.language = 'javascript';
      }
    }

    // Extract file references
    while ((match = patterns.fileRef.exec(errorMessage)) !== null) {
      if (!errorInfo.fileName) {
        errorInfo.fileName = match[1];
        errorInfo.lineNumber = match[2] ? parseInt(match[2]) : null;
        errorInfo.columnNumber = match[3] ? parseInt(match[3]) : null;

        const ext = match[1].split('.').pop().toLowerCase();
        if (['apex', 'cls', 'trigger'].includes(ext)) errorInfo.language = 'apex';
        else if (ext === 'js') errorInfo.language = 'javascript';
        else if (ext === 'java') errorInfo.language = 'java';
        else if (ext === 'py') errorInfo.language = 'python';
      }
    }

    // Common error type detection (only if not already set by exception pattern)
    if (errorInfo.type === 'Unknown') {
      if (errorMessage.includes('TypeError')) {
        errorInfo.type = 'TypeError';
      } else if (errorMessage.includes('ReferenceError')) {
        errorInfo.type = 'ReferenceError';
      } else if (errorMessage.includes('SyntaxError')) {
        errorInfo.type = 'SyntaxError';
      } else if (errorMessage.includes('NullPointerException') || errorMessage.includes('null is not')) {
        errorInfo.type = 'NullPointerException';
      } else if (errorMessage.includes('undefined')) {
        errorInfo.type = 'UndefinedError';
      } else if (errorMessage.includes('DmlException')) {
        errorInfo.type = 'DmlException';
      } else if (errorMessage.includes('LimitException')) {
        errorInfo.type = 'LimitException';
      }
    }

    return errorInfo;
  }

  /**
   * Find relevant files in the repository based on error info
   */
  async findRelevantFiles(errorInfo, repoTree) {
    const relevantFiles = [];

    for (const item of repoTree.tree) {
      if (item.type !== 'blob') continue;

      const path = item.path;
      const ext = path.split('.').pop().toLowerCase();

      // Match by file name
      if (errorInfo.fileName && path.includes(errorInfo.fileName)) {
        relevantFiles.push({ path, priority: 1, reason: 'Direct file match' });
        continue;
      }

      // Match by class name (Apex)
      if (errorInfo.className && path.includes(errorInfo.className)) {
        relevantFiles.push({ path, priority: 2, reason: 'Class name match' });
        continue;
      }

      // Match by language
      if (errorInfo.language === 'apex' && ['cls', 'trigger'].includes(ext)) {
        relevantFiles.push({ path, priority: 3, reason: 'Same language file' });
      } else if (errorInfo.language === 'javascript' && ext === 'js') {
        relevantFiles.push({ path, priority: 3, reason: 'Same language file' });
      }
    }

    // Sort by priority
    relevantFiles.sort((a, b) => a.priority - b.priority);

    return relevantFiles.slice(0, 10); // Limit to top 10 files
  }

  /**
   * Analyze code and provide recommendations
   */
  analyzeCodeAndRecommend(errorInfo, fileContent, filePath) {
    const recommendations = {
      filePath,
      errorType: errorInfo.type,
      possibleCauses: [],
      suggestedFixes: [],
      bestPractices: [],
      codeSnippet: null
    };

    // Extract code snippet around the error line
    if (errorInfo.lineNumber && fileContent) {
      const lines = fileContent.split('\n');
      const errorLine = errorInfo.lineNumber - 1;
      const start = Math.max(0, errorLine - 3);
      const end = Math.min(lines.length, errorLine + 4);

      recommendations.codeSnippet = {
        startLine: start + 1,
        endLine: end,
        errorLine: errorInfo.lineNumber,
        code: lines.slice(start, end).map((line, idx) => ({
          lineNumber: start + idx + 1,
          content: line,
          isError: (start + idx + 1) === errorInfo.lineNumber
        }))
      };
    }

    // Analyze based on error type
    switch (errorInfo.type) {
      case 'NullPointerException':
        recommendations.possibleCauses.push(
          'Attempting to access a property or method on a null object',
          'Variable not properly initialized before use',
          'Query returned no results and null was not handled'
        );
        recommendations.suggestedFixes.push(
          'Add null checks before accessing object properties',
          'Initialize variables with default values',
          'Use defensive programming with null coalescing operators',
          'For Apex: Use isEmpty() or != null checks before accessing objects'
        );
        recommendations.bestPractices.push(
          'Always validate query results before using them',
          'Use optional chaining (JavaScript) or safe navigation operators',
          'Implement proper error handling with try-catch blocks'
        );
        break;

      case 'UndefinedError':
      case 'ReferenceError':
        recommendations.possibleCauses.push(
          'Variable referenced before declaration',
          'Typo in variable or function name',
          'Variable out of scope',
          'Missing import or dependency'
        );
        recommendations.suggestedFixes.push(
          'Check variable spelling and capitalization',
          'Ensure variable is declared before use',
          'Verify all imports are present',
          'Check variable scope (block, function, or global)'
        );
        recommendations.bestPractices.push(
          'Use "use strict" mode in JavaScript',
          'Enable linting tools (ESLint, PMD for Apex)',
          'Declare variables at the top of their scope'
        );
        break;

      case 'DmlException':
        recommendations.possibleCauses.push(
          'DML operation failed due to validation rules',
          'Required fields missing',
          'Insufficient permissions',
          'Record locking issues',
          'Governor limits exceeded'
        );
        recommendations.suggestedFixes.push(
          'Validate all required fields before DML',
          'Use Database.insert/update with allOrNone=false for partial success',
          'Check user permissions before DML operations',
          'Implement proper error handling for DML operations',
          'Review validation rules and field-level security'
        );
        recommendations.bestPractices.push(
          'Use Database methods instead of direct DML for better error handling',
          'Bulkify DML operations to avoid governor limits',
          'Log DML errors for debugging',
          'Validate data before DML in triggers and classes'
        );
        break;

      case 'LimitException':
        recommendations.possibleCauses.push(
          'Too many SOQL queries in a single transaction',
          'Too many DML statements',
          'CPU time limit exceeded',
          'Heap size limit exceeded',
          'Non-bulkified code in loops'
        );
        recommendations.suggestedFixes.push(
          'Move SOQL queries outside of loops',
          'Bulkify your code to handle multiple records',
          'Use aggregate queries instead of looping',
          'Optimize complex algorithms',
          'Use @future or Queueable for asynchronous processing'
        );
        recommendations.bestPractices.push(
          'Always write bulkified code',
          'Use collections to batch DML operations',
          'Monitor governor limits with Limits class',
          'Cache SOQL results when possible',
          'Use efficient data structures'
        );
        break;

      case 'TypeError':
        recommendations.possibleCauses.push(
          'Operation performed on incompatible data type',
          'Function called with wrong number/type of arguments',
          'Attempting to modify immutable data'
        );
        recommendations.suggestedFixes.push(
          'Verify data types match expected types',
          'Add type checking before operations',
          'Use type conversion functions (parseInt, String(), etc.)',
          'Check function signatures and arguments'
        );
        recommendations.bestPractices.push(
          'Use TypeScript for static type checking',
          'Document expected parameter types',
          'Use JSDoc comments for type hints',
          'Enable strict type checking in your IDE'
        );
        break;

      case 'SyntaxError':
        recommendations.possibleCauses.push(
          'Missing or extra brackets, parentheses, or braces',
          'Invalid character or syntax',
          'Incorrect use of keywords',
          'Missing semicolons or commas'
        );
        recommendations.suggestedFixes.push(
          'Review code syntax carefully',
          'Use IDE syntax highlighting and validation',
          'Check bracket matching',
          'Verify proper string quotes and escaping'
        );
        recommendations.bestPractices.push(
          'Use a linter to catch syntax errors',
          'Enable auto-formatting in your IDE',
          'Use version control to track changes',
          'Test code incrementally'
        );
        break;

      default:
        recommendations.possibleCauses.push(
          'Review the error message for specific details',
          'Check recent code changes',
          'Verify configuration and dependencies'
        );
        recommendations.suggestedFixes.push(
          'Enable debug logging',
          'Add try-catch blocks to isolate the issue',
          'Review documentation for the framework/library',
          'Check for known issues in the project repository'
        );
        recommendations.bestPractices.push(
          'Implement comprehensive error handling',
          'Use logging frameworks for debugging',
          'Write unit tests to catch issues early',
          'Follow coding standards and best practices'
        );
    }

    // Add language-specific recommendations
    if (errorInfo.language === 'apex') {
      recommendations.bestPractices.push(
        'Use Salesforce debug logs for troubleshooting',
        'Test with different user profiles and permissions',
        'Follow Apex best practices and design patterns'
      );
    }

    return recommendations;
  }

  /**
   * Main analysis method
   */
  async analyze(errorMessage) {
    console.log('\n=== Error Analysis Started ===\n');

    try {
      // Step 1: Parse the error
      console.log('Step 1: Parsing error message...');
      const errorInfo = this.parseError(errorMessage);
      console.log(`Detected Error Type: ${errorInfo.type}`);
      console.log(`Language: ${errorInfo.language || 'Unknown'}`);
      if (errorInfo.fileName) console.log(`File: ${errorInfo.fileName}:${errorInfo.lineNumber}`);

      // Step 2: Fetch repository structure
      console.log('\nStep 2: Fetching repository structure...');
      const repoTree = await this.fetchRepoTree();
      console.log(`Found ${repoTree.tree.length} files in repository`);

      // Step 3: Find relevant files
      console.log('\nStep 3: Finding relevant files...');
      const relevantFiles = await this.findRelevantFiles(errorInfo, repoTree);
      console.log(`Found ${relevantFiles.length} potentially relevant files`);

      // Step 4: Analyze code and generate recommendations
      console.log('\nStep 4: Analyzing code and generating recommendations...');
      const analysisResults = [];

      for (const file of relevantFiles.slice(0, 3)) { // Analyze top 3 files
        try {
          const content = await this.fetchFileContent(file.path);
          const recommendations = this.analyzeCodeAndRecommend(errorInfo, content, file.path);
          recommendations.matchReason = file.reason;
          analysisResults.push(recommendations);
        } catch (err) {
          console.log(`Could not analyze ${file.path}: ${err.message}`);
        }
      }

      // If no specific file found, provide general recommendations
      if (analysisResults.length === 0) {
        analysisResults.push(this.analyzeCodeAndRecommend(errorInfo, null, 'General'));
      }

      return {
        errorInfo,
        relevantFiles,
        analysisResults,
        repository: {
          owner: this.repoOwner,
          name: this.repoName,
          branch: this.branch
        }
      };

    } catch (error) {
      console.error('Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Format and display analysis results
   */
  displayResults(results) {
    console.log('\n' + '='.repeat(80));
    console.log('ERROR ANALYSIS REPORT');
    console.log('='.repeat(80));

    console.log('\n📋 ERROR INFORMATION:');
    console.log(`   Type: ${results.errorInfo.type}`);
    console.log(`   Language: ${results.errorInfo.language || 'Unknown'}`);
    console.log(`   Message: ${results.errorInfo.message}`);
    if (results.errorInfo.fileName) {
      console.log(`   Location: ${results.errorInfo.fileName}:${results.errorInfo.lineNumber}:${results.errorInfo.columnNumber}`);
    }

    console.log('\n📁 REPOSITORY:');
    console.log(`   ${results.repository.owner}/${results.repository.name} (${results.repository.branch})`);

    if (results.relevantFiles.length > 0) {
      console.log('\n📂 RELEVANT FILES:');
      results.relevantFiles.slice(0, 5).forEach((file, idx) => {
        console.log(`   ${idx + 1}. ${file.path} (${file.reason})`);
      });
    }

    results.analysisResults.forEach((analysis, idx) => {
      console.log('\n' + '-'.repeat(80));
      console.log(`ANALYSIS ${idx + 1}: ${analysis.filePath}`);
      console.log('-'.repeat(80));

      if (analysis.codeSnippet) {
        console.log('\n📝 CODE SNIPPET:');
        analysis.codeSnippet.code.forEach(line => {
          const marker = line.isError ? '>>>' : '   ';
          console.log(`${marker} ${line.lineNumber.toString().padStart(4)}: ${line.content}`);
        });
      }

      console.log('\n🔍 POSSIBLE CAUSES:');
      analysis.possibleCauses.forEach((cause, i) => {
        console.log(`   ${i + 1}. ${cause}`);
      });

      console.log('\n💡 SUGGESTED FIXES:');
      analysis.suggestedFixes.forEach((fix, i) => {
        console.log(`   ${i + 1}. ${fix}`);
      });

      console.log('\n✅ BEST PRACTICES:');
      analysis.bestPractices.forEach((practice, i) => {
        console.log(`   ${i + 1}. ${practice}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80) + '\n');
  }
}

module.exports = ErrorAnalyzer;
