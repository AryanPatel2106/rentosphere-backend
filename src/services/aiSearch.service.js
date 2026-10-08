/**
 * AI Natural Language Search Parser Service
 * Parses unstructured conversational search queries into structured filter parameters.
 * e.g., "Find me a pet-friendly 2bhk in chennai under 25k with car parking and power backup"
 */

const KNOWN_CITIES = [
  "chennai",
  "coimbatore",
  "madurai",
  "kanchipuram",
  "salem",
  "tiruchirappalli",
  "trichy",
  "tirunelveli",
  "vellore",
  "erode",
  "bangalore",
  "bengaluru",
  "hyderabad",
  "mumbai",
  "pune",
  "delhi",
  "kolkata",
  "kochi"
];

const KNOWN_LOCALITIES = [
  "t. nagar", "t nagar", "velachery", "adyar", "anna nagar", "alwarpet",
  "thoraipakkam", "sholinganallur", "omr", "porur", "guindy", "nungambakkam",
  "besant nagar", "mylapore", "kelambakkam", "vandalur", "siruseri", "tambaram",
  "perungudi", "medavakkam", "pallikaranai", "chromepet", "koyambedu", "egmore",
  "saidapet", "kodambakkam", "kilpauk", "vadapalani", "kk nagar", "k.k. nagar",
  "rs puram", "peelamedu", "gandhipuram", "saravanampatti", "anna nagar madurai",
  "kk nagar madurai", "ss colony", "koramangala", "indiranagar", "whitefield", "hsr layout"
];

const AMENITY_MAP = {
  lift: "Lift",
  elevator: "Lift",
  "power backup": "Power Backup",
  "power-backup": "Power Backup",
  backup: "Power Backup",
  generator: "Power Backup",
  gym: "Gym",
  fitness: "Gym",
  "swimming pool": "Swimming Pool",
  pool: "Swimming Pool",
  security: "Gated Security",
  "gated security": "Gated Security",
  gated: "Gated Security",
  clubhouse: "Clubhouse",
  park: "Park",
  garden: "Park",
  "gas pipeline": "Gas Pipeline",
  gas: "Gas Pipeline",
  wifi: "Wi-Fi",
  "wi-fi": "Wi-Fi",
  internet: "Wi-Fi"
};

const ALLOWED_AMENITIES = [
  "Lift", "Power Backup", "Gym", "Swimming Pool", "Gated Security",
  "Clubhouse", "Park", "Gas Pipeline", "Wi-Fi"
];

const SYSTEM_INSTRUCTIONS = `You are an expert real estate AI search query parser for "Rentosphere", an Indian rental housing platform.
Analyze the user's conversational rental query and return a valid JSON object matching the platform filter schema.

Return ONLY a JSON object with these fields (set field to null or omit if not requested by the user):
{
  "bhkType": "1 RK" | "1 BHK" | "2 BHK" | "3 BHK" | "4+ BHK" | null,
  "city": string | null,
  "locality": string | null,
  "minRent": string numeric in INR (e.g. "15000") | null,
  "maxRent": string numeric in INR (e.g. "25000") | null,
  "propertyType": "Apartment" | "Independent House" | "Villa" | "Builder Floor" | null,
  "furnishing": "Fully Furnished" | "Semi-Furnished" | "Unfurnished" | null,
  "preferredTenant": "Bachelors" | "Family" | "Anyone" | "Company" | null,
  "parking": boolean | null,
  "petFriendly": boolean | null,
  "amenities": array of strings from ["Lift", "Power Backup", "Gym", "Swimming Pool", "Gated Security", "Clubhouse", "Park", "Gas Pipeline", "Wi-Fi"],
  "keyword": string (landmark, tech park, society name, or metro station) | null,
  "tags": array of 2 to 5 short string badges for UI chips (e.g. ["2 BHK", "Max ₹25,000", "Velachery", "Pet Friendly"]),
  "summary": string (clean natural language summary of search intent)
}

Important Domain Rules:
- Indian currency shorthand: "25k" = "25000", "15 thousand" = "15000", "1.5 lakh" = "150000", "under 20k" -> maxRent: "20000", "between 15k and 25k" -> minRent: "15000", maxRent: "25000", "above 30k" -> minRent: "30000".
- Indian rental types: "1bhk", "2bhk", "1rk", "studio" -> "1 RK", "single bedroom" -> "1 BHK".
- Standardize propertyType: "flat" or "society" -> "Apartment", "independent house" -> "Independent House", "villa" -> "Villa".
- Standardize preferredTenant: "bachelor" or "students" or "boys" or "girls" -> "Bachelors", "family" -> "Family".
- Only include amenities from the allowed list.
- Do not invent criteria the user did not state.`;

