#!/usr/bin/env node

/**
 * Create ServiceNow Incident with Error Analysis
 * This script analyzes an error and creates a ServiceNow incident with the analysis attached
 */

const ErrorAnalyzer = require('./error-analyzer');
const ServiceNowIntegration = require('./servicenow-integration');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function printBanner() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         SERVICENOW INCIDENT CREATOR WITH ERROR ANALYSIS                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function printHelp() {
  console.log(`
${colors.bright}USAGE:${colors.reset}
  node create-incident.js [options]

${colors.bright}OPTIONS:${colors.reset}
  --error "<message>"       Error message to analyze
  --repo <url>              GitHub repository URL (default: agentforcedemo)
  --config <path>           Path to ServiceNow config file (default: servicenow-config.json)
  --caller <email>          Caller email address
  --assignment-group <id>   Assignment group sys_id
  --local                   Save report locally instead of creating incident
  --help, -h                Show this help message

${colors.bright}EXAMPLES:${colors.reset}

  ${colors.green}# Create incident with error analysis (requires ServiceNow config)${colors.reset}
  node create-incident.js --error "NullPointerException at line 45" --caller "user@example.com"

  ${colors.green}# Save analysis report locally (no ServiceNow required)${colors.reset}
  node create-incident.js --error "TypeError: undefined" --local

  ${colors.green}# Use custom repository${colors.reset}
  node create-incident.js --repo https://github.com/user/repo --error "Error message" --local

  ${colors.green}# Specify ServiceNow config file${colors.reset}
  node create-incident.js --config ./my-config.json --error "Error message"

${colors.bright}SETUP:${colors.reset}
  1. Copy servicenow-config.example.json to servicenow-config.json
  2. Fill in your ServiceNow instance details
  3. Run this script with --error parameter
  `);
}

