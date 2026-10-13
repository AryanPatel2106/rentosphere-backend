/**
 * Rentosphere AI Chatbot Service ("RentoBot")
 * Multi-turn conversational AI assistant powered by Google Gemini with domain knowledge
 * and resilient local FAQ fallback.
 */

const CHATBOT_SYSTEM_INSTRUCTION = `You are "RentoBot", the smart, warm, empathetic, and highly knowledgeable AI Assistant for "Rentosphere", India's modern zero-brokerage rental housing platform.

Your primary mission is to help tenants find their ideal home and assist landlords in managing and listing properties effortlessly.

Key Platform Knowledge:
1. Zero Brokerage: Rentosphere connects tenants directly with verified property owners via Phone call or WhatsApp. No broker fees or middleman commissions.
2. Property Discovery: Users can search by City (Chennai, Bangalore, Hyderabad, Mumbai, Coimbatore, etc.), Locality (Velachery, Adyar, Koramangala, etc.), BHK (1RK, 1BHK, 2BHK, 3BHK, 4BHK), Property Type (Apartment, Independent House, Villa, Studio, PG/Co-living), Availability (Immediate, Within 15 Days, Within 30 Days), Rent Budget, Furnishing, Tenant Preference (Family, Bachelors, Company), Amenities (Gym, Swimming Pool, Power Backup, Lift, Wi-Fi), and Pet-friendly homes.
3. AI Deal Valuation & Rent Estimator: Our ML engine evaluates neighborhood comps and amenities to score deals ("Great Deal", "Fair Price", "Premium") and estimate fair monthly rent.
4. Rental Applications: Tenants can apply to rent properties directly from the listing page with their move-in date and a personalized message to the owner.
5. Payments & Receipts: Supports secure digital rent payments via Razorpay with instant HRA-compliant rent receipts, plus offline payment logging.
6. Listing a Home: Owners can list properties for free with photos, description, and amenities in minutes under "/post-property".

Exact Search Query Parameter Specifications:
When creating search URLs for links or suggestedActions, you MUST use RELATIVE URLs starting with "/search" (NEVER include "http://localhost:5173" or hostnames):
- parking: MUST use "parking=true" when parking is requested (e.g. "with parking", "car park", "bike parking").
- view mode: MUST use "view=map" when map view is requested (e.g. "open in map", "show on map", "map view").
- pet-friendly: MUST use "petFriendly=true" (DO NOT use "isPetFriendly", use strictly "petFriendly=true").
- availability: MUST use "availability=Immediate", "availability=Within 15 Days", or "availability=Within 30 Days".
- property type: MUST use "propertyType=Independent House" (for house), "propertyType=Apartment" (for flat/apartment), "propertyType=Villa", "propertyType=Studio", "propertyType=PG/Co-living".
- budget: MUST use "maxRent=<number>" (e.g. "maxRent=10000", "minRent=1") and/or "minRent=<number>".
- sorting: MUST use "sortBy=rent_asc" (for low range/budget/cheap), "sortBy=rent_desc", "sortBy=newest", or "sortBy=nearest".
- city: "city=Chennai", "city=Bangalore", etc.
- locality: "locality=Velachery", "locality=Adyar", etc.
- bhk: "bhkType=1BHK", "bhkType=2BHK", "bhkType=3BHK", etc.
- Combine ALL accumulated filters across the user's conversation! If the user asked for budget up to 10k, parking, and map view, produce the link:
  "/search?maxRent=10000&parking=true&sortBy=rent_asc&view=map".
- If the user previously asked for something and in subsequent turns adds or asks "add parking to it" or "open in map", RETAIN all prior filters (maxRent, etc.) and add the new parameters!

Behavior & Linguistic Capabilities:
- Multi-Turn Conversation Memory: Accumulate search constraints across previous turns! If the user previously specified Chennai and immediate availability, and now asks for pets allowed or low budget, include ALL of these filters in your generated search links and buttons.
- Universal Human Language Comprehension: Understand user queries in ANY language or style — English, Hindi, Hinglish, Tamil, Tanglish, regional mixtures, informal slang, typos, and phonetic spellings (e.g., "velachery me sasta 2bhk chahiye 25 hazar tak", "bina brokerage wala ghar", "omr la flat venum", "deposit kitna dena hoga", "can bachelors stay?").
- Natural Conversational Tone: If the user addresses you in Hindi or Hinglish, reply warmly and politely in natural, conversational Hinglish/English. If the user writes in English, reply in clear, friendly English.
- Active Search Deep-Links: If the user is looking for homes by locality/city/budget/BHK/propertyType/availability/amenity (in any language), ALWAYS generate a matching action button in "suggestedActions" with a clean search URL (e.g. url: "/search?city=Chennai&petFriendly=true&availability=Immediate&sortBy=rent_asc").
- Interactive In-Text Markdown Links: In your "reply" markdown text, you can also include clickable relative markdown links such as "[View listings in Chennai](/search?city=Chennai&petFriendly=true&availability=Immediate)" so the user can click them directly from your message text!
- Follow-Up Quick Replies: Provide 2 to 3 relevant follow-up "quickReplies" so the user can easily continue the conversation with one click.
- Output Format: Return ONLY a valid JSON object matching this schema:

Response JSON Schema:
{
  "reply": "Conversational markdown response with helpful explanation, bullet points, and relative markdown links [Label](/search?city=Chennai&petFriendly=true&availability=Immediate...)",
  "suggestedActions": [
    {
      "label": "Button Label (e.g. 'View Pet-Friendly Homes in Chennai (Immediate)')",
      "url": "/search?city=Chennai&petFriendly=true&availability=Immediate&sortBy=rent_asc"
    }
  ],
  "quickReplies": ["Short follow-up question 1", "Short follow-up question 2"]
}`;

