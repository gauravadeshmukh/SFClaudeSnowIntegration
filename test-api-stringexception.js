/**
 * Test the API endpoint with the StringException error
 */

const http = require('http');

const errorData = {
  error: `Exception Message: Invalid id: 12312312312
Line Number: 16
Exception Type: System.StringException
Stack Trace: Class.AccountTriggerHandler.handleTrigger: line 16, column 1
Trigger.AccountTrigger: line 2, column 1`
};

const postData = JSON.stringify(errorData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/workflow/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing API endpoint with StringException error...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      console.log('API Response:');
      console.log('='.repeat(80));
      console.log('Success:', result.success);

      if (result.success) {
        console.log('\nError Context:');
        console.log('  Type:', result.data.errorContext.type);
        console.log('  Severity:', result.data.errorContext.severity);
        console.log('  Category:', result.data.errorContext.category);
        console.log('  File:', result.data.errorContext.file);
        console.log('  Class:', result.data.errorContext.class);
        console.log('  Line:', result.data.errorContext.line);

        console.log('\nRepository Scan:');
        console.log('  Files Scanned:', result.data.summary.filesScanned);
        console.log('  Components Affected:', result.data.summary.componentsAffected);

        console.log('\nAnalysis:');
        console.log('  Root Cause:');
        console.log('   ', result.data.analysis.rootCause.substring(0, 200) + '...');

        console.log('\n  Recommendations:', result.data.analysis.recommendations.length);
        result.data.analysis.recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(`    ${i + 1}. ${rec.substring(0, 80)}...`);
        });

        console.log('\n  Best Practices:', result.data.analysis.bestPractices.length);
        result.data.analysis.bestPractices.slice(0, 3).forEach((bp, i) => {
          console.log(`    ${i + 1}. ${bp.substring(0, 80)}...`);
        });

        console.log('\nFix Approach:');
        console.log('  Immediate:', result.data.analysis.fixApproach.immediate);
        console.log('  Short-term:', result.data.analysis.fixApproach.shortTerm);
        console.log('  Long-term:', result.data.analysis.fixApproach.longTerm.substring(0, 80) + '...');

        console.log('\nSummary:');
        console.log('  Fixes Applied:', result.data.summary.fixesApplied);
        console.log('  Manual Recommendations:', result.data.summary.manualRecommendations);

        console.log('\n✓ TEST PASSED - API endpoint working correctly!');
      } else {
        console.log('\n✗ TEST FAILED - API returned error:', result.error);
      }

      console.log('='.repeat(80));

    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
  console.log('\n⚠️  Make sure the API server is running:');
  console.log('   node api-server.js');
});

req.write(postData);
req.end();