/**
 * Sanitizes and normalizes output from any parser (LLM or heuristic)
 */
function sanitizeParsedFilters(raw, originalPrompt) {
  const filters = {};
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean) : [];

  // BHK Type
  if (raw.bhkType) {
    const b = String(raw.bhkType).trim().toUpperCase();
    if (b.includes("1 RK") || b.includes("1RK") || b.includes("STUDIO")) filters.bhkType = "1 RK";
    else if (b.includes("1 BHK") || b.includes("1BHK")) filters.bhkType = "1 BHK";
    else if (b.includes("2 BHK") || b.includes("2BHK")) filters.bhkType = "2 BHK";
    else if (b.includes("3 BHK") || b.includes("3BHK")) filters.bhkType = "3 BHK";
    else if (b.includes("4") || b.includes("4+")) filters.bhkType = "4+ BHK";
  }

  // City & Locality
  if (raw.city && typeof raw.city === "string" && raw.city.trim()) {
    filters.city = raw.city.trim().charAt(0).toUpperCase() + raw.city.trim().slice(1);
    if (filters.city.toLowerCase() === "trichy") filters.city = "Tiruchirappalli";
    if (filters.city.toLowerCase() === "bengaluru") filters.city = "Bangalore";
  }

  if (raw.locality && typeof raw.locality === "string" && raw.locality.trim()) {
    filters.locality = raw.locality.trim().split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // Budget
  if (raw.minRent !== undefined && raw.minRent !== null && String(raw.minRent).trim()) {
    const minN = parseInt(String(raw.minRent).replace(/[^0-9]/g, ""), 10);
    if (!isNaN(minN) && minN > 0) filters.minRent = String(minN);
  }

  if (raw.maxRent !== undefined && raw.maxRent !== null && String(raw.maxRent).trim()) {
    const maxN = parseInt(String(raw.maxRent).replace(/[^0-9]/g, ""), 10);
    if (!isNaN(maxN) && maxN > 0) filters.maxRent = String(maxN);
  }

  // Property Type
  if (raw.propertyType) {
    const pt = String(raw.propertyType).trim().toLowerCase();
    if (pt.includes("villa")) filters.propertyType = "Villa";
    else if (pt.includes("independent") || pt.includes("house")) filters.propertyType = "Independent House";
    else if (pt.includes("builder") || pt.includes("floor")) filters.propertyType = "Builder Floor";
    else if (pt.includes("apartment") || pt.includes("flat") || pt.includes("condo")) filters.propertyType = "Apartment";
  }

  // Furnishing
  if (raw.furnishing) {
    const f = String(raw.furnishing).trim().toLowerCase();
    if (f.includes("fully") || f.includes("full")) filters.furnishing = "Fully Furnished";
    else if (f.includes("semi")) filters.furnishing = "Semi-Furnished";
    else if (f.includes("unfurn") || f.includes("empty") || f.includes("raw")) filters.furnishing = "Unfurnished";
  }

  // Preferred Tenant
  if (raw.preferredTenant) {
    const t = String(raw.preferredTenant).trim().toLowerCase();
    if (t.includes("bachelor") || t.includes("student") || t.includes("boy") || t.includes("girl")) filters.preferredTenant = "Bachelors";
    else if (t.includes("family")) filters.preferredTenant = "Family";
    else if (t.includes("company")) filters.preferredTenant = "Company";
    else if (t.includes("anyone") || t.includes("any")) filters.preferredTenant = "Anyone";
  }

  // Parking & Pet Friendly
  if (raw.parking === true || raw.parking === "true") filters.parking = true;
  if (raw.petFriendly === true || raw.petFriendly === "true") filters.petFriendly = true;

  // Amenities
  if (Array.isArray(raw.amenities)) {
    const validAmenities = raw.amenities
      .map(a => AMENITY_MAP[String(a).toLowerCase()] || a)
      .filter(a => ALLOWED_AMENITIES.includes(a));
    if (validAmenities.length > 0) {
      filters.amenities = [...new Set(validAmenities)];
    }
  }

  // Keyword / Landmark
  if (raw.keyword && typeof raw.keyword === "string" && raw.keyword.trim()) {
    filters.keyword = raw.keyword.trim();
  }

  // Build tags if not provided or empty
  if (tags.length === 0) {
    if (filters.bhkType) tags.push(filters.bhkType);
    if (filters.locality) tags.push(filters.locality);
    else if (filters.city) tags.push(filters.city);
    if (filters.minRent && filters.maxRent) {
      tags.push(`₹${Number(filters.minRent).toLocaleString("en-IN")} – ₹${Number(filters.maxRent).toLocaleString("en-IN")}`);
    } else if (filters.maxRent) {
      tags.push(`Max ₹${Number(filters.maxRent).toLocaleString("en-IN")}`);
    } else if (filters.minRent) {
      tags.push(`Min ₹${Number(filters.minRent).toLocaleString("en-IN")}`);
    }
    if (filters.furnishing) tags.push(filters.furnishing);
    if (filters.preferredTenant) tags.push(`For ${filters.preferredTenant}`);
    if (filters.parking) tags.push("Car Parking");
    if (filters.petFriendly) tags.push("Pet Friendly");
    if (filters.amenities) tags.push(...filters.amenities);
  }

  // Summary
  let summary = raw.summary;
  if (!summary || typeof summary !== "string" || !summary.trim()) {
    summary = tags.length > 0
      ? `Searching for ${tags.join(" • ")}`
      : `Showing properties matching "${originalPrompt}"`;
  }

  return {
    success: true,
    originalPrompt,
    filters,
    tags,
    summary
  };
}