const DOMAIN_FALLBACKS = [
  {
    keywords: [
      "brokerage", "commission", "fee", "charges", "cost", "dalali", "dalal",
      "bina brokerage", "zero brokerage", "koi fee", "extra charge", "free"
    ],
    reply: "### 100% Zero Brokerage at Rentosphere 🎉\n\nAt Rentosphere, tenants connect **directly with verified homeowners** via phone or WhatsApp. There are absolutely **zero brokerage commissions**, middleman dalali, or hidden fees!\n\nEvery listing is verified, and you deal straight with the owner without paying any commission.",
    suggestedActions: [
      { label: "Search Verified Homes", url: "/search" }
    ],
    quickReplies: ["How do I contact owners?", "How does security deposit work?", "Find 2BHK in Chennai"]
  },
  {
    keywords: [
      "deposit", "security deposit", "advance", "agreement", "lease", "jama",
      "suraksha", "advance kitna", "deposit kitna"
    ],
    reply: "### Security Deposit & Rental Agreements 📄\n\n- **Typical Deposit**: In cities like Chennai and Bangalore, security deposits typically range between 3 to 10 months of rent, depending on the property type.\n- **Rental Agreement**: We recommend signing a registered 11-month rental agreement outlining the maintenance charges, notice period (usually 1-2 months), and deposit refund terms.\n- **Safety Tip**: Never transfer token advances without visiting the property and verifying ownership documents in person.",
    suggestedActions: [
      { label: "Browse Verified Listings", url: "/search" }
    ],
    quickReplies: ["Is there any brokerage?", "How do I apply to rent?", "Pay Rent via Razorpay"]
  },
  {
    keywords: [
      "post", "list", "owner", "landlord", "sell", "publish", "add property",
      "makan malik", "ghar chadana", "kiraye pe dena", "flat dalna", "ghar post"
    ],
    reply: "### Listing Your Property on Rentosphere 🏡\n\nListing your home is **100% free and takes under 3 minutes**:\n\n1. Go to **[Post Property](/post-property)**\n2. Enter property details (Location, BHK, Furnishing, Amenities)\n3. Use our **AI Fair Rent Estimator** to find the optimal rental price based on nearby comps\n4. Upload photos and publish instantly for verified tenants to contact you!",
    suggestedActions: [
      { label: "Post Your Property for Free", url: "/post-property" }
    ],
    quickReplies: ["How does rent estimator work?", "Is listing free for owners?", "How do tenants contact me?"]
  },
  {
    keywords: [
      "estimate", "valuation", "fair rent", "calculator", "market price", "knn",
      "ml", "sahi rent", "kiraya kitna", "rate", "daam", "rent price"
    ],
    reply: "### AI Rent Valuation Engine 📊\n\nOur smart ML valuation engine analyzes verified comparable properties within a 5 km radius, factoring in:\n- **BHK Configuration & Square Footage**\n- **Furnishing Level** (Fully vs Semi vs Unfurnished)\n- **Premium Amenities** (Gym, Swimming Pool, Gated Security)\n\nIt calculates an estimated fair market rent and confidence score so landlords and tenants agree on a fair, competitive price.",
    suggestedActions: [
      { label: "Try Rent Estimator", url: "/post-property" }
    ],
    quickReplies: ["Post a Property", "Find Great Deals in Chennai", "Zero Brokerage Policy"]
  },
  {
    keywords: [
      "pay rent", "payment", "razorpay", "receipt", "hra", "rashid", "paise",
      "online payment", "rent receipt"
    ],
    reply: "### Digital Rent Payments & HRA Receipts 💳\n\n- Pay rent securely online using Credit Card, UPI, Debit Card, or Net Banking via **Razorpay**.\n- Instant **HRA-compliant rent receipts** with landlord details are generated for your tax savings.\n- Landlords can also record offline cash or bank transfer payments with one click.",
    suggestedActions: [
      { label: "Pay Rent Online", url: "/pay-rent" }
    ],
    quickReplies: ["Can I get HRA receipts?", "Are online payments safe?", "Contact Support"]
  }
];