async function createIncidentWithAnalysis(options) {
  const {
    errorMessage,
    repoUrl,
    configPath,
    caller,
    assignmentGroup,
    localOnly
  } = options;

  try {
    // Step 1: Analyze the error
    console.log(`\n${colors.blue}${colors.bright}Step 1: Analyzing Error${colors.reset}`);
    console.log('─'.repeat(80));

    const analyzer = new ErrorAnalyzer(repoUrl);
    const analysisResults = await analyzer.analyze(errorMessage);

    console.log(`${colors.green}✓ Analysis completed${colors.reset}`);
    console.log(`  Error Type: ${analysisResults.errorInfo.type}`);
    console.log(`  Language: ${analysisResults.errorInfo.language || 'Unknown'}`);
    console.log(`  Relevant Files: ${analysisResults.relevantFiles.length}`);

    // If local mode, just save the report
    if (localOnly) {
      console.log(`\n${colors.blue}${colors.bright}Local Mode: Saving Report${colors.reset}`);
      console.log('─'.repeat(80));

      const mockServiceNow = new ServiceNowIntegration({
        instanceUrl: 'local',
        username: 'local',
        password: 'local'
      });

      const result = mockServiceNow.saveAnalysisReportToFile(errorMessage, analysisResults);

      console.log(`\n${colors.green}${colors.bright}✓ Report saved successfully!${colors.reset}`);
      console.log(`  File: ${result.filePath}`);
      console.log(`  Size: ${result.content.length} bytes`);

      // Also display the analysis
      console.log(`\n${colors.blue}${colors.bright}Analysis Summary:${colors.reset}`);
      analyzer.displayResults(analysisResults);

      return result;
    }

    // Step 2: Load ServiceNow configuration
    console.log(`\n${colors.blue}${colors.bright}Step 2: Loading ServiceNow Configuration${colors.reset}`);
    console.log('─'.repeat(80));

    if (!fs.existsSync(configPath)) {
      throw new Error(
        `ServiceNow config file not found: ${configPath}\n` +
        `Please copy servicenow-config.example.json to servicenow-config.json and configure it.`
      );
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log(`${colors.green}✓ Configuration loaded${colors.reset}`);
    console.log(`  Instance: ${config.instanceUrl}`);
    console.log(`  User: ${config.username}`);

    // Step 3: Create ServiceNow incident
    console.log(`\n${colors.blue}${colors.bright}Step 3: Creating ServiceNow Incident${colors.reset}`);
    console.log('─'.repeat(80));

    const serviceNow = new ServiceNowIntegration(config);

    // Prepare additional fields
    const additionalFields = {};
    if (caller) additionalFields.caller_id = caller;
    if (assignmentGroup) additionalFields.assignment_group = assignmentGroup;
    if (config.defaultAssignmentGroup && !assignmentGroup) {
      additionalFields.assignment_group = config.defaultAssignmentGroup;
    }

    // Create incident with analysis
    const result = await serviceNow.createIncidentWithAnalysis(
      errorMessage,
      analysisResults,
      additionalFields
    );

    // Step 4: Display results
    console.log(`\n${colors.green}${colors.bright}═══════════════════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}${colors.bright}✓ INCIDENT CREATED SUCCESSFULLY${colors.reset}`);
    console.log(`${colors.green}${colors.bright}═══════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.bright}Incident Details:${colors.reset}`);
    console.log(`  Number: ${colors.cyan}${result.incidentNumber}${colors.reset}`);
    console.log(`  Sys ID: ${result.incidentSysId}`);
    console.log(`  URL: ${colors.blue}${result.incidentUrl}${colors.reset}`);
    console.log(`  Report File: ${result.reportFileName}`);

    console.log(`\n${colors.bright}Error Information:${colors.reset}`);
    console.log(`  Type: ${analysisResults.errorInfo.type}`);
    console.log(`  Language: ${analysisResults.errorInfo.language || 'Unknown'}`);
    console.log(`  Priority: ${result.incident.priority} (${getPriorityText(result.incident.priority)})`);

    console.log(`\n${colors.bright}Analysis Summary:${colors.reset}`);
    if (analysisResults.analysisResults.length > 0) {
      const firstAnalysis = analysisResults.analysisResults[0];
      console.log(`  Possible Causes: ${firstAnalysis.possibleCauses.length}`);
      console.log(`  Suggested Fixes: ${firstAnalysis.suggestedFixes.length}`);
      console.log(`  Best Practices: ${firstAnalysis.bestPractices.length}`);
    }

    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
    console.log(`  1. Open the incident in ServiceNow: ${colors.blue}${result.incidentUrl}${colors.reset}`);
    console.log(`  2. Review the attached analysis report: ${result.reportFileName}`);
    console.log(`  3. Follow the suggested fixes in the report`);
    console.log(`  4. Update the incident with your progress\n`);

    return result;

  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}✗ Error:${colors.reset} ${error.message}\n`);
    throw error;
  }
}

function getPriorityText(priority) {
  const priorities = {
    '1': 'Critical',
    '2': 'High',
    '3': 'Moderate',
    '4': 'Low',
    '5': 'Planning'
  };
  return priorities[priority] || 'Unknown';
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  printBanner();

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // Parse arguments
  let errorMessage = '';
  let repoUrl = 'https://github.com/gauravadeshmukh/agentforcedemo/tree/master';
  let configPath = 'servicenow-config.json';
  let caller = null;
  let assignmentGroup = null;
  let localOnly = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--error':
        if (i + 1 < args.length) {
          errorMessage = args[++i];
        }
        break;

      case '--repo':
        if (i + 1 < args.length) {
          repoUrl = args[++i];
        }
        break;

      case '--config':
        if (i + 1 < args.length) {
          configPath = args[++i];
        }
        break;

      case '--caller':
        if (i + 1 < args.length) {
          caller = args[++i];
        }
        break;

      case '--assignment-group':
        if (i + 1 < args.length) {
          assignmentGroup = args[++i];
        }
        break;

      case '--local':
        localOnly = true;
        break;

      default:
        // Treat as error message if it doesn't start with --
        if (!arg.startsWith('--')) {
          errorMessage += (errorMessage ? ' ' : '') + arg;
        }
    }
  }

  if (!errorMessage) {
    console.error(`${colors.red}Error: No error message provided${colors.reset}`);
    console.log('\nUse --error "your error message" or see --help for usage\n');
    process.exit(1);
  }

  try {
    await createIncidentWithAnalysis({
      errorMessage,
      repoUrl,
      configPath,
      caller,
      assignmentGroup,
      localOnly
    });

    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createIncidentWithAnalysis };
