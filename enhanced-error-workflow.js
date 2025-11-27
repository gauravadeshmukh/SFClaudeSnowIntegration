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
      'TypeError': 'Attempted to perform an operation on an incompatible type.',
      'ReferenceError': 'Attempted to access an undefined variable or function.',
      'SyntaxError': 'Code contains invalid syntax that prevents parsing.'
    };

    return causes[errorInfo.type] || 'Unable to determine root cause automatically.';
  }

  getRuleBasedRecommendations(errorInfo) {
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
      ]
    };

    return recommendations[errorInfo.type] || ['Review code logic and add appropriate error handling'];
  }

  generateFixApproach(errorInfo, analysis) {
    return {
      immediate: 'Apply the suggested code fixes to resolve the error',
      shortTerm: 'Add test coverage to prevent regression',
      longTerm: analysis.preventionStrategy || 'Implement coding standards and static analysis'
    };
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
