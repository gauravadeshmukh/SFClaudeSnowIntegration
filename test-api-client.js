/**
 * API Client Test Script
 * Tests all Error Analyzer API endpoints
 */

const http = require('http');

class APIClient {
  constructor(baseUrl = 'http://localhost:3000') {
    const url = new URL(baseUrl);
    this.hostname = url.hostname;
    this.port = url.port || 80;
  }

  /**
   * Make HTTP request
   */
  request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.hostname,
        port: this.port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: JSON.parse(body)
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * GET request
   */
  get(path) {
    return this.request('GET', path);
  }

  /**
   * POST request
   */
  post(path, data) {
    return this.request('POST', path, data);
  }
}

// Test functions
async function testHealthCheck(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Health Check');
  console.log('='.repeat(80));

  try {
    const response = await client.get('/api/health');

    console.log(`✓ Status Code: ${response.statusCode}`);
    console.log(`✓ Service: ${response.body.service}`);
    console.log(`✓ Status: ${response.body.status}`);
    console.log(`✓ ServiceNow Configured: ${response.body.servicenow.configured}`);

    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

async function testStatus(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: API Status');
  console.log('='.repeat(80));

  try {
    const response = await client.get('/api/status');

    console.log(`✓ Status Code: ${response.statusCode}`);
    console.log(`✓ API Version: ${response.body.api.version}`);
    console.log(`✓ Host: ${response.body.api.host}:${response.body.api.port}`);
    console.log(`✓ ServiceNow Mode: ${response.body.servicenow.mode}`);
    console.log(`✓ Endpoints: ${response.body.endpoints.length}`);

    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

async function testAnalyze(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Analyze Error');
  console.log('='.repeat(80));

  const errorMessage = 'System.NullPointerException: Attempt to de-reference a null object. Class.AccountHandler.processAccount: line 45, column 12';

  try {
    const response = await client.post('/api/analyze', {
      error: errorMessage
    });

    console.log(`✓ Status Code: ${response.statusCode}`);
    console.log(`✓ Message: ${response.body.message}`);
    console.log(`✓ Error Type: ${response.body.data.errorInfo.type}`);
    console.log(`✓ Language: ${response.body.data.errorInfo.language}`);
    console.log(`✓ Relevant Files: ${response.body.data.relevantFiles.length}`);
    console.log(`✓ Analysis Results: ${response.body.data.analysisResults.length}`);

    if (response.body.data.analysisResults.length > 0) {
      const analysis = response.body.data.analysisResults[0];
      console.log(`  - Possible Causes: ${analysis.possibleCauses.length}`);
      console.log(`  - Suggested Fixes: ${analysis.suggestedFixes.length}`);
      console.log(`  - Best Practices: ${analysis.bestPractices.length}`);
    }

    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

async function testCreateIncidentLocal(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 4: Create Incident (Local Mode)');
  console.log('='.repeat(80));

  const errorMessage = 'System.LimitException: Too many SOQL queries: 101. Class.DataProcessor.process: line 156, column 1';

  try {
    const response = await client.post('/api/incident/create', {
      error: errorMessage,
      caller: 'developer@company.com',
      localOnly: true
    });

    console.log(`✓ Status Code: ${response.statusCode}`);
    console.log(`✓ Message: ${response.body.message}`);
    console.log(`✓ Mode: ${response.body.data.mode}`);
    console.log(`✓ Report File: ${response.body.data.reportFile}`);
    console.log(`✓ Report Size: ${response.body.data.reportSize} bytes`);
    console.log(`✓ Error Type: ${response.body.data.errorType}`);
    console.log(`✓ Language: ${response.body.data.language}`);
    console.log(`✓ Relevant Files: ${response.body.data.relevantFiles}`);

    return response.statusCode === 201 && response.body.success;
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }
}

async function testErrorHandling(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 5: Error Handling');
  console.log('='.repeat(80));

  console.log('\nTest 5a: Missing error field');
  try {
    const response = await client.post('/api/incident/create', {
      caller: 'user@example.com'
    });

    console.log(`✓ Status Code: ${response.statusCode} (expected 400)`);
    console.log(`✓ Error Message: ${response.body.error}`);

    if (response.statusCode !== 400) {
      console.log('✗ Expected status code 400');
      return false;
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }

  console.log('\nTest 5b: Invalid endpoint');
  try {
    const response = await client.get('/api/invalid');

    console.log(`✓ Status Code: ${response.statusCode} (expected 404)`);
    console.log(`✓ Error Message: ${response.body.error}`);

    if (response.statusCode !== 404) {
      console.log('✗ Expected status code 404');
      return false;
    }
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    return false;
  }

  return true;
}

async function testMultipleErrors(client) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 6: Multiple Error Types');
  console.log('='.repeat(80));

  const errors = [
    {
      name: 'NullPointerException',
      message: 'System.NullPointerException at line 45'
    },
    {
      name: 'DmlException',
      message: 'System.DmlException: Insert failed'
    },
    {
      name: 'TypeError',
      message: 'TypeError: Cannot read property "name" of undefined'
    }
  ];

  let allPassed = true;

  for (const error of errors) {
    console.log(`\nTesting: ${error.name}`);
    try {
      const response = await client.post('/api/analyze', {
        error: error.message
      });

      if (response.statusCode === 200 && response.body.success) {
        console.log(`  ✓ ${error.name} analyzed successfully`);
        console.log(`    Error Type: ${response.body.data.errorInfo.type}`);
      } else {
        console.log(`  ✗ ${error.name} analysis failed`);
        allPassed = false;
      }
    } catch (err) {
      console.error(`  ✗ ${error.name} error: ${err.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    ERROR ANALYZER API TEST SUITE                           ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  const client = new APIClient('http://localhost:3000');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'API Status', fn: testStatus },
    { name: 'Analyze Error', fn: testAnalyze },
    { name: 'Create Incident (Local)', fn: testCreateIncidentLocal },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Multiple Error Types', fn: testMultipleErrors }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn(client);
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`\nTest "${test.name}" threw an error:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✓ PASSED' : '✗ FAILED';
    console.log(`${status} - ${result.name}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
  } else {
    console.log(`\n⚠️  ${failed} TEST(S) FAILED\n`);
  }

  return failed === 0;
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

module.exports = { APIClient, runAllTests };
