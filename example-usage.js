/**
 * Example Usage of Error Analyzer
 * Demonstrates how to use the Error Analyzer to analyze errors against a GitHub repository
 */

const ErrorAnalyzer = require('./error-analyzer');

// Initialize analyzer with GitHub repository
const analyzer = new ErrorAnalyzer('https://github.com/gauravadeshmukh/agentforcedemo/tree/master');

// Example 1: Apex NullPointerException
async function example1_ApexNullPointer() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 1: Apex NullPointerException');
  console.log('='.repeat(80));

  const errorMessage = `
System.NullPointerException: Attempt to de-reference a null object
Class.AccountTriggerHandler.handleBeforeInsert: line 45, column 12
  `;

  try {
    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Example 2: Apex DML Exception
async function example2_ApexDmlException() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 2: Apex DML Exception');
  console.log('='.repeat(80));

  const errorMessage = `
System.DmlException: Insert failed. First exception on row 0; first error:
REQUIRED_FIELD_MISSING, Required fields are missing: [Name]: [Name]
Class.ContactController.createContact: line 78, column 9
  `;

  try {
    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Example 3: JavaScript/Lightning Component Error
async function example3_JavaScriptError() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 3: JavaScript Error');
  console.log('='.repeat(80));

  const errorMessage = `
TypeError: Cannot read property 'Name' of undefined
    at AccountController.getAccountDetails (AccountController.js:34:21)
    at processAction (aura_prod.js:1234:56)
  `;

  try {
    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Example 4: Governor Limit Exception
async function example4_LimitException() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 4: Salesforce Governor Limit Exception');
  console.log('='.repeat(80));

  const errorMessage = `
System.LimitException: Too many SOQL queries: 101
Class.AccountDataProcessor.processRecords: line 156, column 1
  `;

  try {
    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Example 5: Custom error with try-catch
async function example5_CustomError() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 5: Analyzing Custom Error');
  console.log('='.repeat(80));

  const errorMessage = `
Error: Invalid parameter value
    at validateInput (inputValidator.js:23:15)
    at CommunityController.processRequest (CommunityController.js:89:20)
  `;

  try {
    const results = await analyzer.analyze(errorMessage);
    analyzer.displayResults(results);
  } catch (error) {
    console.error('Error during analysis:', error.message);
  }
}

// Example 6: Analyze with actual Exception object
async function example6_ExceptionObject() {
  console.log('\n' + '='.repeat(80));
  console.log('EXAMPLE 6: Analyzing Exception Object');
  console.log('='.repeat(80));

  try {
    // Simulate an error
    const data = null;
    const result = data.someProperty; // This will throw
  } catch (error) {
    console.log('Caught exception:', error.message);
    console.log('Stack trace:', error.stack);

    // Analyze the exception
    const results = await analyzer.analyze(error.stack);
    analyzer.displayResults(results);
  }
}

// Main execution
async function runExamples() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  ERROR ANALYZER - EXAMPLE DEMONSTRATIONS                   ║');
  console.log('║                 Analyzing against: gauravadeshmukh/agentforcedemo          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  // Run examples one by one
  // Uncomment the examples you want to run

  // await example1_ApexNullPointer();
  // await example2_ApexDmlException();
  // await example3_JavaScriptError();
  await example4_LimitException();
  // await example5_CustomError();
  // await example6_ExceptionObject();

  console.log('\n✅ Example execution completed!\n');
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length > 0 && args[0] !== '--example') {
    // Custom error message provided via command line
    const customError = args.join(' ');
    console.log('\nAnalyzing custom error message...\n');

    analyzer.analyze(customError)
      .then(results => {
        analyzer.displayResults(results);
      })
      .catch(error => {
        console.error('Analysis failed:', error.message);
        process.exit(1);
      });
  } else {
    // Run examples
    runExamples().catch(error => {
      console.error('Example execution failed:', error.message);
      process.exit(1);
    });
  }
}

module.exports = {
  example1_ApexNullPointer,
  example2_ApexDmlException,
  example3_JavaScriptError,
  example4_LimitException,
  example5_CustomError,
  example6_ExceptionObject
};
