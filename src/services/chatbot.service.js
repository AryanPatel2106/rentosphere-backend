/**
 * Rentosphere AI Chatbot Service ("RentoBot")
 * Multi-turn conversational AI assistant powered by Google Gemini with domain knowledge
 * and resilient local FAQ fallback.
 */

const CHATBOT_SYSTEM_INSTRUCTION = `You are "RentoBot", the smart, warm, and highly knowledgeable AI Assistant for "Rentosphere", India's modern zero-brokerage rental housing platform.

Your primary mission is to help tenants find their ideal home and assist landlords in managing and listing properties effortlessly.

Key Platform Knowledge:
1. Zero Brokerage: Rentosphere connects tenants directly with verified property owners via Phone call or WhatsApp. No broker fees or middleman commissions.
2. Property Discovery: Users can search by City (Chennai, Bangalore, Hyderabad, Mumbai, Coimbatore, etc.), Locality (Velachery, Adyar, Koramangala, etc.), BHK (1RK, 1BHK, 2BHK, 3BHK, 4BHK), Rent Budget, Furnishing, Tenant Preference (Family, Bachelors, Company), Amenities (Gym, Swimming Pool, Power Backup, Lift, Wi-Fi), and Pet-friendly homes.
3. AI Deal Valuation & Rent Estimator: Our ML engine evaluates neighborhood comps and amenities to score deals ("Great Deal", "Fair Price", "Premium") and estimate fair monthly rent.
4. Rental Applications: Tenants can apply to rent properties directly from the listing page with their move-in date and a personalized message to the owner.
5. Payments & Receipts: Supports secure digital rent payments via Razorpay with instant HRA-compliant rent receipts, plus offline payment logging.
6. Listing a Home: Owners can list properties for free with photos, description, and amenities in minutes under "/post-property".

Behavior Rules:
- Keep responses friendly, structured, concise (2-4 brief paragraphs or bullet points).
- If the user asks for properties in a specific city/locality/budget/BHK, suggest a direct link to search results (e.g., "/search?locality=Velachery&bhkType=2BHK").
- Provide 2 to 3 relevant follow-up "quickReplies" so the user can continue the conversation with one click.
- Return a valid JSON object matching the response schema:

Response JSON Schema:
{
  "reply": "Conversational markdown response with bullet points if helpful",
  "suggestedActions": [
    {
      "label": "Button Label (e.g. 'View 2BHK in Velachery')",
      "url": "/search?locality=Velachery&bhkType=2BHK"
    }
  ],
  "quickReplies": ["Short follow-up question 1", "Short follow-up question 2"]
}`;