const LOCALITY_TYPO_MAP = {
  velchery: "Velachery",
  velacherry: "Velachery",
  velachary: "Velachery",
  velachery: "Velachery",
  adyar: "Adyar",
  adyaar: "Adyar",
  anagar: "Anna Nagar",
  annanagar: "Anna Nagar",
  "anna ngr": "Anna Nagar",
  tnagar: "T. Nagar",
  "t nagar": "T. Nagar",
  "t.nagar": "T. Nagar",
  "t-nagar": "T. Nagar",
  shollinganallur: "Sholinganallur",
  solinganallur: "Sholinganallur",
  sholinganallur: "Sholinganallur",
  poroor: "Porur",
  porur: "Porur",
  perungudi: "Perungudi",
  perungudy: "Perungudi",
  thoraipakkam: "Thoraipakkam",
  thuraipakkam: "Thoraipakkam",
  toraipakkam: "Thoraipakkam",
  koramangala: "Koramangala",
  koramangla: "Koramangala",
  indiranagar: "Indiranagar",
  indranagar: "Indiranagar",
  whitefield: "Whitefield",
  "white field": "Whitefield",
  hsr: "HSR Layout",
  "hsr layout": "HSR Layout",
  omr: "OMR",
  "omr road": "OMR",
  guindy: "Guindy",
  mylapore: "Mylapore",
  nungambakkam: "Nungambakkam",
  besant: "Besant Nagar",
  "besant nagar": "Besant Nagar",
  tambaram: "Tambaram",
  chromepet: "Chromepet",
  medavakkam: "Medavakkam",
  pallikaranai: "Pallikaranai",
  alwarpet: "Alwarpet",
  koyambedu: "Koyambedu",
  vadapalani: "Vadapalani",
  "kk nagar": "KK Nagar",
  "k.k. nagar": "KK Nagar"
};

const CITY_TYPO_MAP = {
  chennai: "Chennai",
  chenai: "Chennai",
  madras: "Chennai",
  bangalore: "Bangalore",
  bengaluru: "Bangalore",
  banglore: "Bangalore",
  hyderabad: "Hyderabad",
  hyd: "Hyderabad",
  mumbai: "Mumbai",
  bombay: "Mumbai",
  pune: "Pune",
  delhi: "Delhi",
  coimbatore: "Coimbatore",
  kovai: "Coimbatore",
  madurai: "Madurai",
  madrey: "Madurai",
  trichy: "Tiruchirappalli",
  tiruchirappalli: "Tiruchirappalli",
  kochi: "Kochi",
  cochin: "Kochi"
};

