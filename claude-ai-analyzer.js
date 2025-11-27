/**
 * Claude AI-Powered Code Analyzer
 * Uses Anthropic's Claude API to provide intelligent error analysis and recommendations
 */

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAIAnalyzer {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY not set. AI analysis will be disabled.');
      this.enabled = false;
    } else {
      this.anthropic = new Anthropic({ apiKey: this.apiKey });
      this.enabled = true;
      console.log('✓ Claude AI analyzer initialized');
    }

    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
    this.maxTokens = parseInt(process.env.CLAUDE_MAX_TOKENS || '2048');
  }

  /**
   * Check if AI analysis is available
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Analyze error with Claude AI
   * Provides intelligent, context-aware analysis of code errors
   */
  async analyzeError(errorInfo, codeSnippet, filePath, repository) {
    if (!this.enabled) {
      throw new Error('Claude AI analyzer is not enabled. Please set ANTHROPIC_API_KEY environment variable.');
    }

    console.log('\n🤖 Using Claude AI for intelligent error analysis...');

    try {
      // Build the analysis prompt
      const prompt = this.buildAnalysisPrompt(errorInfo, codeSnippet, filePath, repository);

      // Call Claude API
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Parse and structure the response
      const aiResponse = message.content[0].text;
      return this.parseAIResponse(aiResponse, errorInfo);

    } catch (error) {
      console.error('❌ Claude AI analysis failed:', error.message);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Build comprehensive prompt for Claude AI
   */
  buildAnalysisPrompt(errorInfo, codeSnippet, filePath, repository) {
    let prompt = `You are an expert software engineer analyzing a code error. Provide a comprehensive, actionable analysis.

**ERROR DETAILS:**
- Type: ${errorInfo.type}
- Language: ${errorInfo.language || 'Unknown'}
- File: ${filePath || 'Unknown'}
- Line: ${errorInfo.lineNumber || 'Unknown'}
${errorInfo.className ? `- Class: ${errorInfo.className}` : ''}
${errorInfo.methodName ? `- Method: ${errorInfo.methodName}` : ''}

**ERROR MESSAGE:**
${errorInfo.message}

**REPOSITORY CONTEXT:**
- Repository: ${repository.owner}/${repository.name}
- Branch: ${repository.branch}
- URL: https://github.com/${repository.owner}/${repository.name}
`;

    // Add code snippet if available
    if (codeSnippet && codeSnippet.code) {
      prompt += `\n**CODE SNIPPET (Lines ${codeSnippet.startLine}-${codeSnippet.endLine}):**\n`;
      prompt += '```' + (errorInfo.language || 'text') + '\n';

      codeSnippet.code.forEach(line => {
        const marker = line.isError ? '>>> ' : '    ';
        prompt += `${marker}${line.lineNumber}: ${line.content}\n`;
      });

      prompt += '```\n';
      prompt += `\n**Error occurs on line ${codeSnippet.errorLine}**\n`;
    }

    // Add specific analysis instructions based on error type
    prompt += this.getErrorTypeInstructions(errorInfo);

    prompt += `\n**REQUIRED OUTPUT FORMAT:**

Provide your analysis in the following JSON structure:

{
  "rootCauseAnalysis": "Detailed explanation of why this error occurred",
  "codeContextInsights": [
    "Specific insight about the code at line ${errorInfo.lineNumber || 'X'}",
    "Another context-specific observation"
  ],
  "possibleCauses": [
    "Primary cause based on code analysis",
    "Secondary cause",
    "Tertiary cause"
  ],
  "suggestedFixes": [
    "Specific fix #1 with code example",
    "Specific fix #2 with code example",
    "Alternative approach"
  ],
  "bestPractices": [
    "Best practice relevant to this error",
    "Design pattern recommendation",
    "Testing recommendation"
  ],
  "relatedComponents": [
    "Other files/classes that might be affected",
    "Dependencies to review"
  ],
  "preventionStrategy": "How to prevent this error in the future"
}

**IMPORTANT:**
1. Be specific to the actual code shown, not generic
2. Reference actual variable names, line numbers, and code patterns
3. Provide code examples in your fixes
4. Consider the repository context and language
5. Return ONLY valid JSON, no markdown formatting`;

    return prompt;
  }

  /**
   * Get error-type-specific instructions for Claude
   */
  getErrorTypeInstructions(errorInfo) {
    const instructions = {
      'NullPointerException': `
**FOCUS AREAS FOR NULL POINTER ANALYSIS:**
- Identify which object/variable is null
- Check if proper null checks exist
- Analyze data flow to determine where null originates
- Consider optional chaining or safe navigation patterns
- Look for query results that might return empty/null`,

      'LimitException': `
**FOCUS AREAS FOR GOVERNOR LIMIT ANALYSIS:**
- Identify SOQL queries in loops
- Check for non-bulkified operations
- Analyze collection sizes and processing patterns
- Look for opportunities to use aggregate queries
- Consider asynchronous processing options`,

      'DmlException': `
**FOCUS AREAS FOR DML EXCEPTION ANALYSIS:**
- Check required field validations
- Analyze field-level security settings
- Look for validation rules that might fail
- Consider record locking issues
- Check for trigger recursion`,

      'TypeError': `
**FOCUS AREAS FOR TYPE ERROR ANALYSIS:**
- Identify type mismatch in the code
- Check variable declarations and assignments
- Analyze function return types
- Look for undefined variables or properties
- Consider TypeScript or type checking tools`,

      'SyntaxError': `
**FOCUS AREAS FOR SYNTAX ERROR ANALYSIS:**
- Identify the specific syntax violation
- Check bracket/parenthesis matching
- Look for missing semicolons or commas
- Analyze quote usage and escaping
- Check keyword usage`
    };

    return instructions[errorInfo.type] || `
**GENERAL ANALYSIS FOCUS:**
- Examine the code structure and patterns
- Identify anti-patterns or code smells
- Consider error handling and edge cases
- Look for potential performance issues`;
  }

  /**
   * Parse Claude AI response and structure it
   */
  parseAIResponse(aiResponse, errorInfo) {
    try {
      // Try to extract JSON from the response
      // Claude might wrap it in markdown code blocks
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Structure the analysis results
      return {
        aiPowered: true,
        model: this.model,
        rootCauseAnalysis: parsed.rootCauseAnalysis || 'Analysis not available',
        codeContextInsights: parsed.codeContextInsights || [],
        possibleCauses: parsed.possibleCauses || [],
        suggestedFixes: parsed.suggestedFixes || [],
        bestPractices: parsed.bestPractices || [],
        relatedComponents: parsed.relatedComponents || [],
        preventionStrategy: parsed.preventionStrategy || '',
        confidence: 'high', // Claude provides high-confidence analysis
        analysisTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error.message);
      console.log('Raw AI response:', aiResponse);

      // Fallback: return the raw text in a structured format
      return {
        aiPowered: true,
        model: this.model,
        rootCauseAnalysis: aiResponse,
        codeContextInsights: ['AI analysis completed - see rootCauseAnalysis for details'],
        possibleCauses: ['See AI analysis above'],
        suggestedFixes: ['See AI analysis above'],
        bestPractices: ['See AI analysis above'],
        relatedComponents: [],
        preventionStrategy: 'Review the AI analysis for prevention strategies',
        confidence: 'medium',
        analysisTimestamp: new Date().toISOString(),
        parseError: error.message
      };
    }
  }

  /**
   * Analyze multiple related components
   * Used when error might affect multiple files
   */
  async analyzeRelatedComponents(errorInfo, components, repository) {
    if (!this.enabled) {
      throw new Error('Claude AI analyzer is not enabled.');
    }

    console.log(`\n🤖 Analyzing ${components.length} related components with Claude AI...`);

    const prompt = `You are analyzing how an error in one component might affect related components.

**ERROR CONTEXT:**
- Type: ${errorInfo.type}
- Primary File: ${errorInfo.fileName || 'Unknown'}
- Error: ${errorInfo.message}

**RELATED COMPONENTS:**
${components.map((comp, idx) => `${idx + 1}. ${comp.path} (${comp.reason})`).join('\n')}

**ANALYSIS REQUEST:**
For each related component, assess:
1. Is it likely affected by this error?
2. What changes might be needed?
3. Are there dependencies that need updating?

Provide a JSON array with this structure:
[
  {
    "component": "component path",
    "impactLevel": "high|medium|low",
    "affectedAreas": ["area 1", "area 2"],
    "recommendedActions": ["action 1", "action 2"]
  }
]

Return ONLY valid JSON.`;

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });

      let response = message.content[0].text.trim();

      // Clean markdown if present
      if (response.startsWith('```')) {
        response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('❌ Related components analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Get AI-powered fix suggestion with code example
   */
  async generateFixCode(errorInfo, codeSnippet, filePath) {
    if (!this.enabled) {
      throw new Error('Claude AI analyzer is not enabled.');
    }

    console.log('\n🤖 Generating fix code with Claude AI...');

    const prompt = `Generate a specific code fix for this error.

**ERROR:** ${errorInfo.type} at line ${errorInfo.lineNumber}
**FILE:** ${filePath}

**CURRENT CODE:**
\`\`\`${errorInfo.language || 'text'}
${codeSnippet.code.map(l => `${l.lineNumber}: ${l.content}`).join('\n')}
\`\`\`

**TASK:**
Provide the corrected code with:
1. The fix applied
2. Comments explaining the changes
3. Additional error handling if needed

Return in this JSON format:
{
  "fixedCode": "the corrected code block",
  "changes": ["change 1", "change 2"],
  "explanation": "why this fixes the error"
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      let response = message.content[0].text.trim();
      if (response.startsWith('```')) {
        response = response.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      }

      return JSON.parse(response);

    } catch (error) {
      console.error('❌ Fix code generation failed:', error.message);
      return null;
    }
  }
}

module.exports = ClaudeAIAnalyzer;