/**
 * Call Google Gemini API (gemini-1.5-flash / gemini-2.0-flash) with structured JSON output
 */
async function parseWithGemini(prompt, apiKey) {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: SYSTEM_INSTRUCTIONS },
            { text: `Parse this rental query into JSON: "${prompt}"` }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    }),
    signal: AbortSignal.timeout(4000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 150)}`);
  }

  const json = await response.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini API");
  }

  const parsedJson = JSON.parse(rawText);
  return sanitizeParsedFilters(parsedJson, prompt);
}

/**
 * Call OpenAI API (gpt-4o-mini) with JSON Object output
 */
async function parseWithOpenAI(prompt, apiKey) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const url = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTIONS },
        { role: "user", content: `Parse this rental query into JSON: "${prompt}"` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    }),
    signal: AbortSignal.timeout(4000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText.slice(0, 150)}`);
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content;
  if (!rawText) {
    throw new Error("Empty response from OpenAI API");
  }

  const parsedJson = JSON.parse(rawText);
  return sanitizeParsedFilters(parsedJson, prompt);
}

/**
 * Parses numeric currency strings with k/lakh/thousand suffixes into integer rupees.
 */
function parseCurrencyString(rawStr) {
  if (!rawStr) return null;
  const cleaned = rawStr.toLowerCase().replace(/[,\s₹rs]/g, "");

  if (cleaned.endsWith("k")) {
    const num = parseFloat(cleaned.slice(0, -1));
    return isNaN(num) ? null : Math.round(num * 1000);
  }
  if (cleaned.endsWith("l") || cleaned.endsWith("lac") || cleaned.endsWith("lakh")) {
    const num = parseFloat(cleaned.replace(/(lac|lakh|l)/, ""));
    return isNaN(num) ? null : Math.round(num * 100000);
  }
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Local heuristic parser (fallback when LLM key is absent or network fails)
 */
function parseWithLocalHeuristics(prompt) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return {
      success: true,
      originalPrompt: "",
      filters: {},
      summary: "Showing all available properties."
    };
  }

  let text = prompt.toLowerCase();
  const filters = {};
  const tags = [];

  // 1. BHK Type Extraction
  const bhkMatch = text.match(/\b([1-4])\s*(?:\+|\s*plus)?\s*(?:bhk|bedroom|bed|b\.h\.k)\b/i) ||
                   text.match(/\b(1\s*rk|studio)\b/i);
  if (bhkMatch) {
    const val = bhkMatch[1].toLowerCase();
    if (val.includes("rk") || val.includes("studio")) {
      filters.bhkType = "1 RK";
      tags.push("1 RK");
    } else {
      const num = parseInt(val, 10);
      filters.bhkType = num >= 4 ? "4+ BHK" : `${num} BHK`;
      tags.push(filters.bhkType);
    }
    text = text.replace(bhkMatch[0], " ");
  }

  // 2. Budget / Rent Extraction
  // Range: "between 15k and 25k", "15000 to 25000", "15k - 25k"
  const rangeMatch = text.match(/(?:between|from)?\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)\s*(?:-|to|and)\s*([0-9]+(?:\.[0-9]+)?\s*[kK]?)/);
  if (rangeMatch) {
    const minVal = parseCurrencyString(rangeMatch[1]);
    const maxVal = parseCurrencyString(rangeMatch[2]);
    if (minVal && maxVal && minVal < maxVal) {
      filters.minRent = String(minVal);
      filters.maxRent = String(maxVal);
      tags.push(`₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")}`);
      text = text.replace(rangeMatch[0], " ");
    }
  }

  // Max Rent: "under 25k", "below 30000", "upto 20k", "< 25k", "within 20k"
  if (!filters.maxRent) {
    const maxMatch = text.match(/(?:under|below|less than|max|upto|up to|within|budget of|<|<=)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*[kKlL]?)/i);
    if (maxMatch) {
      const maxVal = parseCurrencyString(maxMatch[1]);
      if (maxVal) {
        filters.maxRent = String(maxVal);
        tags.push(`Max ₹${maxVal.toLocaleString("en-IN")}`);
        text = text.replace(maxMatch[0], " ");
      }
    }
  }

  // Min Rent: "above 15k", "min 10000", "> 15k"
  if (!filters.minRent) {
    const minMatch = text.match(/(?:above|more than|min|starting from|minimum|>|>=)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*[kKlL]?)/i);
    if (minMatch) {
      const minVal = parseCurrencyString(minMatch[1]);
      if (minVal) {
        filters.minRent = String(minVal);
        tags.push(`Min ₹${minVal.toLocaleString("en-IN")}`);
        text = text.replace(minMatch[0], " ");
      }
    }
  }

  // 3. Location & Locality Extraction
  let matchedCity = null;
  for (const city of KNOWN_CITIES) {
    const cityRegex = new RegExp(`\\b${city}\\b`, "i");
    if (cityRegex.test(text)) {
      matchedCity = city.charAt(0).toUpperCase() + city.slice(1);
      if (city === "trichy") matchedCity = "Tiruchirappalli";
      if (city === "bengaluru") matchedCity = "Bangalore";
      filters.city = matchedCity;
      tags.push(matchedCity);
      text = text.replace(cityRegex, " ");
      break;
    }
  }

  let matchedLocality = null;
  for (const loc of KNOWN_LOCALITIES) {
    const locRegex = new RegExp(`\\b${loc}\\b`, "i");
    if (locRegex.test(text)) {
      matchedLocality = loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      filters.locality = matchedLocality;
      tags.push(matchedLocality);
      text = text.replace(locRegex, " ");
      break;
    }
  }

  // Catch generic "in <Word>" or "near <Word>" if neither city nor locality matched
  if (!matchedCity && !matchedLocality) {
    const locContextMatch = text.match(/\b(?:in|near|around|at)\s+([a-zA-Z\s]{3,20})(?:$|\s+(?:under|with|for|bhk|below|having))/i);
    if (locContextMatch && locContextMatch[1]) {
      const extractedLoc = locContextMatch[1].trim();
      const skipWords = ["the", "a", "an", "any", "good", "nice", "flat", "apartment", "house"];
      if (!skipWords.includes(extractedLoc.toLowerCase())) {
        filters.locality = extractedLoc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        tags.push(filters.locality);
        text = text.replace(locContextMatch[0], " ");
      }
    }
  }

  // 4. Property Type
  if (/\b(?:apartment|flat|flats|condo|society)\b/i.test(text)) {
    filters.propertyType = "Apartment";
    tags.push("Apartment");
    text = text.replace(/\b(?:apartment|flat|flats|condo|society)\b/gi, " ");
  } else if (/\b(?:villa|villas|bungalow)\b/i.test(text)) {
    filters.propertyType = "Villa";
    tags.push("Villa");
    text = text.replace(/\b(?:villa|villas|bungalow)\b/gi, " ");
  } else if (/\b(?:independent house|individual house|house|standalone)\b/i.test(text)) {
    filters.propertyType = "Independent House";
    tags.push("Independent House");
    text = text.replace(/\b(?:independent house|individual house|house|standalone)\b/gi, " ");
  } else if (/\b(?:builder floor|floor)\b/i.test(text)) {
    filters.propertyType = "Builder Floor";
    tags.push("Builder Floor");
    text = text.replace(/\b(?:builder floor|floor)\b/gi, " ");
  }

  // 5. Furnishing Status
  if (/\b(?:fully furnished|full furnished|well furnished)\b/i.test(text)) {
    filters.furnishing = "Fully Furnished";
    tags.push("Fully Furnished");
    text = text.replace(/\b(?:fully furnished|full furnished|well furnished)\b/gi, " ");
  } else if (/\b(?:semi furnished|semi-furnished)\b/i.test(text)) {
    filters.furnishing = "Semi-Furnished";
    tags.push("Semi-Furnished");
    text = text.replace(/\b(?:semi furnished|semi-furnished)\b/gi, " ");
  } else if (/\b(?:unfurnished|raw|empty)\b/i.test(text)) {
    filters.furnishing = "Unfurnished";
    tags.push("Unfurnished");
    text = text.replace(/\b(?:unfurnished|raw|empty)\b/gi, " ");
  }

  // 6. Tenant Preference
  if (/\b(?:bachelor|bachelors|singles|boys|girls|students)\b/i.test(text)) {
    filters.preferredTenant = "Bachelors";
    tags.push("Bachelors");
    text = text.replace(/\b(?:bachelor|bachelors|singles|boys|girls|students)\b/gi, " ");
  } else if (/\b(?:family|families)\b/i.test(text)) {
    filters.preferredTenant = "Family";
    tags.push("Family");
    text = text.replace(/\b(?:family|families)\b/gi, " ");
  }

  // 7. Amenities: Parking, Pets & Special Amenities
  if (/\b(?:pet friendly|pet-friendly|pets allowed|dog|cat)\b/i.test(text)) {
    filters.petFriendly = true;
    tags.push("Pet Friendly");
    text = text.replace(/\b(?:pet friendly|pet-friendly|pets allowed|dog|cat)\b/gi, " ");
  }

  if (/\b(?:car parking|covered parking|car park|parking|garage)\b/i.test(text)) {
    filters.parking = true;
    tags.push("Car Parking");
    text = text.replace(/\b(?:car parking|covered parking|car park|parking|garage)\b/gi, " ");
  }

  const detectedAmenities = [];
  for (const [key, standardName] of Object.entries(AMENITY_MAP)) {
    const amenRegex = new RegExp(`\\b${key}\\b`, "i");
    if (amenRegex.test(text)) {
      if (!detectedAmenities.includes(standardName)) {
        detectedAmenities.push(standardName);
        tags.push(standardName);
      }
      text = text.replace(amenRegex, " ");
    }
  }
  if (detectedAmenities.length > 0) {
    filters.amenities = detectedAmenities;
  }

  // 8. Residual Keyword Extraction (Society, Landmark, Project Name)
  const stopWords = new Set([
    "find", "me", "a", "an", "the", "in", "near", "with", "and", "or", "for",
    "i", "want", "need", "looking", "search", "show", "get", "please", "can",
    "you", "around", "at", "having", "with", "like", "good", "best", "cheap",
    "budget", "luxury", "available", "to", "rent", "rental", "properties", "property"
  ]);

  const cleanResidual = text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .join(" ")
    .trim();

  if (cleanResidual) {
    filters.keyword = cleanResidual;
  }

  const summary = tags.length > 0
    ? `Searching for ${tags.join(" • ")}`
    : (cleanResidual ? `Searching for "${cleanResidual}"` : "Showing all available properties.");

  return {
    success: true,
    originalPrompt: prompt,
    filters,
    tags,
    summary
  };
}

