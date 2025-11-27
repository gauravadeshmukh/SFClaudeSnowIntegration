/**
 * Enhanced Error Analysis Workflow
 *
 * This module implements the complete error analysis workflow:
 * 1. Analyze error message and identify context
 * 2. Scan GitHub repository for latest codebase
 * 3. Locate related/affected classes, components, and metadata
 * 4. Provide complete analysis with fix approach and recommendations
 * 5. Apply code updates directly to affected files (NO git commits)
 *
 * Usage:
 *   const workflow = new EnhancedErrorWorkflow(githubRepo);
 *   await workflow.processError(errorMessage);
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const ClaudeAIAnalyzer = require('./claude-ai-analyzer');

class EnhancedErrorWorkflow {
  constructor(githubRepo, options = {}) {
    this.githubRepo = githubRepo;
    this.claudeAnalyzer = new ClaudeAIAnalyzer(options.claudeApiKey);
    this.useAI = options.useAI !== false && this.claudeAnalyzer.isEnabled();

    // Parse repository information
    const repoMatch = githubRepo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!repoMatch) {
      throw new Error('Invalid GitHub repository URL');
    }

    this.repoOwner = repoMatch[1];
    this.repoName = repoMatch[2].replace(/\.git$/, '').replace(/\/tree\/.*$/, '');

    // Extract branch if specified in URL
    const branchMatch = githubRepo.match(/\/tree\/([^\/]+)/);
    this.branch = branchMatch ? branchMatch[1] : 'master';

    // Local workspace path (where files will be updated)
    this.localWorkspace = options.localWorkspace || process.cwd();

    console.log('\n' + '='.repeat(80));
    console.log('ENHANCED ERROR ANALYSIS WORKFLOW');
    console.log('='.repeat(80));
    console.log(`Repository: ${this.repoOwner}/${this.repoName}`);
    console.log(`Branch: ${this.branch}`);
    console.log(`Local Workspace: ${this.localWorkspace}`);
    console.log(`AI Analysis: ${this.useAI ? 'ENABLED' : 'DISABLED'}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * STEP 1: Analyze error message and identify context
   */
  analyzeErrorMessage(errorMessage) {
    console.log('\n📋 STEP 1: Analyzing Error Message');
    console.log('-'.repeat(80));

    const errorInfo = {
      message: errorMessage,
      type: 'Unknown',
      language: 'Unknown',
      fileName: null,
      className: null,
      methodName: null,
      lineNumber: null,
      columnNumber: null,
      severity: 'error',
      category: 'runtime'
    };

    // Salesforce/Apex errors
    if (errorMessage.includes('System.')) {
      errorInfo.language = 'apex';

      // Extract error type
      const typeMatch = errorMessage.match(/System\.(\w+Exception)/);
      if (typeMatch) {
        errorInfo.type = typeMatch[1];
      }

      // Extract class and method
      const classMatch = errorMessage.match(/Class\.(\w+)\.(\w+)/);
      if (classMatch) {
        errorInfo.className = classMatch[1];
        errorInfo.methodName = classMatch[2];
        errorInfo.fileName = `${classMatch[1]}.cls`;
      }

      // Extract line and column numbers
      const lineMatch = errorMessage.match(/line (\d+)(?:, column (\d+))?/);
      if (lineMatch) {
        errorInfo.lineNumber = parseInt(lineMatch[1]);
        errorInfo.columnNumber = lineMatch[2] ? parseInt(lineMatch[2]) : null;
      }

      // Categorize error
      if (errorInfo.type === 'LimitException') {
        errorInfo.category = 'governor-limit';
        errorInfo.severity = 'critical';
      } else if (errorInfo.type === 'NullPointerException') {
        errorInfo.category = 'null-reference';
        errorInfo.severity = 'high';
      } else if (errorInfo.type === 'DmlException') {
        errorInfo.category = 'database';
        errorInfo.severity = 'high';
      } else if (errorInfo.type === 'StringException') {
        errorInfo.category = 'data-validation';
        errorInfo.severity = 'high';
      } else if (errorInfo.type === 'QueryException') {
        errorInfo.category = 'database';
        errorInfo.severity = 'high';
      }
    }
    // JavaScript/TypeScript errors
    else if (errorMessage.match(/TypeError|ReferenceError|SyntaxError/)) {
      errorInfo.language = 'javascript';

      const typeMatch = errorMessage.match(/(TypeError|ReferenceError|SyntaxError)/);
      if (typeMatch) {
        errorInfo.type = typeMatch[1];
      }

      // Extract file and line
      const locationMatch = errorMessage.match(/at\s+(?:.*?\s+)?\(?(.*?):(\d+):(\d+)\)?/);
      if (locationMatch) {
        errorInfo.fileName = locationMatch[1].split('/').pop();
        errorInfo.lineNumber = parseInt(locationMatch[2]);
        errorInfo.columnNumber = parseInt(locationMatch[3]);
      }

      errorInfo.category = errorInfo.type === 'SyntaxError' ? 'syntax' : 'runtime';
      errorInfo.severity = 'high';
    }
    // Python errors
    else if (errorMessage.match(/Error:|Exception:/)) {
      errorInfo.language = 'python';
      const typeMatch = errorMessage.match(/(\w+(?:Error|Exception))/);
      if (typeMatch) errorInfo.type = typeMatch[1];
    }

    console.log('Error Analysis:');
    console.log(`  Type: ${errorInfo.type}`);
    console.log(`  Language: ${errorInfo.language}`);
    console.log(`  Severity: ${errorInfo.severity}`);
    console.log(`  Category: ${errorInfo.category}`);
    if (errorInfo.fileName) console.log(`  File: ${errorInfo.fileName}`);
    if (errorInfo.className) console.log(`  Class: ${errorInfo.className}`);
    if (errorInfo.methodName) console.log(`  Method: ${errorInfo.methodName}`);
    if (errorInfo.lineNumber) console.log(`  Line: ${errorInfo.lineNumber}`);

    return errorInfo;
  }

  /**
   * STEP 2: Scan GitHub repository for latest code
   */
  async scanGitHubRepository(errorInfo) {
    console.log('\n🔍 STEP 2: Scanning GitHub Repository for Latest Code');
    console.log('-'.repeat(80));

    const results = {
      primaryFile: null,
      relatedFiles: [],
      metadata: [],
      totalFiles: 0
    };

    try {
      // Find primary file
      if (errorInfo.fileName) {
        console.log(`Searching for primary file: ${errorInfo.fileName}...`);
        const primaryFile = await this.findFileInRepo(errorInfo.fileName);

        if (primaryFile) {
          results.primaryFile = primaryFile;
          console.log(`✓ Found primary file: ${primaryFile.path}`);

          // Fetch file content
          primaryFile.content = await this.fetchFileContent(primaryFile.path);
          primaryFile.lines = primaryFile.content.split('\n');
          console.log(`  Lines of code: ${primaryFile.lines.length}`);
        } else {
          console.log(`✗ Primary file not found in repository`);
        }
      }

      // Find related files based on error context
      console.log('\nSearching for related files...');
      const relatedPatterns = this.getRelatedFilePatterns(errorInfo);

      for (const pattern of relatedPatterns) {
        const files = await this.searchFilesInRepo(pattern.search, pattern.type);
        if (files.length > 0) {
          console.log(`  Found ${files.length} ${pattern.description}`);
          results.relatedFiles.push(...files.map(f => ({
            ...f,
            relationship: pattern.description,
            reason: pattern.reason
          })));
        }
      }

      // Find metadata files (Salesforce specific)
      if (errorInfo.language === 'apex' && errorInfo.className) {
        console.log('\nSearching for Salesforce metadata...');
        const metadataPatterns = [
          `${errorInfo.className}.cls-meta.xml`,
          `${errorInfo.className}.trigger-meta.xml`,
          'package.xml',
          'sfdx-project.json'
        ];

        for (const pattern of metadataPatterns) {
          const files = await this.searchFilesInRepo(pattern, 'metadata');
          if (files.length > 0) {
            console.log(`  Found: ${pattern}`);
            results.metadata.push(...files);
          }
        }
      }

      results.totalFiles = 1 + results.relatedFiles.length + results.metadata.length;
      console.log(`\n✓ Repository scan complete. Found ${results.totalFiles} relevant files.`);

      return results;

    } catch (error) {
      console.error('Error scanning repository:', error.message);
      return results;
    }
  }

  /**
   * STEP 3: Locate affected components and analyze dependencies
   */
  async locateAffectedComponents(errorInfo, scanResults) {
    console.log('\n🎯 STEP 3: Locating Affected Components');
    console.log('-'.repeat(80));

    const affected = {
      direct: [],      // Directly affected by the error
      indirect: [],    // Indirectly affected (dependencies)
      tests: [],       // Test files that need attention
      config: []       // Configuration files
    };

    // Primary file is directly affected
    if (scanResults.primaryFile) {
      affected.direct.push({
        file: scanResults.primaryFile.path,
        reason: 'Error occurred in this file',
        line: errorInfo.lineNumber,
        priority: 'critical'
      });
    }

    // Analyze related files for impact
    for (const file of scanResults.relatedFiles) {
      if (file.relationship.includes('trigger')) {
        affected.indirect.push({
          file: file.path,
          reason: 'Trigger may invoke affected class',
          priority: 'high'
        });
      } else if (file.relationship.includes('test')) {
        affected.tests.push({
          file: file.path,
          reason: 'Test coverage for affected code',
          priority: 'medium'
        });
      } else if (file.relationship.includes('service') || file.relationship.includes('handler')) {
        affected.indirect.push({
          file: file.path,
          reason: 'May use similar patterns or call affected code',
          priority: 'medium'
        });
      }
    }

    // Metadata files
    for (const file of scanResults.metadata) {
      affected.config.push({
        file: file.path,
        reason: 'Configuration/metadata for affected component',
        priority: 'low'
      });
    }

    console.log('Affected Components:');
    console.log(`  Direct: ${affected.direct.length} files`);
    affected.direct.forEach(a => console.log(`    - ${a.file} (${a.priority})`));

    console.log(`  Indirect: ${affected.indirect.length} files`);
    affected.indirect.forEach(a => console.log(`    - ${a.file} (${a.priority})`));

    if (affected.tests.length > 0) {
      console.log(`  Tests: ${affected.tests.length} files`);
      affected.tests.forEach(a => console.log(`    - ${a.file}`));
    }

    return affected;
  }

  /**
   * STEP 4: Complete analysis with AI-powered insights
   */
  async performCompleteAnalysis(errorInfo, scanResults, affectedComponents) {
    console.log('\n🤖 STEP 4: Complete Analysis with AI-Powered Insights');
    console.log('-'.repeat(80));

    const analysis = {
      errorContext: errorInfo,
      affectedFiles: affectedComponents,
      rootCause: null,
      fixApproach: null,
      recommendations: [],
      codeChanges: [],
      preventionStrategy: null,
      bestPractices: []
    };

    if (this.useAI && scanResults.primaryFile) {
      console.log('Using Claude AI for intelligent analysis...\n');

      // Extract code snippet around error
      const codeSnippet = this.extractCodeSnippet(
        scanResults.primaryFile.lines,
        errorInfo.lineNumber
      );

      try {
        const aiAnalysis = await this.claudeAnalyzer.analyzeError(
          errorInfo,
          codeSnippet,
          scanResults.primaryFile.path,
          {
            owner: this.repoOwner,
            name: this.repoName,
            branch: this.branch
          }
        );

        analysis.rootCause = aiAnalysis.rootCauseAnalysis;
        analysis.recommendations = aiAnalysis.suggestedFixes || [];
        analysis.preventionStrategy = aiAnalysis.preventionStrategy;
        analysis.bestPractices = aiAnalysis.bestPractices || [];

        console.log('AI Analysis Results:');
        console.log('\nRoot Cause:');
        console.log(aiAnalysis.rootCauseAnalysis);

        if (aiAnalysis.codeContextInsights && aiAnalysis.codeContextInsights.length > 0) {
          console.log('\nCode Insights:');
          aiAnalysis.codeContextInsights.forEach((insight, i) => {
            console.log(`  ${i + 1}. ${insight}`);
          });
        }

      } catch (error) {
        console.error('AI analysis error:', error.message);
        console.log('Falling back to rule-based analysis...');
      }
    }

    // Rule-based analysis (always included as backup)
    if (!analysis.rootCause) {
      analysis.rootCause = this.getRuleBasedRootCause(errorInfo);
      analysis.recommendations = this.getRuleBasedRecommendations(errorInfo);

      // Add best practices for common error types
      analysis.bestPractices = this.getRuleBasedBestPractices(errorInfo);

      // Add prevention strategy
      analysis.preventionStrategy = this.getRuleBasedPreventionStrategy(errorInfo);

      console.log('Rule-based Analysis Results:');
      console.log('\nRoot Cause:');
      console.log(analysis.rootCause);
      console.log('\nRecommendations:');
      analysis.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    // Generate fix approach
    analysis.fixApproach = this.generateFixApproach(errorInfo, analysis);

    return analysis;
  }

  /**
   * STEP 5: Apply code fixes directly to local files (NO commits)
   */
  async applyCodeFixes(analysis, scanResults) {
    console.log('\n✏️  STEP 5: Applying Code Fixes to Local Files');
    console.log('-'.repeat(80));
    console.log('⚠️  NOTE: Changes will be applied to local workspace. NO git commits will be made.\n');

    const appliedChanges = [];

    // Generate fix code if AI is enabled
    if (this.useAI && scanResults.primaryFile && analysis.errorContext.lineNumber) {
      try {
        const codeSnippet = this.extractCodeSnippet(
          scanResults.primaryFile.lines,
          analysis.errorContext.lineNumber
        );

        console.log('Generating fix code with AI...');
        const fixResult = await this.claudeAnalyzer.generateFixCode(
          analysis.errorContext,
          codeSnippet,
          scanResults.primaryFile.path
        );

        if (fixResult && fixResult.fixedCode) {
          // Determine local file path
          const localFilePath = this.getLocalFilePath(scanResults.primaryFile.path);

          console.log(`\nApplying fix to: ${localFilePath}`);
          console.log('Changes:');
          fixResult.changes.forEach((change, i) => {
            console.log(`  ${i + 1}. ${change}`);
          });

          // Write fixed code to local file
          try {
            await fs.writeFile(localFilePath, fixResult.fixedCode, 'utf8');
            console.log(`✓ Successfully updated ${localFilePath}`);

            appliedChanges.push({
              file: localFilePath,
              changes: fixResult.changes,
              explanation: fixResult.explanation
            });
          } catch (writeError) {
            console.error(`✗ Failed to write file: ${writeError.message}`);
            console.log('\nGenerated fix code:');
            console.log('-'.repeat(80));
            console.log(fixResult.fixedCode);
            console.log('-'.repeat(80));
          }
        }

      } catch (error) {
        console.error('Error generating fix:', error.message);
      }
    }

    // Display recommendations for manual fixes
    if (analysis.recommendations.length > 0 && appliedChanges.length === 0) {
      console.log('\nRecommended fixes to apply manually:');
      analysis.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. ${rec}`);
      });
    }

    console.log(`\n✓ Applied ${appliedChanges.length} automatic fix(es).`);

    return appliedChanges;
  }

  /**
   * Main workflow execution
   */
  async processError(errorMessage) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('PROCESSING ERROR');
    console.log('='.repeat(80));
    console.log(`Error: ${errorMessage.substring(0, 100)}...`);
    console.log('='.repeat(80));

    try {
      // STEP 1: Analyze error message
      const errorInfo = this.analyzeErrorMessage(errorMessage);

      // STEP 2: Scan GitHub repository
      const scanResults = await this.scanGitHubRepository(errorInfo);

      // STEP 3: Locate affected components
      const affectedComponents = await this.locateAffectedComponents(errorInfo, scanResults);

      // STEP 4: Complete analysis
      const analysis = await this.performCompleteAnalysis(errorInfo, scanResults, affectedComponents);

      // STEP 5: Apply fixes
      const appliedChanges = await this.applyCodeFixes(analysis, scanResults);

      // Final summary
      console.log('\n' + '='.repeat(80));
      console.log('WORKFLOW COMPLETE');
      console.log('='.repeat(80));
      console.log('\nSummary:');
      console.log(`  Error Type: ${errorInfo.type}`);
      console.log(`  Files Scanned: ${scanResults.totalFiles}`);
      console.log(`  Affected Components: ${affectedComponents.direct.length + affectedComponents.indirect.length}`);
      console.log(`  Automatic Fixes Applied: ${appliedChanges.length}`);
      console.log(`  Manual Recommendations: ${analysis.recommendations.length}`);
      console.log('\n✓ Analysis complete. Review changes and test thoroughly.');
      console.log('='.repeat(80) + '\n');

      return {
        success: true,
        errorInfo,
        scanResults,
        affectedComponents,
        analysis,
        appliedChanges
      };

    } catch (error) {
      console.error('\n❌ Workflow error:', error.message);
      console.error(error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper methods

  extractCodeSnippet(lines, errorLine, contextLines = 5) {
    if (!errorLine || !lines) {
      return { code: [], errorLine: 0 };
    }

    const startLine = Math.max(1, errorLine - contextLines);
    const endLine = Math.min(lines.length, errorLine + contextLines);

    const code = [];
    for (let i = startLine; i <= endLine; i++) {
      code.push({
        lineNumber: i,
        content: lines[i - 1] || '',
        isError: i === errorLine
      });
    }

    return {
      code,
      errorLine,
      startLine,
      endLine
    };
  }

  getRelatedFilePatterns(errorInfo) {
    const patterns = [];

    if (errorInfo.language === 'apex' && errorInfo.className) {
      patterns.push(
        { search: `${errorInfo.className}Test`, type: 'test', description: 'test classes', reason: 'Test coverage' },
        { search: `${errorInfo.className}Trigger`, type: 'trigger', description: 'triggers', reason: 'May invoke this class' },
        { search: `${errorInfo.className}Handler`, type: 'handler', description: 'handler classes', reason: 'Related handler logic' },
        { search: `${errorInfo.className}Service`, type: 'service', description: 'service classes', reason: 'Related service logic' }
      );
    }

    return patterns;
  }

  getRuleBasedRootCause(errorInfo) {
    const causes = {
      'NullPointerException': 'Attempted to access a property or method on a null object reference.',
      'LimitException': 'Exceeded Salesforce governor limits (SOQL queries, DML statements, CPU time, etc.).',
      'DmlException': 'Database operation failed due to validation rules, required fields, or constraints.',
      'StringException': `Invalid String operation or format. Common causes:\n- Invalid ID format (IDs must be 15 or 18 characters)\n- String conversion failure\n- Invalid type cast from String\n- Malformed data in String field\n\nSpecific to this error (Invalid id: ${errorInfo.message.match(/Invalid id: (\S+)/)?.[1] || 'unknown'}):\n- The ID "${errorInfo.message.match(/Invalid id: (\S+)/)?.[1] || 'unknown'}" is not a valid Salesforce ID\n- Salesforce IDs must be exactly 15 or 18 characters\n- The provided ID appears to be ${errorInfo.message.match(/Invalid id: (\S+)/)?.[1]?.length || 0} characters long`,
      'TypeError': 'Attempted to perform an operation on an incompatible type.',
      'ReferenceError': 'Attempted to access an undefined variable or function.',
      'SyntaxError': 'Code contains invalid syntax that prevents parsing.'
    };

    return causes[errorInfo.type] || 'Unable to determine root cause automatically.';
  }

  getRuleBasedRecommendations(errorInfo) {
    const invalidId = errorInfo.message.match(/Invalid id: (\S+)/)?.[1];

    const recommendations = {
      'NullPointerException': [
        'Add null checks before accessing object properties',
        'Ensure relationship fields are included in SOQL queries',
        'Use defensive programming with try-catch blocks'
      ],
      'LimitException': [
        'Bulkify code to process records in collections',
        'Move SOQL queries outside of loops',
        'Use @future or Queueable for async processing',
        'Optimize query selectors to reduce query count'
      ],
      'DmlException': [
        'Validate required fields before DML operations',
        'Review validation rules and triggers',
        'Use Database.insert/update with allOrNone=false for partial success'
      ],
      'StringException': [
        'Validate ID format before using (must be 15 or 18 characters)',
        `Add validation check:\n\`\`\`apex\nif (String.isNotBlank(idValue) && (idValue.length() == 15 || idValue.length() == 18)) {\n    // Safe to use ID\n} else {\n    throw new CustomException('Invalid ID format: ' + idValue);\n}\n\`\`\``,
        'Use try-catch when converting strings to IDs to handle invalid formats gracefully',
        `Check the source of ID "${invalidId || 'unknown'}" - it may be:\n  - User input that needs validation\n  - Data from external system requiring sanitization\n  - Hardcoded value that needs correction\n  - Query result that returned unexpected format`,
        'Consider using Schema.SObjectType methods to validate object types',
        'Add unit tests to verify ID validation logic with various invalid inputs'
      ]
    };

    return recommendations[errorInfo.type] || ['Review code logic and add appropriate error handling'];
  }

  getRuleBasedBestPractices(errorInfo) {
    const bestPractices = {
      'StringException': [
        'Always validate Salesforce IDs before using them in queries or DML operations',
        'Use try-catch blocks when converting user input or external data to IDs',
        'Implement centralized ID validation utility methods',
        'Add input validation at the API/service layer boundary',
        'Use Schema.SObjectType to validate object types match expected IDs',
        'Document expected ID formats in method parameters and variable names'
      ],
      'NullPointerException': [
        'Always check for null before accessing object properties',
        'Use Optional pattern or null-safe operators where available',
        'Include all required fields in SOQL queries',
        'Document null-handling expectations in method contracts'
      ],
      'LimitException': [
        'Design all code to be bulk-safe from the start',
        'Use collections for all data operations',
        'Avoid SOQL/DML inside loops',
        'Monitor governor limits in development and testing'
      ],
      'DmlException': [
        'Validate all data before DML operations',
        'Use Database class methods with proper error handling',
        'Test with various data scenarios including edge cases',
        'Document validation requirements clearly'
      ]
    };

    return bestPractices[errorInfo.type] || [
      'Implement comprehensive error handling',
      'Add appropriate logging for debugging',
      'Write unit tests covering error scenarios',
      'Document error handling approach in code comments'
    ];
  }

  getRuleBasedPreventionStrategy(errorInfo) {
    const strategies = {
      'StringException': `Prevention Strategy for StringException:

1. **Input Validation Layer**: Create a reusable utility class for ID validation
   - Centralize all ID validation logic
   - Validate length (15 or 18 characters)
   - Validate format (alphanumeric)
   - Validate object type if known

2. **Defensive Programming**:
   - Never trust user input or external data
   - Always validate before using IDs in queries or DML
   - Use try-catch for ID conversions

3. **Code Review Checklist**:
   - Review all places where IDs are accepted as input
   - Ensure validation exists at entry points
   - Check error messages are user-friendly

4. **Testing Strategy**:
   - Unit tests with invalid ID formats (too short, too long, special characters)
   - Integration tests with real-world bad data scenarios
   - Negative test cases for all ID validation paths

5. **Static Analysis**:
   - Use PMD or similar tools to detect missing validation
   - Add custom rules for ID handling patterns
   - Regular code audits for data validation

Example Utility Method:
\`\`\`apex
public class IdValidator {
    public static Boolean isValidId(String idValue) {
        if (String.isBlank(idValue)) return false;
        if (idValue.length() != 15 && idValue.length() != 18) return false;

        try {
            Id testId = (Id)idValue;
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static Id validateAndConvert(String idValue, String fieldName) {
        if (!isValidId(idValue)) {
            throw new CustomValidationException(
                'Invalid ID format for ' + fieldName + ': ' + idValue
            );
        }
        return (Id)idValue;
    }
}
\`\`\``,
      'NullPointerException': `Prevention Strategy for NullPointerException:
- Implement null checks for all object property accesses
- Use defensive programming patterns
- Include relationship fields in SOQL queries when accessing them
- Add comprehensive unit tests for null scenarios`,
      'LimitException': `Prevention Strategy for LimitException:
- Design all code to be bulkified from the start
- Never put SOQL or DML inside loops
- Use collections for data processing
- Implement governor limit monitoring in tests`,
      'DmlException': `Prevention Strategy for DmlException:
- Validate all required fields before DML
- Use Database methods with error handling
- Test with various data scenarios
- Review validation rules and triggers`
    };

    return strategies[errorInfo.type] || 'Implement comprehensive testing and code review processes to catch similar errors early.';
  }

  generateFixApproach(errorInfo, analysis) {
    const immediate = errorInfo.type === 'StringException'
      ? `Add ID validation in ${errorInfo.className}.${errorInfo.methodName} at line ${errorInfo.lineNumber}`
      : 'Apply the suggested code fixes to resolve the error';

    const shortTerm = errorInfo.type === 'StringException'
      ? 'Add unit tests for invalid ID scenarios and create reusable ID validation utility'
      : 'Add test coverage to prevent regression';

    const longTerm = errorInfo.type === 'StringException'
      ? 'Implement organization-wide ID validation standards and static analysis rules'
      : (analysis.preventionStrategy || 'Implement coding standards and static analysis');

    return { immediate, shortTerm, longTerm };
  }

  getLocalFilePath(githubPath) {
    // Convert GitHub path to local workspace path
    // Assumes local workspace mirrors repository structure
    return path.join(this.localWorkspace, githubPath);
  }

  // GitHub API helpers

  async findFileInRepo(filename) {
    const searchUrl = `https://api.github.com/search/code?q=filename:${filename}+repo:${this.repoOwner}/${this.repoName}`;

    try {
      const result = await this.githubApiRequest(searchUrl);
      if (result.items && result.items.length > 0) {
        return {
          path: result.items[0].path,
          sha: result.items[0].sha,
          url: result.items[0].html_url
        };
      }
    } catch (error) {
      console.error(`Error finding file ${filename}:`, error.message);
    }

    return null;
  }

  async searchFilesInRepo(searchTerm, type) {
    const searchUrl = `https://api.github.com/search/code?q=${searchTerm}+in:path+repo:${this.repoOwner}/${this.repoName}`;

    try {
      const result = await this.githubApiRequest(searchUrl);
      return result.items || [];
    } catch (error) {
      console.error(`Error searching for ${searchTerm}:`, error.message);
      return [];
    }
  }

  async fetchFileContent(filePath) {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${filePath}?ref=${this.branch}`;

    try {
      const result = await this.githubApiRequest(url);
      if (result.content) {
        return Buffer.from(result.content, 'base64').toString('utf8');
      }
    } catch (error) {
      console.error(`Error fetching file ${filePath}:`, error.message);
    }

    return '';
  }

  githubApiRequest(url) {
    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Error-Analyzer',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      https.get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse GitHub API response'));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = EnhancedErrorWorkflow;
