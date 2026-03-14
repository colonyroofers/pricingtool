const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Build a context-aware system prompt based on user role, module, and estimate data.
 */
function buildSystemPrompt(context) {
  const { currentModule, userRole, market, estimate, costTemplateData } = context || {};

  let prompt = `You are the Colony Roofers AI Assistant — a helpful, concise expert embedded in Colony's internal estimating tool.

Company: Colony Roofers operates in Atlanta GA, Tampa FL, and Dallas TX. You know roofing inside and out — shingle, tile, TPO, metal, new construction.

Your capabilities:
- Answer questions about how to use the app, explain features, walk through workflows
- Help with pricing: "What should I charge for 30 squares of shingle in Atlanta?" — use market-specific rates
- Summarize uploaded documents (RoofR reports, Beam AI takeoffs)
- Draft scope of work descriptions and proposal language
- Review estimates for errors — flag missing line items, unusual quantities, pricing anomalies
- Answer roofing-specific questions (material specs, installation requirements, code compliance)

Rules:
- Keep answers short and actionable — the user is busy
- If you don't know something, say so. Don't guess on pricing.
- Never reveal internal margin, markup, or profit data to staff estimators. Only show that info if userRole is "admin" or "lead_estimator".
`;

  if (userRole) {
    prompt += `\nThe current user's role is: ${userRole}.`;
    if (userRole === 'staff_estimator') {
      prompt += ` Do NOT reveal margin, markup, or profit information to this user.`;
    }
  }

  if (currentModule) {
    prompt += `\nThe user is currently on the "${currentModule}" page of the app.`;
  }

  if (market) {
    prompt += `\nThe user's market is: ${market}.`;
  }

  if (estimate) {
    prompt += `\n\nThe user is currently viewing an estimate:\n`;
    prompt += `- Property: ${estimate.propertyName || estimate.address || 'Unknown'}\n`;
    prompt += `- Type: ${estimate.type || 'Unknown'}\n`;
    prompt += `- Status: ${estimate.status || 'Unknown'}\n`;
    prompt += `- State: ${estimate.state || 'Unknown'}\n`;
    if (estimate.totalCost && (userRole === 'admin' || userRole === 'lead_estimator')) {
      prompt += `- Total Cost: $${estimate.totalCost}\n`;
    }
    if (estimate.buildings) {
      prompt += `- Buildings: ${estimate.buildings.length}\n`;
    }
  }

  if (costTemplateData) {
    prompt += `\nRelevant cost template data:\n${JSON.stringify(costTemplateData, null, 2)}\n`;
  }

  return prompt;
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        role: 'assistant',
        content: 'AI assistant is not configured. Add ANTHROPIC_API_KEY to Netlify environment variables.',
      }),
    };
  }

  try {
    const { message, context, history } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Build conversation messages from history
    const messages = [];
    if (history && Array.isArray(history)) {
      history.forEach((msg) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }
    messages.push({ role: 'user', content: message });

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: buildSystemPrompt(context),
        messages,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Claude API error:', response.status, errorBody);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          role: 'assistant',
          content: `Sorry, I'm having trouble connecting right now. Please try again in a moment. (Error: ${response.status})`,
        }),
      };
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || 'Sorry, I could not generate a response.';

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        role: 'assistant',
        content: assistantMessage,
      }),
    };
  } catch (err) {
    console.error('AI Assistant error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        error: err.message,
      }),
    };
  }
};