/**
 * Main AI semantic query parser entry point.
 * Selects Gemini API -> OpenAI API -> Local Heuristic fallback.
 * @param {string} prompt - Raw conversational query from user.
 * @returns {Promise<object>} Structured filter parameters and UI metadata.
 */
export async function parseAiSearchQuery(prompt) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return {
      success: true,
      originalPrompt: "",
      filters: {},
      tags: [],
      summary: "Showing all available properties.",
      provider: "none"
    };
  }

  const cleanPrompt = prompt.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  // 1. Google Gemini API (if key is set)
  if (geminiKey) {
    try {
      const result = await parseWithGemini(cleanPrompt, geminiKey);
      if (result && result.success) {
        return { ...result, provider: "gemini" };
      }
    } catch (err) {
      console.warn(`[SmartSearch] Gemini parsing failed (${err.message}). Falling back to heuristic parser.`);
    }
  }

  // 2. OpenAI API (if key is set)
  if (openaiKey) {
    try {
      const result = await parseWithOpenAI(cleanPrompt, openaiKey);
      if (result && result.success) {
        return { ...result, provider: "openai" };
      }
    } catch (err) {
      console.warn(`[SmartSearch] OpenAI parsing failed (${err.message}). Falling back to heuristic parser.`);
    }
  }

  // 3. Resilient Local Heuristic Parser Fallback
  const fallback = parseWithLocalHeuristics(cleanPrompt);
  return { ...fallback, provider: "local-heuristic" };
}

