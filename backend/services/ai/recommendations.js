import { config } from '../../config/env.js';

/**
 * Generate AI-powered trading recommendations based on personality and portfolio
 */
export const generateAIRecommendations = async (userAnalysis, portfolioData, comparisonData) => {
  try {
    if (!config.ai.geminiKey) {
      console.log('⚠️  Gemini API key not configured, skipping AI recommendations');
      return generateRuleBasedRecommendations(userAnalysis, portfolioData);
    }

    const prompt = buildRecommendationsPrompt(userAnalysis, portfolioData, comparisonData);

    // Call Gemini API
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
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Gemini API error (recommendations):', response.status, JSON.stringify(errorData, null, 2));
      return generateRuleBasedRecommendations(userAnalysis, portfolioData);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!aiText) {
      console.warn('⚠️  Gemini returned empty recommendations');
      return generateRuleBasedRecommendations(userAnalysis, portfolioData);
    }

    console.log('✅ AI recommendations generated successfully');

    // Parse AI recommendations
    const parsed = parseAIRecommendations(aiText);

    return {
      recommendations: parsed.recommendations,
      strategies: parsed.strategies,
      warnings: parsed.warnings,
      opportunities: parsed.opportunities,
      raw: aiText,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ AI recommendations error:', error.message);
    return generateRuleBasedRecommendations(userAnalysis, portfolioData);
  }
};

/**
 * Build prompt for AI recommendations
 */
function buildRecommendationsPrompt(analysis, portfolio, comparison) {
  const metrics = analysis.metrics || {};
  const comparisonInsights = comparison?.insights || [];
  
  return `
You are a crypto portfolio advisor. Analyze this trader's profile and provide personalized recommendations.

**Trader Profile:**
- Personality: ${analysis.personality}
- Risk Score: ${analysis.riskScore}/10 (1=conservative, 10=degen)
- Portfolio Value: $${metrics.totalValue?.toFixed(2) || 0}
- Chains: ${metrics.chains?.join(', ') || 'Unknown'}
- Position Count: ${metrics.positionCount || 0}
- Allocations: ${JSON.stringify(metrics.allocations || {})}

**Comparison with Similar Traders:**
${comparisonInsights.map(i => `- ${i.message}`).join('\n')}

**Your Task:**
Provide 3-4 specific, actionable trading recommendations tailored to their personality and risk profile. Format as:

1. **Recommendation Title**
   Brief description (1-2 sentences)
   Category: [rebalance/explore/defi/risk-management]

2. **Recommendation Title**
   Brief description
   Category: [category]

Also add:
- One strategy for their personality type
- One key warning/risk to watch
- One market opportunity to consider

Keep it concise, professional, and actionable. No fluff.
`.trim();
}

/**
 * Parse AI recommendations response
 */
function parseAIRecommendations(aiText) {
  const lines = aiText.split('\n').filter(line => line.trim());
  const recommendations = [];
  const strategies = [];
  const warnings = [];
  const opportunities = [];

  let currentSection = null;
  let currentRec = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect sections
    if (line.match(/strategy|strategies/i)) {
      currentSection = 'strategy';
      continue;
    }
    if (line.match(/warning|risk|caution/i)) {
      currentSection = 'warning';
      continue;
    }
    if (line.match(/opportunity|opportunities/i)) {
      currentSection = 'opportunity';
      continue;
    }

    // Parse recommendations (numbered)
    const recMatch = line.match(/^(\d+)\.\s+\*\*(.*?)\*\*/);
    if (recMatch) {
      if (currentRec) recommendations.push(currentRec);
      
      currentRec = {
        title: recMatch[2],
        description: '',
        category: 'general',
      };
      currentSection = 'rec';
      continue;
    }

    // Add content to current item
    if (currentSection === 'rec' && currentRec) {
      if (line.match(/category:/i)) {
        const catMatch = line.match(/category:\s*\[?([\w-]+)\]?/i);
        if (catMatch) {
          currentRec.category = catMatch[1].toLowerCase();
        }
      } else if (!line.match(/^\d+\./) && line.length > 0) {
        currentRec.description += (currentRec.description ? ' ' : '') + line;
      }
    } else if (currentSection === 'strategy' && line.length > 10) {
      strategies.push(line.replace(/^[-*•]\s*/, ''));
    } else if (currentSection === 'warning' && line.length > 10) {
      warnings.push(line.replace(/^[-*•]\s*/, ''));
    } else if (currentSection === 'opportunity' && line.length > 10) {
      opportunities.push(line.replace(/^[-*•]\s*/, ''));
    }
  }

  // Add last recommendation
  if (currentRec) recommendations.push(currentRec);

  return {
    recommendations: recommendations.slice(0, 4),
    strategies: strategies.slice(0, 2),
    warnings: warnings.slice(0, 2),
    opportunities: opportunities.slice(0, 2),
  };
}

/**
 * Fallback rule-based recommendations
 */
function generateRuleBasedRecommendations(analysis, portfolio) {
  const recommendations = [];
  const metrics = analysis.metrics || {};
  const allocations = metrics.allocations || {};

  // Rule 1: Stablecoin balance
  if (allocations.stablecoins < 0.1) {
    recommendations.push({
      title: 'Build a Stablecoin Buffer',
      description: 'Keep 10-20% in stablecoins for opportunities and market downturns',
      category: 'risk-management',
    });
  } else if (allocations.stablecoins > 0.5) {
    recommendations.push({
      title: 'Deploy Idle Stablecoins',
      description: 'Consider DeFi yields or strategic positions - too much cash is opportunity cost',
      category: 'defi',
    });
  }

  // Rule 2: Blue-chip allocation
  if (allocations.bluechip < 0.3 && analysis.riskScore > 6) {
    recommendations.push({
      title: 'Increase Blue-Chip Exposure',
      description: 'Add more ETH/BTC for stability given your high-risk profile',
      category: 'rebalance',
    });
  }

  // Rule 3: Chain diversity
  if (metrics.chainCount < 3) {
    recommendations.push({
      title: 'Explore Layer 2 Solutions',
      description: 'Expand to Base, Arbitrum, or Optimism for lower fees and new opportunities',
      category: 'explore',
    });
  }

  // Rule 4: DeFi engagement
  if (metrics.protocolCount < 3 && allocations.defi < 0.1) {
    recommendations.push({
      title: 'Start with DeFi Basics',
      description: 'Explore Aave or Compound for passive yield on your holdings',
      category: 'defi',
    });
  }

  return {
    recommendations: recommendations.slice(0, 4),
    strategies: ['Maintain your current risk profile', 'Focus on long-term fundamentals'],
    warnings: ['Watch for market volatility', 'Don\'t overextend on leverage'],
    opportunities: ['Layer 2 ecosystems are growing', 'DeFi yields remain attractive'],
    generatedAt: new Date().toISOString(),
  };
}

