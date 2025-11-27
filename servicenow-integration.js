/**
 * ServiceNow Integration Module
 * Creates incidents in ServiceNow with error analysis results
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class ServiceNowIntegration {
  constructor(config) {
    this.instanceUrl = config.instanceUrl; // e.g., 'dev12345.service-now.com'
    this.username = config.username;
    this.password = config.password;
    this.apiVersion = config.apiVersion || 'v1';
  }

  /**
   * Create an incident in ServiceNow
   */
  async createIncident(incidentData) {
    const data = JSON.stringify(incidentData);

    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const options = {
      hostname: this.instanceUrl,
      path: `/api/now/table/incident`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`ServiceNow API error (${res.statusCode}): ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Attach a file to an incident
   */
  async attachFileToIncident(incidentSysId, fileName, fileContent) {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    // Prepare multipart form data
    const boundary = '----WebKitFormBoundary' + Date.now();
    const fileData = Buffer.from(fileContent, 'utf8');

    const parts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`,
      `Content-Type: text/plain\r\n\r\n`
    ];

    const header = Buffer.from(parts.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileData, footer]);

    const options = {
      hostname: this.instanceUrl,
      path: `/api/now/attachment/file?table_name=incident&table_sys_id=${incidentSysId}&file_name=${fileName}`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': body.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`ServiceNow attachment error (${res.statusCode}): ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Attachment request failed: ${error.message}`));
      });

      req.write(body);
      req.end();
    });
  }

  /**
   * Update an incident
   */
  async updateIncident(incidentSysId, updateData) {
    const data = JSON.stringify(updateData);
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    const options = {
      hostname: this.instanceUrl,
      path: `/api/now/table/incident/${incidentSysId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const result = JSON.parse(responseData);
              resolve(result);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${error.message}`));
            }
          } else {
            reject(new Error(`ServiceNow update error (${res.statusCode}): ${responseData}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Update request failed: ${error.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Format error analysis results for ServiceNow incident
   */
  formatAnalysisForIncident(errorMessage, analysisResults) {
    const errorInfo = analysisResults.errorInfo;

    // Create short description
    const shortDescription = `${errorInfo.type}: ${errorInfo.message.substring(0, 100)}`;

    // Create detailed description
    let description = `Error Analysis Report\n`;
    description += `${'='.repeat(80)}\n\n`;
    description += `ERROR DETAILS:\n`;
    description += `- Type: ${errorInfo.type}\n`;
    description += `- Language: ${errorInfo.language || 'Unknown'}\n`;
    description += `- Message: ${errorInfo.message}\n`;

    if (errorInfo.fileName) {
      description += `- Location: ${errorInfo.fileName}`;
      if (errorInfo.lineNumber) {
        description += `:${errorInfo.lineNumber}`;
        if (errorInfo.columnNumber) {
          description += `:${errorInfo.columnNumber}`;
        }
      }
      description += `\n`;
    }

    if (errorInfo.className) {
      description += `- Class: ${errorInfo.className}\n`;
    }

    description += `\nREPOSITORY:\n`;
    description += `- ${analysisResults.repository.owner}/${analysisResults.repository.name} (${analysisResults.repository.branch})\n`;

    if (analysisResults.relevantFiles && analysisResults.relevantFiles.length > 0) {
      description += `\nRELEVANT FILES:\n`;
      analysisResults.relevantFiles.slice(0, 5).forEach((file, idx) => {
        description += `${idx + 1}. ${file.path} (${file.reason})\n`;
      });
    }

    description += `\n${'='.repeat(80)}\n`;
    description += `\nFor detailed analysis, fixes, and recommendations, please see the attached file.`;

    // Determine priority based on error type
    let priority = '3'; // Default: Moderate
    let impact = '3'; // Default: Low
    let urgency = '3'; // Default: Low

    if (errorInfo.type === 'LimitException') {
      priority = '1'; // Critical
      impact = '1'; // High
      urgency = '1'; // High
    } else if (errorInfo.type === 'DmlException' || errorInfo.type === 'NullPointerException') {
      priority = '2'; // High
      impact = '2'; // Medium
      urgency = '2'; // Medium
    } else if (errorInfo.type === 'SyntaxError') {
      priority = '2'; // High
      impact = '2'; // Medium
      urgency = '1'; // High
    }

    return {
      short_description: shortDescription,
      description: description,
      priority: priority,
      impact: impact,
      urgency: urgency,
      category: 'Software',
      subcategory: 'Application Error',
      u_error_type: errorInfo.type,
      u_programming_language: errorInfo.language || 'Unknown'
    };
  }

  /**
   * Generate detailed analysis report file content
   */
  generateAnalysisReport(errorMessage, analysisResults) {
    let report = '';
    report += '='.repeat(80) + '\n';
    report += 'COMPREHENSIVE ERROR ANALYSIS REPORT\n';
    report += '='.repeat(80) + '\n\n';

    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += 'ORIGINAL ERROR MESSAGE:\n';
    report += '-'.repeat(80) + '\n';
    report += errorMessage + '\n';
    report += '-'.repeat(80) + '\n\n';

    const errorInfo = analysisResults.errorInfo;

    report += 'PARSED ERROR INFORMATION:\n';
    report += `  Error Type: ${errorInfo.type}\n`;
    report += `  Language: ${errorInfo.language || 'Unknown'}\n`;
    report += `  Message: ${errorInfo.message}\n`;

    if (errorInfo.fileName) {
      report += `  File: ${errorInfo.fileName}\n`;
      report += `  Line: ${errorInfo.lineNumber || 'N/A'}\n`;
      report += `  Column: ${errorInfo.columnNumber || 'N/A'}\n`;
    }

    if (errorInfo.className) {
      report += `  Class: ${errorInfo.className}\n`;
    }

    if (errorInfo.methodName) {
      report += `  Method: ${errorInfo.methodName}\n`;
    }

    report += '\n';

    report += 'REPOSITORY INFORMATION:\n';
    report += `  Repository: ${analysisResults.repository.owner}/${analysisResults.repository.name}\n`;
    report += `  Branch: ${analysisResults.repository.branch}\n`;
    report += `  URL: https://github.com/${analysisResults.repository.owner}/${analysisResults.repository.name}\n\n`;

    if (analysisResults.relevantFiles && analysisResults.relevantFiles.length > 0) {
      report += 'RELEVANT FILES IDENTIFIED:\n';
      analysisResults.relevantFiles.forEach((file, idx) => {
        report += `  ${idx + 1}. ${file.path}\n`;
        report += `     Reason: ${file.reason}\n`;
      });
      report += '\n';
    }

    if (analysisResults.analysisResults && analysisResults.analysisResults.length > 0) {
      analysisResults.analysisResults.forEach((analysis, idx) => {
        report += '='.repeat(80) + '\n';
        report += `ANALYSIS ${idx + 1}: ${analysis.filePath}\n`;
        report += '='.repeat(80) + '\n\n';

        if (analysis.codeSnippet) {
          report += 'CODE SNIPPET:\n';
          report += '-'.repeat(80) + '\n';
          analysis.codeSnippet.code.forEach(line => {
            const marker = line.isError ? '>>> ' : '    ';
            const lineNum = line.lineNumber.toString().padStart(4, ' ');
            report += `${marker}${lineNum}: ${line.content}\n`;
          });
          report += '-'.repeat(80) + '\n\n';
        }

        report += 'POSSIBLE CAUSES:\n';
        analysis.possibleCauses.forEach((cause, i) => {
          report += `  ${i + 1}. ${cause}\n`;
        });
        report += '\n';

        report += 'SUGGESTED FIXES:\n';
        analysis.suggestedFixes.forEach((fix, i) => {
          report += `  ${i + 1}. ${fix}\n`;
        });
        report += '\n';

        report += 'BEST PRACTICES:\n';
        analysis.bestPractices.forEach((practice, i) => {
          report += `  ${i + 1}. ${practice}\n`;
        });
        report += '\n';
      });
    }

    report += '='.repeat(80) + '\n';
    report += 'END OF REPORT\n';
    report += '='.repeat(80) + '\n';

    return report;
  }

  /**
   * Create incident with error analysis
   */
  async createIncidentWithAnalysis(errorMessage, analysisResults, additionalFields = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('CREATING SERVICENOW INCIDENT');
    console.log('='.repeat(80) + '\n');

    try {
      // Step 1: Format incident data
      console.log('Step 1: Formatting incident data...');
      const incidentData = this.formatAnalysisForIncident(errorMessage, analysisResults);

      // Merge with additional fields
      const finalIncidentData = { ...incidentData, ...additionalFields };

      // Step 2: Create the incident
      console.log('Step 2: Creating incident in ServiceNow...');
      const incident = await this.createIncident(finalIncidentData);

      const incidentNumber = incident.result.number;
      const incidentSysId = incident.result.sys_id;

      console.log(`✅ Incident created: ${incidentNumber}`);
      console.log(`   Sys ID: ${incidentSysId}`);

      // Step 3: Generate detailed analysis report
      console.log('\nStep 3: Generating detailed analysis report...');
      const reportContent = this.generateAnalysisReport(errorMessage, analysisResults);
      const fileName = `error_analysis_${incidentNumber}_${Date.now()}.txt`;

      // Step 4: Attach the report to the incident
      console.log('Step 4: Attaching analysis report to incident...');
      const attachment = await this.attachFileToIncident(incidentSysId, fileName, reportContent);

      console.log(`✅ File attached: ${fileName}`);
      console.log(`   Attachment Sys ID: ${attachment.result.sys_id}`);

      // Step 5: Add work notes with summary
      console.log('\nStep 5: Adding work notes...');
      const workNotes = `Error analysis completed and detailed report attached.\n\n` +
                       `Error Type: ${analysisResults.errorInfo.type}\n` +
                       `Language: ${analysisResults.errorInfo.language || 'Unknown'}\n` +
                       `Analysis File: ${fileName}\n\n` +
                       `The attached file contains:\n` +
                       `- Detailed error information\n` +
                       `- Code snippets (if available)\n` +
                       `- Possible causes\n` +
                       `- Suggested fixes\n` +
                       `- Best practices\n`;

      await this.updateIncident(incidentSysId, {
        work_notes: workNotes
      });

      console.log('✅ Work notes added');

      console.log('\n' + '='.repeat(80));
      console.log('INCIDENT CREATION COMPLETED');
      console.log('='.repeat(80));

      return {
        incident: incident.result,
        attachment: attachment.result,
        incidentNumber: incidentNumber,
        incidentSysId: incidentSysId,
        reportFileName: fileName,
        incidentUrl: `https://${this.instanceUrl}/nav_to.do?uri=incident.do?sys_id=${incidentSysId}`
      };

    } catch (error) {
      console.error('\n❌ Error creating ServiceNow incident:', error.message);
      throw error;
    }
  }

  /**
   * Save analysis report to local file (for testing without ServiceNow access)
   */
  saveAnalysisReportToFile(errorMessage, analysisResults, outputDir = '.') {
    const reportContent = this.generateAnalysisReport(errorMessage, analysisResults);
    const fileName = `error_analysis_${Date.now()}.txt`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, reportContent, 'utf8');

    console.log(`\n✅ Analysis report saved to: ${filePath}`);

    return {
      fileName: fileName,
      filePath: filePath,
      content: reportContent
    };
  }
}

module.exports = ServiceNowIntegration;
