import { config } from '../../config/env.js';

/**
 * AI-powered portfolio analysis using Gemini
 * Enhances rule-based analysis with natural language insights
 */
export const generateAIAnalysis = async (portfolioData, ruleBasedAnalysis) => {
  try {
    if (!config.ai.geminiKey) {
      console.log('⚠️  Gemini API key not configured, skipping AI analysis');
      return null;
    }

    const prompt = buildAnalysisPrompt(portfolioData, ruleBasedAnalysis);

    // Call Gemini API (using gemini-2.0-flash)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': config.ai.geminiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error:', response.status, JSON.stringify(errorData, null, 2));
      return null;
    }

    const data = await response.json();
    console.log('🤖 Gemini response received:', JSON.stringify(data, null, 2));
    
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!aiText) {
      console.warn('⚠️  Gemini returned empty text');
      console.log('Full response:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ AI analysis generated successfully');
    }
    
    // Parse AI response to extract structured insights
    const parsed = parseAIAnalysis(aiText, ruleBasedAnalysis);
    
    return {
      summary: parsed.summary,
      aiStrengths: parsed.strengths,
      aiWeaknesses: parsed.weaknesses,
      aiRecommendations: parsed.recommendations,
      contextualInsight: parsed.insight,
      raw: aiText,
    };
  } catch (error) {
    console.error('❌ AI analysis error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    return null;
  }
};

/**
 * AI-powered bio generation
 * Creates engaging narrative from wallet history
 */
export const generateAIBio = async (address, transactionHistory, ruleBasedBio) => {
  try {
    if (!config.ai.geminiKey) {
      console.log('⚠️  Gemini API key not configured, using rule-based bio');
      return null;
    }

    const prompt = buildBioPrompt(address, transactionHistory, ruleBasedBio);

    // Call Gemini API (using gemini-2.0-flash for bio)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': config.ai.geminiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error (bio):', response.status, JSON.stringify(errorData, null, 2));
      return null;
    }

    const data = await response.json();
    console.log('🤖 Gemini bio response received');
    
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!aiText) {
      console.warn('⚠️  Gemini returned empty bio text');
    } else {
      console.log('✅ AI bio generated successfully');
    }

    // Parse bio response
    const parsed = parseAIBio(aiText, ruleBasedBio);
    
    return {
      aiTagline: parsed.tagline,
      aiStory: parsed.story,
      tone: 'professional',
      raw: aiText,
    };
  } catch (error) {
    console.error('❌ AI bio generation error:', error.message);
    return null;
  }
};

/**
 * Build prompt for portfolio analysis
 */
function buildAnalysisPrompt(portfolio, analysis) {
  return `
Analyze this crypto portfolio and provide insights:

Portfolio Value: $${portfolio.totalValue}
Holdings: ${JSON.stringify(portfolio.positions?.slice(0, 5))}
Chains: ${portfolio.chains?.join(', ')}

Rule-based Analysis:
- Personality: ${analysis.personality}
- Risk Score: ${analysis.riskScore}/10
- Strengths: ${analysis.strengths.join(', ')}
- Weaknesses: ${analysis.weaknesses.join(', ')}

Provide:
1. A concise summary (1-2 sentences)
2. One unique insight not covered by rules
3. One specific actionable recommendation

Keep it professional and helpful.
`.trim();
}

/**
 * Parse AI analysis response to extract structured data
 */
function parseAIAnalysis(aiText, fallback) {
  if (!aiText) {
    return {
      summary: `You have a ${fallback.personality.toLowerCase()} portfolio with solid fundamentals.`,
      strengths: fallback.strengths,
      weaknesses: fallback.weaknesses,
      recommendations: fallback.recommendations,
      insight: `Your portfolio shows ${fallback.riskScore < 5 ? 'conservative' : 'aggressive'} tendencies.`,
    };
  }

  // Extract summary (first paragraph or section 1)
  const lines = aiText.split('\n').filter(line => line.trim());
  let summary = '';
  let insight = '';
  
  // Find concise summary section
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/1\.|summary|concise/i)) {
      // Get next non-empty line(s) as summary
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j] && !lines[j].match(/^[#*\d]/)) {
          summary += lines[j] + ' ';
          if (summary.split('.').length > 2) break; // 1-2 sentences
        }
      }
      break;
    }
  }

  // Find unique insight (section 2)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/2\.|insight|unique/i)) {
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j] && !lines[j].match(/^[#*\d]/)) {
          insight = lines[j];
          break;
        }
      }
      break;
    }
  }

  // Use fallback with enhancement if parsing failed
  if (!summary) {
    summary = lines[0] || `You have a ${fallback.personality.toLowerCase()} portfolio.`;
  }
  
  if (!insight) {
    insight = `Your portfolio shows ${fallback.riskScore < 5 ? 'conservative' : 'aggressive'} tendencies.`;
  }

  return {
    summary: summary.trim(),
    strengths: fallback.strengths, // Keep rule-based for consistency
    weaknesses: fallback.weaknesses,
    recommendations: fallback.recommendations,
    insight: insight.trim(),
  };
}

/**
 * Parse AI bio response
 */
function parseAIBio(aiText, fallback) {
  if (!aiText) {
    return {
      tagline: fallback.tagline,
      story: `A crypto enthusiast with ${fallback.stats.totalTransactions} on-chain transactions.`,
    };
  }

  const lines = aiText.split('\n').filter(line => line.trim());
  let tagline = '';
  let story = '';

  // Look for tagline
  for (const line of lines) {
    if (line.match(/tagline:/i)) {
      tagline = line.replace(/.*tagline:?\s*/i, '').replace(/^["*]+|["*]+$/g, '').trim();
      break;
    }
    // First short line might be tagline
    if (!tagline && line.length < 60 && !line.match(/^[#\d]/)) {
      tagline = line.replace(/^["*]+|["*]+$/g, '').trim();
    }
  }

  // Look for bio/story
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(/bio:|story:|2\./i)) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j] && !lines[j].match(/^[#*\d]/) && !lines[j].match(/tagline/i)) {
          story += lines[j] + ' ';
        }
      }
      break;
    }
  }

  // Fallback
  if (!tagline) {
    tagline = fallback.tagline;
  }
  
  if (!story) {
    story = aiText.split('\n\n')[0] || `A crypto enthusiast with ${fallback.stats.totalTransactions} transactions.`;
  }

  return {
    tagline: tagline.trim(),
    story: story.trim(),
  };
}

/**
 * Build prompt for bio generation
 */
function buildBioPrompt(address, history, bio) {
  return `
Create an engaging bio for this crypto wallet:

Address: ${address}
Total Transactions: ${bio.stats.totalTransactions}
Portfolio Age: ${bio.stats.portfolioAgeMonths} months
Badges: ${bio.badges.map(b => b.name).join(', ')}
Timeline: ${bio.timeline.map(t => t.label).join(', ')}

Create:
1. A catchy tagline (5-8 words)
2. A brief story (2-3 sentences) about their crypto journey
3. Keep it authentic and engaging

Tone: Professional but friendly.
`.trim();
}

