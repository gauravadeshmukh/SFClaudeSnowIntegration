/**
 * Test Suite for Error Analyzer
 * Tests various error parsing scenarios
 */

const ErrorAnalyzer = require('./error-analyzer');

// Test data
const testCases = [
  {
    name: 'Apex NullPointerException',
    error: 'System.NullPointerException: Attempt to de-reference a null object\nClass.AccountTriggerHandler.handleBeforeInsert: line 45, column 12',
    expectedType: 'NullPointerException',
    expectedLanguage: 'apex',
    expectedLine: 45
  },
  {
    name: 'JavaScript TypeError',
    error: 'TypeError: Cannot read property \'name\' of undefined\n    at AccountController.getDetails (AccountController.js:34:21)',
    expectedType: 'TypeError',
    expectedLanguage: 'javascript',
    expectedLine: 34
  },
  {
    name: 'Apex DmlException',
    error: 'System.DmlException: Insert failed. First exception on row 0\nClass.ContactController.createContact: line 78, column 9',
    expectedType: 'DmlException',
    expectedLanguage: 'apex',
    expectedLine: 78
  },
  {
    name: 'Governor Limit Exception',
    error: 'System.LimitException: Too many SOQL queries: 101\nClass.AccountDataProcessor.processRecords: line 156, column 1',
    expectedType: 'LimitException',
    expectedLanguage: 'apex',
    expectedLine: 156
  },
  {
    name: 'JavaScript ReferenceError',
    error: 'ReferenceError: myVariable is not defined\n    at processData (dataProcessor.js:89:5)',
    expectedType: 'ReferenceError',
    expectedLanguage: 'javascript',
    expectedLine: 89
  },
  {
    name: 'JavaScript SyntaxError',
    error: 'SyntaxError: Unexpected token }\n    at Module._compile (internal/modules/cjs/loader.js:723:23)',
    expectedType: 'SyntaxError',
    expectedLanguage: 'javascript',
    expectedLine: 723
  }
];

function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('ERROR ANALYZER - TEST SUITE');
  console.log('='.repeat(80) + '\n');

  const analyzer = new ErrorAnalyzer('https://github.com/gauravadeshmukh/agentforcedemo/tree/master');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('-'.repeat(80));

    try {
      const result = analyzer.parseError(testCase.error);

      const checks = [
        {
          name: 'Error Type',
          expected: testCase.expectedType,
          actual: result.type,
          pass: result.type === testCase.expectedType
        },
        {
          name: 'Language',
          expected: testCase.expectedLanguage,
          actual: result.language,
          pass: result.language === testCase.expectedLanguage
        },
        {
          name: 'Line Number',
          expected: testCase.expectedLine,
          actual: result.lineNumber,
          pass: result.lineNumber === testCase.expectedLine
        }
      ];

      let testPassed = true;

      checks.forEach(check => {
        const status = check.pass ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} - ${check.name}`);
        if (!check.pass) {
          console.log(`    Expected: ${check.expected}`);
          console.log(`    Actual: ${check.actual}`);
          testPassed = false;
        }
      });

      if (testPassed) {
        passed++;
        console.log('  Result: ✅ TEST PASSED\n');
      } else {
        failed++;
        console.log('  Result: ❌ TEST FAILED\n');
      }

    } catch (error) {
      failed++;
      console.log(`  ❌ ERROR: ${error.message}\n`);
    }
  });

  console.log('='.repeat(80));
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
  console.log('='.repeat(80) + '\n');

  return failed === 0;
}

// Test repository URL parsing
function testRepoUrlParsing() {
  console.log('\n' + '='.repeat(80));
  console.log('REPOSITORY URL PARSING TESTS');
  console.log('='.repeat(80) + '\n');

  const urlTests = [
    {
      url: 'https://github.com/gauravadeshmukh/agentforcedemo/tree/master',
      expectedOwner: 'gauravadeshmukh',
      expectedRepo: 'agentforcedemo',
      expectedBranch: 'master'
    },
    {
      url: 'https://github.com/user/repo',
      expectedOwner: 'user',
      expectedRepo: 'repo',
      expectedBranch: 'master'
    },
    {
      url: 'https://github.com/org/project.git',
      expectedOwner: 'org',
      expectedRepo: 'project',
      expectedBranch: 'master'
    }
  ];

  let passed = 0;
  let failed = 0;

  urlTests.forEach((test, index) => {
    console.log(`URL Test ${index + 1}: ${test.url}`);

    try {
      const analyzer = new ErrorAnalyzer(test.url);

      if (analyzer.repoOwner === test.expectedOwner &&
          analyzer.repoName === test.expectedRepo &&
          analyzer.branch === test.expectedBranch) {
        console.log('  ✅ PASS');
        console.log(`     Owner: ${analyzer.repoOwner}, Repo: ${analyzer.repoName}, Branch: ${analyzer.branch}\n`);
        passed++;
      } else {
        console.log('  ❌ FAIL');
        console.log(`     Expected: ${test.expectedOwner}/${test.expectedRepo}@${test.expectedBranch}`);
        console.log(`     Actual: ${analyzer.repoOwner}/${analyzer.repoName}@${analyzer.branch}\n`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}\n`);
      failed++;
    }
  });

  console.log('='.repeat(80));
  console.log(`URL PARSING SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80) + '\n');

  return failed === 0;
}

// Test recommendations generation
function testRecommendations() {
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATIONS GENERATION TEST');
  console.log('='.repeat(80) + '\n');

  const analyzer = new ErrorAnalyzer('https://github.com/gauravadeshmukh/agentforcedemo/tree/master');

  const errorTypes = [
    'NullPointerException',
    'DmlException',
    'LimitException',
    'TypeError',
    'ReferenceError',
    'SyntaxError'
  ];

  let allPassed = true;

  errorTypes.forEach(errorType => {
    const errorInfo = {
      type: errorType,
      message: `Test ${errorType}`,
      language: 'apex'
    };

    const recommendations = analyzer.analyzeCodeAndRecommend(errorInfo, null, 'test.cls');

    console.log(`Testing ${errorType}:`);

    if (recommendations.possibleCauses.length > 0 &&
        recommendations.suggestedFixes.length > 0 &&
        recommendations.bestPractices.length > 0) {
      console.log('  ✅ PASS - Generated recommendations');
      console.log(`     Causes: ${recommendations.possibleCauses.length}`);
      console.log(`     Fixes: ${recommendations.suggestedFixes.length}`);
      console.log(`     Best Practices: ${recommendations.bestPractices.length}\n`);
    } else {
      console.log('  ❌ FAIL - Missing recommendations\n');
      allPassed = false;
    }
  });

  console.log('='.repeat(80));
  console.log(allPassed ? 'All recommendation tests passed ✅' : 'Some tests failed ❌');
  console.log('='.repeat(80) + '\n');

  return allPassed;
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     ERROR ANALYZER - TEST SUITE                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  const results = {
    errorParsing: runTests(),
    urlParsing: testRepoUrlParsing(),
    recommendations: testRecommendations()
  };

  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`Error Parsing Tests: ${results.errorParsing ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`URL Parsing Tests: ${results.urlParsing ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Recommendations Tests: ${results.recommendations ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
  console.log('='.repeat(80) + '\n');

  return allPassed;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testRepoUrlParsing, testRecommendations, runAllTests };