const DOMAIN_FALLBACKS = [
  {
    keywords: ["brokerage", "commission", "fee", "charges", "cost"],
    reply: "### 100% Zero Brokerage at Rentosphere 🎉\n\nAt Rentosphere, tenants connect **directly with verified homeowners** via phone or WhatsApp. There are absolutely **zero brokerage commissions** or hidden middleman fees!\n\nEvery listing is verified, and you deal straight with the owner.",
    suggestedActions: [
      { label: "Search Homes Now", url: "/search" }
    ],
    quickReplies: ["How do I contact owners?", "How does security deposit work?", "Find 2BHK under 25k"]
  },
  {
    keywords: ["deposit", "security deposit", "advance", "agreement", "lease"],
    reply: "### Security Deposit & Rental Agreements 📄\n\n- **Typical Deposit**: In cities like Chennai and Bangalore, security deposits typically range between 3 to 10 months of rent, depending on the property type.\n- **Rental Agreement**: We recommend signing a registered 11-month rental agreement outlining the maintenance charges, notice period (usually 1-2 months), and deposit refund terms.\n- **Protection**: Never transfer token advances without visiting the property and verifying ownership documents in person.",
    suggestedActions: [
      { label: "Browse Verified Listings", url: "/search" }
    ],
    quickReplies: ["Is there any brokerage?", "How do I apply to rent?", "Pay Rent via Razorpay"]
  },
  {
    keywords: ["post", "list", "owner", "landlord", "sell", "publish", "add property"],
    reply: "### Listing Your Property on Rentosphere 🏡\n\nListing your home is **free and takes under 3 minutes**:\n\n1. Go to **Post Property**\n2. Enter property details (Location, BHK, Furnishing, Amenities)\n3. Use our **AI Fair Rent Estimator** to find the optimal rental price based on nearby comps\n4. Upload high-resolution photos and publish instantly!",
    suggestedActions: [
      { label: "Post Your Property", url: "/post-property" }
    ],
    quickReplies: ["How does rent estimator work?", "Is listing free for owners?", "How do tenants contact me?"]
  },
  {
    keywords: ["estimate", "valuation", "fair rent", "calculator", "market price", "knn", "ml"],
    reply: "### AI Rent Valuation Engine 📊\n\nOur smart ML valuation engine analyzes verified comparable properties within a 5 km radius, factoring in:\n- **BHK Configuration & Square Footage**\n- **Furnishing Level** (Fully vs Semi vs Unfurnished)\n- **Premium Amenities** (Gym, Swimming Pool, Gated Security)\n\nIt provides an estimated fair market rent and confidence score so you neither underprice nor overprice your property.",
    suggestedActions: [
      { label: "Try Rent Estimator", url: "/post-property" }
    ],
    quickReplies: ["Post a Property", "Find Great Deals in Chennai", "Zero Brokerage Policy"]
  },
  {
    keywords: ["pay rent", "payment", "razorpay", "receipt", "hra"],
    reply: "### Digital Rent Payments & HRA Receipts 💳\n\n- You can pay rent securely online using Credit Card, UPI, Debit Card, or Net Banking via **Razorpay**.\n- Instant **HRA-compliant rent receipts** with landlord details are generated for tax savings.\n- Landlords can also record offline cash or bank transfer payments with one click.",
    suggestedActions: [
      { label: "Pay Rent Online", url: "/pay-rent" }
    ],
    quickReplies: ["Can I get HRA receipts?", "Are online payments safe?", "Contact Support"]
  }
];

/**
 * Clean and build URL search action from natural query
 */
function extractSearchActionFromPrompt(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const params = new URLSearchParams();

  // BHK
  const bhkMatch = lower.match(/\b([1-4])\s*(?:bhk|bedroom|bed)\b/);
  if (bhkMatch) {
    params.set("bhkType", `${bhkMatch[1]}BHK`);
  }

  // Budget
  const rentMatch = lower.match(/(?:under|below|less than|within)\s*(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)/);
  if (rentMatch) {
    let raw = rentMatch[1].toLowerCase().replace(/[^0-9k]/g, "");
    if (raw.endsWith("k")) raw = String(parseFloat(raw) * 1000);
    params.set("maxRent", raw);
  }

  // Known localities
  const localities = [
    "velachery", "adyar", "anna nagar", "t nagar", "t. nagar", "omr",
    "thoraipakkam", "sholinganallur", "porur", "guindy", "mylapore",
    "nungambakkam", "koramangala", "indiranagar", "whitefield", "hsr layout"
  ];
  for (const loc of localities) {
    if (lower.includes(loc)) {
      const cleanLoc = loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      params.set("locality", cleanLoc);
      params.set("q", cleanLoc);
      break;
    }
  }

  // Known cities
  const cities = ["chennai", "bangalore", "bengaluru", "hyderabad", "mumbai", "coimbatore", "madurai"];
  for (const c of cities) {
    if (lower.includes(c)) {
      params.set("city", c.charAt(0).toUpperCase() + c.slice(1));
      break;
    }
  }

  const queryStr = params.toString();
  if (queryStr) {
    return {
      label: `View Matches on Rentosphere`,
      url: `/search?${queryStr}`
    };
  }
  return null;
}

/**
 * Rule-based fallback response if Gemini is unavailable
 */