/**
 * Clean and build URL search action from natural query (English + Hindi/Hinglish)
 */
function extractSearchActionFromPrompt(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  const params = new URLSearchParams();

  // BHK (1-5 BHK + Hindi: ek/do/teen/char bhk)
  const bhkMatch =
    lower.match(/\b([1-5])\s*(?:bhk|bedroom|bed|kamra)\b/) ||
    lower.match(/\b(ek|do|teen|char|paanch)\s*(?:bhk|bedroom|bed|kamra)\b/);
  if (bhkMatch) {
    const hindiMap = { ek: 1, do: 2, teen: 3, char: 4, paanch: 5 };
    const num = hindiMap[bhkMatch[1]] || bhkMatch[1];
    params.set("bhkType", `${num}BHK`);
  }

  // Budget (supports k, hazar, hazaar, thousand, lakh)
  // Budget ranges: "1 to 10000", "5000 to 10000", "under 10k"
  const rangeMatch = lower.match(/\b([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|thousand)?)\s*(?:to|-|se)\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|thousand)?)\b/);
  if (rangeMatch) {
    const parseAmt = (str) => {
      const clean = str.toLowerCase().replace(/[,\s₹rs]/g, "");
      if (clean.endsWith("k")) return Math.round(parseFloat(clean.replace("k", "")) * 1000);
      if (clean.endsWith("hazar") || clean.endsWith("thousand")) return Math.round(parseFloat(clean.replace(/(hazar|thousand)/, "")) * 1000);
      if (clean.endsWith("l") || clean.endsWith("lac") || clean.endsWith("lakh")) return Math.round(parseFloat(clean.replace(/(lakh|lac|l)/, "")) * 100000);
      return parseInt(clean, 10);
    };
    const minVal = parseAmt(rangeMatch[1]);
    const maxVal = parseAmt(rangeMatch[2]);
    if (!isNaN(minVal) && minVal > 0) params.set("minRent", String(minVal));
    if (!isNaN(maxVal) && maxVal > 0) params.set("maxRent", String(maxVal));
  } else {
    const rentMatch =
      lower.match(/(?:under|below|less than|within|tak|ke andar|se kam|budget of|budget)\s*(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand)?)/) ||
      lower.match(/([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand))\s*(?:tak|ke andar|se kam|me|mein)/);
    if (rentMatch) {
      const rawNum = rentMatch[1].toLowerCase().replace(/[,\s₹rs]/g, "");
      let amount = null;
      if (rawNum.endsWith("k") || rawNum.endsWith("grand")) {
        amount = Math.round(parseFloat(rawNum.replace(/(k|grand)/, "")) * 1000);
      } else if (rawNum.endsWith("hazar") || rawNum.endsWith("hazaar") || rawNum.endsWith("thousand")) {
        amount = Math.round(parseFloat(rawNum.replace(/(hazaar|hazar|thousand)/, "")) * 1000);
      } else if (rawNum.endsWith("l") || rawNum.endsWith("lac") || rawNum.endsWith("lakh")) {
        amount = Math.round(parseFloat(rawNum.replace(/(lakh|lac|l)/, "")) * 100000);
      } else {
        amount = parseInt(rawNum, 10);
      }
      if (amount && !isNaN(amount)) {
        params.set("maxRent", String(amount));
      }
    }
  }

  // Known localities (with typo mapping)
  for (const [typo, standardLocality] of Object.entries(LOCALITY_TYPO_MAP)) {
    const regex = new RegExp(`\\b${typo}\\b`, "i");
    if (regex.test(lower)) {
      params.set("locality", standardLocality);
      params.set("q", standardLocality);
      break;
    }
  }

  // Known cities (with typo mapping)
  for (const [typo, standardCity] of Object.entries(CITY_TYPO_MAP)) {
    const regex = new RegExp(`\\b${typo}\\b`, "i");
    if (regex.test(lower)) {
      params.set("city", standardCity);
      break;
    }
  }

  // Property Type
  if (/\b(?:villa|bungalow|kothi)\b/i.test(lower)) {
    params.set("propertyType", "Villa");
  } else if (/\b(?:independent house|ind house|house|makan|individual house|kothi)\b/i.test(lower)) {
    params.set("propertyType", "Independent House");
  } else if (/\b(?:pg|paying guest|co-living|coliving|hostel)\b/i.test(lower)) {
    params.set("propertyType", "PG/Co-living");
  } else if (/\b(?:studio|1rk)\b/i.test(lower)) {
    params.set("propertyType", "Studio");
  } else if (/\b(?:flat|apartment|society)\b/i.test(lower)) {
    params.set("propertyType", "Apartment");
  }

  // Availability
  if (/\b(?:imidiately|immediately|immediate|right now|urgent|turant|ready to move|ab|aaj|ready)\b/i.test(lower)) {
    params.set("availability", "Immediate");
  } else if (/\b(?:within 15 days|15 days|15 din|do hafte)\b/i.test(lower)) {
    params.set("availability", "Within 15 Days");
  } else if (/\b(?:within 30 days|30 days|within a month|1 month|ek mahina|ek mahine)\b/i.test(lower)) {
    params.set("availability", "Within 30 Days");
  }

  // Sorting (sasta, cheap, low range, low budget -> rent_asc)
  if (/\b(?:sasta|saste|kam rent|kam kiraya|cheapest|cheap|budget|lowest rent|low range|low price|low budget)\b/i.test(lower)) {
    params.set("sortBy", "rent_asc");
  }

  // Parking
  if (/\b(?:parking|car parking|bike parking|car park|with parking|parking available|parking chahiye)\b/i.test(lower)) {
    params.set("parking", "true");
  }

  // Map view
  if (/\b(?:map|map view|open in map|show on map|on map|map me|map pe)\b/i.test(lower)) {
    params.set("view", "map");
  }

  // Pet friendly
  if (/\b(?:pet friendly|pet-friendly|pets allowed|allow pets|dog|cat|kutta|billi|animals allowed)\b/i.test(lower)) {
    params.set("petFriendly", "true");
  }

  const queryStr = params.toString();
  if (queryStr) {
    const bhkLabel = params.get("bhkType") ? `${params.get("bhkType")} ` : "";
    const typeLabel = params.get("propertyType") ? `${params.get("propertyType")} ` : "";
    const locLabel = params.get("locality") || params.get("city") || "Homes";
    const rentLabel = params.get("maxRent") ? ` (<= ₹${Number(params.get("maxRent")).toLocaleString("en-IN")})` : "";
    return {
      label: `View ${bhkLabel}${typeLabel}in ${locLabel}${rentLabel}`.trim(),
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
 * Sanitizes URLs in reply and suggestedActions:
 * - strips http://localhost... or http://... hostnames to relative paths
 * - converts isPetFriendly=true to petFriendly=true
 * - ensures proper clean encoding
 */
function sanitizeChatbotResult(result, message, history) {
  if (!result) return result;

  // Build accumulated context to detect missing user constraints
  const fullConversation = [...(history || []).map(h => h.content), message].filter(Boolean).join(" ");
  const lowerFull = fullConversation.toLowerCase();

  const sanitizeUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
    let url = rawUrl.trim();
    // Strip hostnames if it points to localhost or client domain
    url = url.replace(/^https?:\/\/(?:localhost(?::[0-9]+)?|127\.0\.0\.1(?::[0-9]+)?|rentosphere\.clouddrive\.page)/i, "");
    if (!url.startsWith("/") && !url.startsWith("http")) {
      url = "/" + url;
    }
    // Normalize parameter aliases: isPetFriendly -> petFriendly
    url = url.replace(/([?&])isPetFriendly=([a-zA-Z0-9_-]+)/g, "$1petFriendly=$2");
    url = url.replace(/([?&])isParking=([a-zA-Z0-9_-]+)/g, "$1parking=$2");

    // Only apply search param enforcement if it is a /search URL
    if (url.startsWith("/search")) {
      try {
        const dummyBase = "http://dummy";
        const parsed = new URL(url, dummyBase);

        // Ensure parking if user explicitly requested it in the session
        if (/\b(?:parking|car parking|bike parking|with parking)\b/i.test(lowerFull) && !parsed.searchParams.has("parking")) {
          parsed.searchParams.set("parking", "true");
        }

        // Ensure view=map if user requested map view
        if (/\b(?:map|map view|open in map|show on map|on map)\b/i.test(message.toLowerCase()) && !parsed.searchParams.has("view")) {
          parsed.searchParams.set("view", "map");
        }

        // Ensure petFriendly if user requested pet friendly
        if (/\b(?:pet friendly|pet-friendly|pets allowed|allow pets)\b/i.test(lowerFull) && !parsed.searchParams.has("petFriendly")) {
          parsed.searchParams.set("petFriendly", "true");
        }

        // Ensure availability if user requested immediate
        if (/\b(?:immediate|imidiately|immediately|urgent|turant|ready to move)\b/i.test(lowerFull) && !parsed.searchParams.has("availability")) {
          parsed.searchParams.set("availability", "Immediate");
        }

        url = parsed.pathname + parsed.search;
      } catch {
        // keep url as is
      }
    }

    return url;
  };

  // 1. Sanitize in-text markdown links in reply
  let reply = (result.reply || "").replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
    const cleanHref = sanitizeUrl(href);
    return `[${label}](${cleanHref})`;
  });

  // 2. Sanitize suggestedActions
  let actions = (Array.isArray(result.suggestedActions) ? result.suggestedActions : []).map(action => {
    return {
      ...action,
      url: sanitizeUrl(action.url)
    };
  });

  // If no action exists, extract one from accumulated conversation
  if (actions.length === 0) {
    const fallbackAction = extractSearchActionFromPrompt(fullConversation);
    if (fallbackAction) {
      actions.push({
        ...fallbackAction,
        url: sanitizeUrl(fallbackAction.url)
      });
    }
  }

  return {
    ...result,
    reply,
    suggestedActions: actions
  };
}

