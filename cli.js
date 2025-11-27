#!/usr/bin/env node

/**
 * CLI Interface for Error Analyzer
 * Usage: node cli.js [options]
 */

const ErrorAnalyzer = require('./error-analyzer');
const readline = require('readline');

// Default repository
const DEFAULT_REPO = 'https://github.com/gauravadeshmukh/agentforcedemo/tree/master';

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
  console.log('║                          ERROR ANALYZER CLI                                ║');
  console.log('║              Intelligent Error Analysis Against GitHub Repos               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
}

function printHelp() {
  console.log(`
${colors.bright}USAGE:${colors.reset}
  node cli.js [--repo <github-url>] [--error "<error-message>"]
  node cli.js --interactive
  node cli.js --help

${colors.bright}OPTIONS:${colors.reset}
  --repo <url>          GitHub repository URL (default: agentforcedemo)
  --error "<message>"   Error message to analyze
  --interactive, -i     Interactive mode (prompts for input)
  --help, -h            Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  ${colors.green}# Analyze a specific error${colors.reset}
  node cli.js --error "NullPointerException at AccountHandler.cls:45"

  ${colors.green}# Analyze against a different repository${colors.reset}
  node cli.js --repo https://github.com/user/repo --error "TypeError: undefined"

  ${colors.green}# Interactive mode${colors.reset}
  node cli.js -i

${colors.bright}SUPPORTED ERROR TYPES:${colors.reset}
  - Apex: NullPointerException, DmlException, LimitException
  - JavaScript: TypeError, ReferenceError, SyntaxError
  - Java: NullPointerException, IllegalArgumentException
  - Python: AttributeError, TypeError, ValueError
  `);
}

async function analyzeError(repoUrl, errorMessage) {
  try {
    const analyzer = new ErrorAnalyzer(repoUrl);
    console.log(`\n${colors.blue}Analyzing error against: ${analyzer.repoOwner}/${analyzer.repoName}${colors.reset}\n`);

    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);

    return results;
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Error:${colors.reset} ${error.message}\n`);
    throw error;
  }
}

async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log(`\n${colors.yellow}Interactive Mode${colors.reset}`);
    console.log('Press Ctrl+C to exit\n');

    const repoUrl = await question(`Repository URL (press Enter for default): `);
    const finalRepo = repoUrl.trim() || DEFAULT_REPO;

    console.log(`\n${colors.cyan}Paste your error message below (press Enter twice when done):${colors.reset}`);

    let errorMessage = '';
    let emptyLineCount = 0;

    rl.on('line', async (line) => {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2 && errorMessage.trim()) {
          rl.close();
          await analyzeError(finalRepo, errorMessage);

          // Ask if user wants to analyze another error
          const rl2 = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          rl2.question('\nAnalyze another error? (y/n): ', (answer) => {
            rl2.close();
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
              interactiveMode();
            } else {
              console.log('\nGoodbye!\n');
              process.exit(0);
            }
          });
        }
      } else {
        errorMessage += line + '\n';
        emptyLineCount = 0;
      }
    });

  } catch (error) {
    console.error(`\n${colors.red}Error in interactive mode:${colors.reset}`, error.message);
    rl.close();
  }
}

async function main() {
  const args = process.argv.slice(2);

  printBanner();

  // No arguments - show help
  if (args.length === 0) {
    printHelp();
    return;
  }

  // Parse arguments
  let repoUrl = DEFAULT_REPO;
  let errorMessage = '';
  let interactive = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        printHelp();
        return;

      case '--interactive':
      case '-i':
        interactive = true;
        break;

      case '--repo':
        if (i + 1 < args.length) {
          repoUrl = args[++i];
        } else {
          console.error(`${colors.red}Error: --repo requires a URL argument${colors.reset}`);
          process.exit(1);
        }
        break;

      case '--error':
        if (i + 1 < args.length) {
          errorMessage = args[++i];
        } else {
          console.error(`${colors.red}Error: --error requires a message argument${colors.reset}`);
          process.exit(1);
        }
        break;

      default:
        // Treat as error message if it doesn't start with --
        if (!arg.startsWith('--')) {
          errorMessage += (errorMessage ? ' ' : '') + arg;
        }
    }
  }

  // Execute based on mode
  if (interactive) {
    await interactiveMode();
  } else if (errorMessage) {
    await analyzeError(repoUrl, errorMessage);
  } else {
    console.log(`${colors.yellow}No error message provided. Use --error or --interactive mode.${colors.reset}\n`);
    printHelp();
  }
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error(`\n${colors.red}Fatal error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = { analyzeError, interactiveMode };
