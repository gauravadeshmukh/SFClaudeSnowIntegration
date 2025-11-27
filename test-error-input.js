/**
 * Test script for the specific error input that's failing
 */

const EnhancedErrorWorkflow = require('./enhanced-error-workflow');

// The exact error input that's failing
const errorInput = `Exception Message: Invalid id: 12312312312
Line Number: 16
Exception Type: System.StringException
Stack Trace: Class.AccountTriggerHandler.handleTrigger: line 16, column 1
Trigger.AccountTrigger: line 2, column 1`;

console.log('Testing error input:');
console.log(errorInput);
console.log('\n' + '='.repeat(80) + '\n');

async function test() {
  try {
    const workflow = new EnhancedErrorWorkflow('https://github.com/gauravadeshmukh/agentforcedemo/tree/master', {
      useAI: false, // Test without AI first
      localWorkspace: process.cwd()
    });

    const result = await workflow.processError(errorInput);

    console.log('\n' + '='.repeat(80));
    console.log('TEST RESULT:');
    console.log('='.repeat(80));
    console.log('Success:', result.success);

    if (result.success) {
      console.log('\nError Info:');
      console.log('  Type:', result.errorInfo.type);
      console.log('  Language:', result.errorInfo.language);
      console.log('  File:', result.errorInfo.fileName);
      console.log('  Class:', result.errorInfo.className);
      console.log('  Method:', result.errorInfo.methodName);
      console.log('  Line:', result.errorInfo.lineNumber);
      console.log('  Severity:', result.errorInfo.severity);
      console.log('  Category:', result.errorInfo.category);
    } else {
      console.log('\nError:', result.error);
    }

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('TEST FAILED:');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  }
}

test();