/**
 * Calls OpenAI chat completions as a fallback/alternative to Gemini
 */
async function callOpenAIChat(message, history = [], apiKey) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  const messages = [
    { role: "system", content: CHATBOT_SYSTEM_INSTRUCTION }
  ];

  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.content && h.content.trim()) {
        messages.push({
          role: h.role === "assistant" || h.role === "model" ? "assistant" : "user",
          content: h.content.trim()
        });
      }
    }
  }

  messages.push({
    role: "user",
    content: message.trim()
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.3
    }),
    signal: AbortSignal.timeout(9000)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI status ${response.status}: ${errText.slice(0, 150)}`);
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content;
  if (!rawText) throw new Error("Empty response from OpenAI");

  const parsed = JSON.parse(rawText);
  return {
    reply: parsed.reply || "I am here to help you find your ideal rental home on Rentosphere!",
    suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
    quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies : [],
    provider: "openai"
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
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  // 1. Try Gemini first
  if (geminiKey) {
    try {
      const geminiResult = await callGeminiChat(cleanMessage, history, geminiKey);
      if (geminiResult && geminiResult.reply) {
        return sanitizeChatbotResult(geminiResult, cleanMessage, history);
      }
    } catch (err) {
      console.warn(`[RentoBot] Gemini call failed (${err.message}). Trying OpenAI fallback.`);
    }
  }

  // 2. Try OpenAI second
  if (openAiKey) {
    try {
      const openAiResult = await callOpenAIChat(cleanMessage, history, openAiKey);
      if (openAiResult && openAiResult.reply) {
        return sanitizeChatbotResult(openAiResult, cleanMessage, history);
      }
    } catch (err) {
      console.warn(`[RentoBot] OpenAI call failed (${err.message}). Using domain fallback.`);
    }
  }

  // 3. Resilient local fallback
  const fallback = generateFallbackResponse(cleanMessage);
  return sanitizeChatbotResult(fallback, cleanMessage, history);
}