function generateFallbackResponse(userMessage) {
  const lower = (userMessage || "").toLowerCase();

  // 1. Check domain FAQ matches
  for (const item of DOMAIN_FALLBACKS) {
    if (item.keywords.some(k => lower.includes(k))) {
      const searchAction = extractSearchActionFromPrompt(userMessage);
      const actions = [...item.suggestedActions];
      if (searchAction) actions.unshift(searchAction);
      return {
        reply: item.reply,
        suggestedActions: actions,
        quickReplies: item.quickReplies,
        provider: "domain-knowledge"
      };
    }
  }

  // 2. Search query detection
  const searchAction = extractSearchActionFromPrompt(userMessage);
  if (searchAction || lower.includes("find") || lower.includes("search") || lower.includes("flat") || lower.includes("house") || lower.includes("room")) {
    return {
      reply: `I can help you find verified rental homes matching your needs! Here are the options on Rentosphere with zero brokerage:`,
      suggestedActions: [
        searchAction || { label: "Search All Properties", url: "/search" }
      ],
      quickReplies: ["2BHK in Velachery under 30k", "Pet-friendly homes in Chennai", "Luxury apartments in Adyar"]
    };
  }

  // 3. Default greeting / general assistant
  return {
    reply: `Hi there! I am **RentoBot**, your AI housing assistant on Rentosphere 🏠\n\nHow can I help you today? You can ask me to:\n- **Find verified homes** by locality, budget, or BHK configuration\n- **Explain rental guidelines**, deposits, and agreement norms\n- **Guide owners** on posting listings and estimating fair rent\n- **Learn about 100% zero brokerage**`,
    suggestedActions: [
      { label: "Search Homes", url: "/search" },
      { label: "Post a Property", url: "/post-property" }
    ],
    quickReplies: [
      "Find 2BHK in Chennai under 25k",
      "Is there any brokerage?",
      "How do security deposits work?",
      "How to list my property?"
    ],
    provider: "domain-knowledge"
  };
}

/**
 * Calls Gemini with multi-turn conversation history
 */
async function callGeminiChat(message, history = [], apiKey) {
  const candidateModels = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

  // Format past history for Gemini contents API
  const formattedContents = [];

  // Add past conversation turns
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.content && h.content.trim()) {
        formattedContents.push({
          role: h.role === "assistant" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.content.trim() }]
        });
      }
    }
  }

  // Add current user message
  formattedContents.push({
    role: "user",
    parts: [{ text: message.trim() }]
  });

  let lastError = null;
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: CHATBOT_SYSTEM_INSTRUCTION }]
          },
          contents: formattedContents,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        }),
        signal: AbortSignal.timeout(9000)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini status ${response.status} on ${model}: ${errText.slice(0, 150)}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`Empty response from ${model}`);
      }

      const parsed = JSON.parse(rawText);
      const reply = parsed.reply || "I am here to help you find your ideal rental home on Rentosphere!";
      const suggestedActions = Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [];
      const quickReplies = Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [];

      // Auto-attach direct search link if user asked for specific search criteria and none was provided
      if (suggestedActions.length === 0) {
        const searchAction = extractSearchActionFromPrompt(message);
        if (searchAction) suggestedActions.push(searchAction);
      }

      return {
        reply,
        suggestedActions,
        quickReplies,
        provider: "gemini"
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

/**
 * Main Chatbot query dispatcher
 * @param {string} message - User query
 * @param {Array} history - Previous conversation [{ role, content }]
 * @returns {Promise<object>} Structured response { reply, suggestedActions, quickReplies, provider }
 */
export async function getChatbotResponse(message, history = []) {
  if (!message || !message.trim()) {
    return generateFallbackResponse("");
  }

  const cleanMessage = message.trim();
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (apiKey) {
    try {
      const geminiResult = await callGeminiChat(cleanMessage, history, apiKey);
      if (geminiResult && geminiResult.reply) {
        return geminiResult;
      }
    } catch (err) {
      console.warn(`[RentoBot] Gemini call failed (${err.message}). Using domain fallback.`);
    }
  }

  return generateFallbackResponse(cleanMessage);
}
