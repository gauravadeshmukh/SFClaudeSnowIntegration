#!/usr/bin/env node

/**
 * REST API Server for Error Analysis and ServiceNow Incident Creation
 * Provides HTTP endpoints to analyze errors and create incidents
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const ErrorAnalyzer = require('./error-analyzer');
const ServiceNowIntegration = require('./servicenow-integration');

class ErrorAnalyzerAPI {
  constructor(config = {}) {
    this.port = config.port || 3000;
    this.host = config.host || 'localhost';
    this.defaultRepo = config.defaultRepo || 'https://github.com/gauravadeshmukh/agentforcedemo/tree/master';
    this.snowConfigPath = config.snowConfigPath || 'servicenow-config.json';
    this.enableCors = config.enableCors !== false;

    // Load ServiceNow config if available
    this.snowConfig = this.loadServiceNowConfig();
  }

  /**
   * Load ServiceNow configuration
   * Prioritizes environment variables over config file
   */
  loadServiceNowConfig() {
    try {
      // Check environment variables first (for Heroku/production)
      if (process.env.SNOW_INSTANCE && process.env.SNOW_USERNAME && process.env.SNOW_PASSWORD) {
        console.log('✓ ServiceNow config loaded from environment variables');
        return {
          instanceUrl: process.env.SNOW_INSTANCE,
          username: process.env.SNOW_USERNAME,
          password: process.env.SNOW_PASSWORD,
          apiVersion: process.env.SNOW_API_VERSION || 'v1',
          defaultAssignmentGroup: process.env.SNOW_DEFAULT_GROUP || ''
        };
      }

      // Fall back to config file
      if (fs.existsSync(this.snowConfigPath)) {
        console.log('✓ ServiceNow config loaded from file');
        return JSON.parse(fs.readFileSync(this.snowConfigPath, 'utf8'));
      }

      console.log('⚠️  ServiceNow config not found. Incidents will be saved locally.');
      return null;
    } catch (error) {
      console.error('Error loading ServiceNow config:', error.message);
      return null;
    }
  }

  /**
   * Parse JSON body from request
   */
  async parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error('Invalid JSON in request body'));
        }
      });
      req.on('error', reject);
    });
  }

  /**
   * Send JSON response
   */
  sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      ...(this.enableCors ? {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      } : {})
    });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send error response
   */
  sendError(res, statusCode, message, details = null) {
    this.sendResponse(res, statusCode, {
      success: false,
      error: message,
      ...(details && { details })
    });
  }

  /**
   * Handle CORS preflight
   */
  handleCors(req, res) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return true;
    }
    return false;
  }

  /**
   * POST /api/analyze
   * Analyze an error without creating incident
   */
  async handleAnalyze(req, res) {
    try {
      const body = await this.parseBody(req);

      const { error, errorMessage, repo, repository } = body;
      const errorText = error || errorMessage;
      const repoUrl = repo || repository || this.defaultRepo;

      if (!errorText) {
        return this.sendError(res, 400, 'Missing required field: error or errorMessage');
      }

      console.log(`[API] Analyzing error...`);

      const analyzer = new ErrorAnalyzer(repoUrl);
      const results = await analyzer.analyze(errorText);

      console.log(`[API] Analysis completed. Error Type: ${results.errorInfo.type}`);

      this.sendResponse(res, 200, {
        success: true,
        message: 'Error analysis completed',
        data: {
          errorInfo: results.errorInfo,
          repository: results.repository,
          relevantFiles: results.relevantFiles,
          analysisResults: results.analysisResults.map(a => ({
            filePath: a.filePath,
            errorType: a.errorType,
            possibleCauses: a.possibleCauses,
            suggestedFixes: a.suggestedFixes,
            bestPractices: a.bestPractices,
            codeSnippet: a.codeSnippet
          }))
        }
      });

    } catch (error) {
      console.error('[API] Analysis error:', error.message);
      this.sendError(res, 500, 'Error analysis failed', error.message);
    }
  }

  /**
   * POST /api/incident/create
   * Create ServiceNow incident with error analysis
   */
  async handleCreateIncident(req, res) {
    try {
      const body = await this.parseBody(req);

      const {
        error,
        errorMessage,
        caller,
        repo,
        repository,
        assignmentGroup,
        localOnly
      } = body;

      const errorText = error || errorMessage;
      const repoUrl = repo || repository || this.defaultRepo;

      // Validation
      if (!errorText) {
        return this.sendError(res, 400, 'Missing required field: error or errorMessage');
      }

      if (!caller && !localOnly && this.snowConfig) {
        return this.sendError(res, 400, 'Missing required field: caller (required for ServiceNow incidents)');
      }

      console.log(`[API] Creating incident for error...`);

      // Step 1: Analyze error
      const analyzer = new ErrorAnalyzer(repoUrl);
      const analysisResults = await analyzer.analyze(errorText);

      console.log(`[API] Analysis completed. Error Type: ${analysisResults.errorInfo.type}`);

      // Step 2: Create incident or save locally
      let incidentResult;

      if (localOnly || !this.snowConfig) {
        // Local mode
        console.log(`[API] Saving report locally...`);

        const mockServiceNow = new ServiceNowIntegration({
          instanceUrl: 'local',
          username: 'local',
          password: 'local'
        });

        const fileResult = mockServiceNow.saveAnalysisReportToFile(errorText, analysisResults);

        incidentResult = {
          mode: 'local',
          success: true,
          reportFile: fileResult.fileName,
          reportPath: fileResult.filePath,
          reportSize: fileResult.content.length,
          errorType: analysisResults.errorInfo.type,
          language: analysisResults.errorInfo.language,
          relevantFiles: analysisResults.relevantFiles.length
        };

        console.log(`[API] Report saved: ${fileResult.fileName}`);

      } else {
        // ServiceNow mode
        console.log(`[API] Creating ServiceNow incident...`);

        const serviceNow = new ServiceNowIntegration(this.snowConfig);

        const additionalFields = {};
        if (caller) additionalFields.caller_id = caller;
        if (assignmentGroup) additionalFields.assignment_group = assignmentGroup;
        if (this.snowConfig.defaultAssignmentGroup && !assignmentGroup) {
          additionalFields.assignment_group = this.snowConfig.defaultAssignmentGroup;
        }

        const snowResult = await serviceNow.createIncidentWithAnalysis(
          errorText,
          analysisResults,
          additionalFields
        );

        incidentResult = {
          mode: 'servicenow',
          success: true,
          incidentNumber: snowResult.incidentNumber,
          incidentSysId: snowResult.incidentSysId,
          incidentUrl: snowResult.incidentUrl,
          reportFile: snowResult.reportFileName,
          priority: snowResult.incident.priority,
          errorType: analysisResults.errorInfo.type,
          language: analysisResults.errorInfo.language,
          relevantFiles: analysisResults.relevantFiles.length
        };

        console.log(`[API] Incident created: ${snowResult.incidentNumber}`);
      }

      this.sendResponse(res, 201, {
        success: true,
        message: localOnly || !this.snowConfig ? 'Report saved locally' : 'ServiceNow incident created',
        data: incidentResult
      });

    } catch (error) {
      console.error('[API] Incident creation error:', error.message);
      this.sendError(res, 500, 'Failed to create incident', error.message);
    }
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  handleHealth(req, res) {
    const status = {
      success: true,
      service: 'Error Analyzer API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      servicenow: {
        configured: !!this.snowConfig,
        instance: this.snowConfig?.instanceUrl || 'Not configured'
      },
      defaultRepository: this.defaultRepo
    };

    this.sendResponse(res, 200, status);
  }

  /**
   * GET /api/status
   * Get API configuration and status
   */
  handleStatus(req, res) {
    const status = {
      success: true,
      api: {
        version: '1.0.0',
        host: this.host,
        port: this.port
      },
      servicenow: {
        configured: !!this.snowConfig,
        instance: this.snowConfig?.instanceUrl || null,
        mode: this.snowConfig ? 'ServiceNow' : 'Local only'
      },
      repository: {
        default: this.defaultRepo
      },
      endpoints: [
        { method: 'GET', path: '/api/health', description: 'Health check' },
        { method: 'GET', path: '/api/status', description: 'API status and configuration' },
        { method: 'POST', path: '/api/analyze', description: 'Analyze error without creating incident' },
        { method: 'POST', path: '/api/incident/create', description: 'Create incident with error analysis' }
      ]
    };

    this.sendResponse(res, 200, status);
  }

  /**
   * Main request handler
   */
  async handleRequest(req, res) {
    // Handle CORS preflight
    if (this.handleCors(req, res)) return;

    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;

    console.log(`[API] ${req.method} ${path}`);

    try {
      // Route handling
      if (path === '/api/health' && req.method === 'GET') {
        return this.handleHealth(req, res);
      }

      if (path === '/api/status' && req.method === 'GET') {
        return this.handleStatus(req, res);
      }

      if (path === '/api/analyze' && req.method === 'POST') {
        return await this.handleAnalyze(req, res);
      }

      if (path === '/api/incident/create' && req.method === 'POST') {
        return await this.handleCreateIncident(req, res);
      }

      // 404 - Not Found
      this.sendError(res, 404, 'Endpoint not found', `${req.method} ${path} is not a valid endpoint`);

    } catch (error) {
      console.error('[API] Unexpected error:', error);
      this.sendError(res, 500, 'Internal server error', error.message);
    }
  }

  /**
   * Start the server
   */
  start() {
    const server = http.createServer((req, res) => this.handleRequest(req, res));

    server.listen(this.port, this.host, () => {
      console.log('\n' + '='.repeat(80));
      console.log('ERROR ANALYZER API SERVER');
      console.log('='.repeat(80));
      console.log(`\n✓ Server running at http://${this.host}:${this.port}`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   GET  http://${this.host}:${this.port}/api/health`);
      console.log(`   GET  http://${this.host}:${this.port}/api/status`);
      console.log(`   POST http://${this.host}:${this.port}/api/analyze`);
      console.log(`   POST http://${this.host}:${this.port}/api/incident/create`);
      console.log(`\n🔧 Configuration:`);
      console.log(`   ServiceNow: ${this.snowConfig ? '✓ Configured' : '✗ Not configured (local mode)'}`);
      if (this.snowConfig) {
        console.log(`   Instance: ${this.snowConfig.instanceUrl}`);
      }
      console.log(`   Default Repo: ${this.defaultRepo}`);
      console.log(`\n📖 Documentation: See API-DOCUMENTATION.md`);
      console.log(`\n` + '='.repeat(80) + '\n');
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${this.port} is already in use.`);
        console.error(`   Please stop the other process or use a different port.\n`);
      } else {
        console.error(`\n❌ Server error:`, error.message, '\n');
      }
      process.exit(1);
    });

    return server;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse command line arguments with environment variable fallbacks
  let port = process.env.PORT || 3000;
  let host = process.env.HOST || 'localhost';
  let configPath = process.env.SNOW_CONFIG_PATH || 'servicenow-config.json';
  let repo = process.env.DEFAULT_REPO || 'https://github.com/gauravadeshmukh/agentforcedemo/tree/master';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && i + 1 < args.length) {
      port = parseInt(args[++i]);
    } else if (args[i] === '--host' && i + 1 < args.length) {
      host = args[++i];
    } else if (args[i] === '--config' && i + 1 < args.length) {
      configPath = args[++i];
    } else if (args[i] === '--repo' && i + 1 < args.length) {
      repo = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Error Analyzer API Server

USAGE:
  node api-server.js [options]

OPTIONS:
  --port <number>     Port to listen on (default: 3000)
  --host <string>     Host to bind to (default: localhost)
  --config <path>     Path to ServiceNow config (default: servicenow-config.json)
  --repo <url>        Default GitHub repository URL
  --help, -h          Show this help message

EXAMPLES:
  node api-server.js
  node api-server.js --port 8080
  node api-server.js --host 0.0.0.0 --port 3000
      `);
      process.exit(0);
    }
  }

  const api = new ErrorAnalyzerAPI({
    port,
    host,
    snowConfigPath: configPath,
    defaultRepo: repo
  });

  api.start();
}

module.exports = ErrorAnalyzerAPI;
