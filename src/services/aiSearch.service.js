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
  "k.k. nagar": "KK Nagar",
  kknagar: "KK Nagar"
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

const SYSTEM_INSTRUCTIONS = `You are an expert real estate AI search query parser for "Rentosphere", India's modern zero-brokerage rental housing platform.
Analyze the user's conversational rental query in ANY human language (English, Hindi, Hinglish, Tamil, Tanglish, regional mixtures, informal speech, typos, slang) and return a valid JSON object matching the platform filter schema.

Return ONLY a JSON object with these fields (set field to null or omit if not requested by the user):
{
  "bhkType": "1RK" | "1BHK" | "2BHK" | "3BHK" | "4BHK" | "5BHK+" | null,
  "city": string | null,
  "locality": string | null,
  "minRent": string numeric in INR (e.g. "15000") | null,
  "maxRent": string numeric in INR (e.g. "25000") | null,
  "propertyType": "Apartment" | "Independent House" | "Villa" | "Builder Floor" | "Studio" | "PG/Co-living" | null,
  "furnishing": "Fully Furnished" | "Semi-Furnished" | "Unfurnished" | null,
  "preferredTenant": "Bachelors" | "Family" | "Anyone" | "Company" | null,
  "availability": "Immediate" | "Within 15 Days" | "Within 30 Days" | null,
  "parking": boolean | null,
  "petFriendly": boolean | null,
  "amenities": array of strings from ["Lift", "Power Backup", "Gym", "Swimming Pool", "Gated Security", "Clubhouse", "Park", "Gas Pipeline", "Wi-Fi"],
  "keyword": string (landmark, tech park, society name, or metro station) | null,
  "sortBy": "nearest" | "rent_asc" | "rent_desc" | "newest" | null,
  "tags": array of 2 to 5 short string badges for UI chips (e.g. ["2BHK", "Max ₹25,000", "Velachery", "Pet Friendly"]),
  "summary": string (clean natural language summary of search intent)
}

Important Domain & Linguistic Rules:
1. Multi-Lingual & Hinglish Comprehension:
   - Users may write in Hindi, Hinglish, Tamil, or colloquial mixtures:
     * "velachery me sasta 2bhk chahiye 25 hazar tak" -> locality: "Velachery", bhkType: "2BHK", maxRent: "25000", sortBy: "rent_asc"
     * "bina brokerage wala ghar adyar me" -> locality: "Adyar", propertyType: "Independent House"
     * "omr side pet friendly flat kam rent wala" -> locality: "OMR", petFriendly: true, propertyType: "Apartment", sortBy: "rent_asc"
     * "15 hazar me badhiya 1bhk" -> maxRent: "15000", bhkType: "1BHK"
     * "ghar dhoondh do family ke liye chennai me" -> city: "Chennai", preferredTenant: "Family", propertyType: "Independent House"
2. Typo & Phonetic Correction:
   - Correct misspellings of localities and cities:
     * "velchery", "velacherry" -> "Velachery"
     * "anagar", "annanagar" -> "Anna Nagar"
     * "tnagar", "t nagar", "t.nagar" -> "T. Nagar"
     * "solinganallur", "shollinganallur" -> "Sholinganallur"
     * "poroor" -> "Porur"
     * "bengaluru", "banglore" -> "Bangalore"
     * "madrey" -> "Madurai"
     * "swiming pool" -> "Swimming Pool"
     * "apartmnt", "flat" -> "Apartment"
3. Numbering & Currency Shorthand:
   - "hazar", "hazaar", "k", "grand", "thousand" = 1000 (e.g. "15 hazar" = "15000", "25k" = "25000").
   - "lakh", "lac", "L" = 100000 (e.g. "1.5 lakh" = "150000").
   - Bounds: "under", "below", "less than", "within", "tak", "ke andar", "se kam" -> maxRent.
   - Bounds: "above", "more than", "minimum", "se zyada", "se upar" -> minRent.
   - "between 15k and 25k" / "15 se 25 hazar" -> minRent: "15000", maxRent: "25000".
4. BHK Configurations (STRICTLY NO SPACES IN VALUE):
   - "1rk", "studio" -> "1RK"
   - "1bhk", "ek bhk", "single bedroom" -> "1BHK"
   - "2bhk", "do bhk", "double bedroom" -> "2BHK"
   - "3bhk", "teen bhk" -> "3BHK"
   - "4bhk", "char bhk" -> "4BHK"
   - "5bhk", "5bhk+" -> "5BHK+"
5. Sorting Intent & Budget Phrasing:
   - "sasta", "saste me", "kam rent", "kam kiraya", "cheapest", "lowest rent", "affordable", "budget", "budget friendly", "low price", "low range price", "low range", "low budget", "economical" -> sortBy: "rent_asc"
   - "mehenga", "luxury", "badhiya", "posh", "most expensive", "high end", "premium" -> sortBy: "rent_desc"
   - "aaj ka", "naya", "newest", "latest", "recent" -> sortBy: "newest"
   - Otherwise null.
6. Availability Intent:
   - "immediate", "immediately", "imidiately", "ready to move", "ready to move in", "ready to shift", "asap", "urgently", "turant", "abhi chahiye" -> availability: "Immediate"
   - "within 15 days", "in 15 days", "next 2 weeks", "within two weeks", "15 din me" -> availability: "Within 15 Days"
   - "within 30 days", "within a month", "next month", "1 mahine me" -> availability: "Within 30 Days"
7. Property Type:
   - "house", "makaan", "ghar", "independent house", "individual house", "standalone", "bungalow" -> "Independent House"
   - "flat", "society", "apartment", "condo" -> "Apartment"
   - "villa", "kothi", "bangla" -> "Villa"
   - "builder floor", "floor" -> "Builder Floor"
   - "studio", "studio apartment" -> "Studio"
   - "pg", "paying guest", "co-living", "hostel" -> "PG/Co-living"
8. Preferred Tenant:
   - "bachelor", "ladke", "ladkiya", "students", "boys", "girls" -> "Bachelors"
   - "family", "parivar", "married couple" -> "Family"
   - "company", "corporate" -> "Company"
   - "anyone" -> "Anyone"
9. Amenities, Pets & Parking:
   - "allow pets to stay", "allow pets", "pets allowed", "pet friendly", "pets can stay", "kutta/billi allowed", "dog allowed", "cat allowed" -> petFriendly: true
   - "gadi parking", "car park", "parking", "covered parking", "garage" -> parking: true
   - Only include amenities from allowed list: ["Lift", "Power Backup", "Gym", "Swimming Pool", "Gated Security", "Clubhouse", "Park", "Gas Pipeline", "Wi-Fi"]
10. Cleaner Residual Keyword:
   - Landmarks, tech parks, society names, or metro stations (e.g. "near DLF", "Tidel park", "near metro").
   - DO NOT put conversational filler like "chahiye", "dhoondo", "batao", "sasta", "bhai", "immediate", "pets" into keyword.
11. Do not invent criteria the user did not state.`;

/**
 * Sanitizes and normalizes output from any parser (LLM or heuristic)
 */
function sanitizeParsedFilters(raw, originalPrompt) {
  const filters = {};
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String).filter(Boolean) : [];

  // BHK Type (strictly normalized without spaces e.g. "2BHK")
  if (raw.bhkType) {
    const b = String(raw.bhkType).trim().toUpperCase().replace(/\s+/g, "");
    if (b.includes("1RK") || b.includes("STUDIO")) filters.bhkType = "1RK";
    else if (b.includes("1BHK") || b.includes("1BED")) filters.bhkType = "1BHK";
    else if (b.includes("2BHK") || b.includes("2BED")) filters.bhkType = "2BHK";
    else if (b.includes("3BHK") || b.includes("3BED")) filters.bhkType = "3BHK";
    else if (b.includes("4BHK") || b.includes("4BED")) filters.bhkType = "4BHK";
    else if (b.includes("5BHK") || b.includes("5+")) filters.bhkType = "5BHK+";
  }

  // Sort Preference
  if (raw.sortBy) {
    const s = String(raw.sortBy).trim().toLowerCase();
    if (["rent_asc", "rent_desc", "newest", "nearest"].includes(s)) {
      filters.sortBy = s;
    }
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
    if (pt.includes("villa") || pt.includes("kothi") || pt.includes("bangla")) filters.propertyType = "Villa";
    else if (pt.includes("independent") || pt.includes("house") || pt.includes("makaan") || pt.includes("ghar")) filters.propertyType = "Independent House";
    else if (pt.includes("builder") || pt.includes("floor")) filters.propertyType = "Builder Floor";
    else if (pt.includes("studio")) filters.propertyType = "Studio";
    else if (pt.includes("pg") || pt.includes("paying") || pt.includes("co-living") || pt.includes("coliving") || pt.includes("hostel")) filters.propertyType = "PG/Co-living";
    else if (pt.includes("apartment") || pt.includes("flat") || pt.includes("condo") || pt.includes("society")) filters.propertyType = "Apartment";
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
    else if (t.includes("family") || t.includes("parivar")) filters.preferredTenant = "Family";
    else if (t.includes("company") || t.includes("corp")) filters.preferredTenant = "Company";
    else if (t.includes("anyone") || t.includes("any")) filters.preferredTenant = "Anyone";
  }

  // Availability
  if (raw.availability) {
    const av = String(raw.availability).trim().toLowerCase();
    if (
      av.includes("immed") ||
      av.includes("imid") ||
      av.includes("ready") ||
      av.includes("asap") ||
      av.includes("turant") ||
      av.includes("now")
    ) {
      filters.availability = "Immediate";
    } else if (av.includes("15")) {
      filters.availability = "Within 15 Days";
    } else if (av.includes("30") || av.includes("month")) {
      filters.availability = "Within 30 Days";
    }
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
    if (filters.propertyType) tags.push(filters.propertyType);
    if (filters.minRent && filters.maxRent) {
      tags.push(`₹${Number(filters.minRent).toLocaleString("en-IN")} – ₹${Number(filters.maxRent).toLocaleString("en-IN")}`);
    } else if (filters.maxRent) {
      tags.push(`Max ₹${Number(filters.maxRent).toLocaleString("en-IN")}`);
    } else if (filters.minRent) {
      tags.push(`Min ₹${Number(filters.minRent).toLocaleString("en-IN")}`);
    }
    if (filters.availability) tags.push(filters.availability === "Immediate" ? "Immediate Move-in" : filters.availability);
    if (filters.furnishing) tags.push(filters.furnishing);
    if (filters.preferredTenant) tags.push(`For ${filters.preferredTenant}`);
    if (filters.parking) tags.push("Car Parking");
    if (filters.petFriendly) tags.push("Pet Friendly");
    if (filters.sortBy === "rent_asc") tags.push("Lowest Price");
    if (filters.sortBy === "rent_desc") tags.push("Premium");
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
 * Call Google Gemini API with structured JSON output and automatic model failover
 */
async function parseWithGemini(prompt, apiKey) {
  const candidateModels = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL]
    : ["gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.1-flash-lite"];

  let lastError = null;
  for (const model of candidateModels) {
    try {
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
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}) on ${model}: ${errorText.slice(0, 150)}`);
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error(`Empty response from Gemini model ${model}`);
      }

      const parsedJson = JSON.parse(rawText);
      return sanitizeParsedFilters(parsedJson, prompt);
    } catch (err) {
      lastError = err;
      // Try next candidate model if 503/404
      continue;
    }
  }

  throw lastError || new Error("All Gemini models failed");
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
/**
 * Parses numeric currency strings with k/lakh/thousand/hazar suffixes into integer rupees.
 */
function parseCurrencyString(rawStr) {
  if (!rawStr) return null;
  const cleaned = rawStr
    .toLowerCase()
    .replace(/(?:₹|inr|rs\.?)/gi, "")
    .replace(/[,\s]/g, "");

  if (cleaned.endsWith("k") || cleaned.endsWith("grand")) {
    const num = parseFloat(cleaned.replace(/(k|grand)/, ""));
    return isNaN(num) ? null : Math.round(num * 1000);
  }
  if (
    cleaned.endsWith("hazar") ||
    cleaned.endsWith("hazaar") ||
    cleaned.endsWith("haz") ||
    cleaned.endsWith("thousand") ||
    cleaned.endsWith("thou")
  ) {
    const num = parseFloat(cleaned.replace(/(hazaar|hazar|haz|thousand|thou)/, ""));
    return isNaN(num) ? null : Math.round(num * 1000);
  }
  if (
    cleaned.endsWith("l") ||
    cleaned.endsWith("lac") ||
    cleaned.endsWith("lakh") ||
    cleaned.endsWith("lakhs")
  ) {
    const num = parseFloat(cleaned.replace(/(lakhs|lakh|lac|l)/, ""));
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

  // 1. BHK Type Extraction (English + Hindi / Hinglish)
  const bhkMatch =
    text.match(/\b([1-5])\s*(?:\+|\s*plus)?\s*(?:bhk|bedroom|bed|b\.h\.k|kamra)\b/i) ||
    text.match(/\b(ek|do|teen|char|paanch)\s*(?:bhk|bedroom|bed|kamra)\b/i) ||
    text.match(/\b(1\s*rk|studio)\b/i);
  if (bhkMatch) {
    const val = bhkMatch[1].toLowerCase();
    if (val.includes("rk") || val.includes("studio")) {
      filters.bhkType = "1RK";
      tags.push("1RK");
    } else {
      const hindiMap = { ek: 1, do: 2, teen: 3, char: 4, paanch: 5 };
      const num = hindiMap[val] || parseInt(val, 10);
      filters.bhkType = num >= 5 ? "5BHK+" : `${num}BHK`;
      tags.push(filters.bhkType);
    }
    text = text.replace(bhkMatch[0], " ");
  }

  // 2. Budget / Rent Extraction (English + Hindi / Hinglish)
  // Range: "between 15k and 25k", "15000 to 25000", "15k - 25k", "15 hazar se 25 hazar tak"
  const rangeMatch = text.match(
    /(?:between|from|se)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand)?)\s*(?:-|to|and|se|tak)\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand)?)/i
  );
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

  // Max Rent: "under 25k", "below 30000", "upto 20k", "25 hazar tak", "20k ke andar", "se kam"
  if (!filters.maxRent) {
    const maxMatch =
      text.match(
        /([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand))\s*(?:tak|ke andar|se kam|me|mein)/i
      ) ||
      text.match(
        /(?:under|below|less than|max|upto|up to|within|budget of|<|<=|tak|ke andar|se kam)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand)?)/i
      );
    if (maxMatch) {
      const maxVal = parseCurrencyString(maxMatch[1]);
      if (maxVal) {
        filters.maxRent = String(maxVal);
        tags.push(`Max ₹${maxVal.toLocaleString("en-IN")}`);
        text = text.replace(maxMatch[0], " ");
      }
    }
  }

  // Min Rent: "above 15k", "min 10000", "15 hazar se zyada", "15k se upar"
  if (!filters.minRent) {
    const minMatch =
      text.match(
        /(?:above|more than|min|starting from|minimum|>|>=|se zyada|se upar)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand)?)/i
      ) ||
      text.match(
        /([0-9]+(?:\.[0-9]+)?\s*(?:k|l|lac|lakh|hazar|hazaar|thousand|grand))\s*(?:se zyada|se upar)/i
      );
    if (minMatch) {
      const minVal = parseCurrencyString(minMatch[1]);
      if (minVal) {
        filters.minRent = String(minVal);
        tags.push(`Min ₹${minVal.toLocaleString("en-IN")}`);
        text = text.replace(minMatch[0], " ");
      }
    }
  }

  // 3. Location & Locality Extraction (with Typo / Phonetic normalization)
  let matchedCity = null;
  for (const [typo, standardCity] of Object.entries(CITY_TYPO_MAP)) {
    const cityRegex = new RegExp(`\\b${typo}\\b`, "i");
    if (cityRegex.test(text)) {
      matchedCity = standardCity;
      filters.city = matchedCity;
      tags.push(matchedCity);
      text = text.replace(cityRegex, " ");
      break;
    }
  }

  let matchedLocality = null;
  for (const [typo, standardLocality] of Object.entries(LOCALITY_TYPO_MAP)) {
    const locRegex = new RegExp(`\\b${typo}\\b`, "i");
    if (locRegex.test(text)) {
      matchedLocality = standardLocality;
      filters.locality = matchedLocality;
      tags.push(matchedLocality);
      text = text.replace(locRegex, " ");
      break;
    }
  }

  // Catch generic "in <Word>" or "near <Word>" or "<Word> me" if neither city nor locality matched
  if (!matchedCity && !matchedLocality) {
    const locContextMatch =
      text.match(/\b(?:in|near|around|at)\s+([a-zA-Z\s]{3,20})(?:$|\s+(?:under|with|for|bhk|below|having|me|tak))/i) ||
      text.match(/([a-zA-Z\s]{3,20})\s+(?:me|mein|side|ke paas)/i);
    if (locContextMatch && locContextMatch[1]) {
      const extractedLoc = locContextMatch[1].trim();
      const skipWords = [
        "the", "a", "an", "any", "good", "nice", "flat", "apartment", "house",
        "ghar", "makaan", "sasta", "kam", "badhiya", "chennai", "bangalore"
      ];
      if (!skipWords.includes(extractedLoc.toLowerCase())) {
        filters.locality = extractedLoc
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        tags.push(filters.locality);
        text = text.replace(locContextMatch[0], " ");
      }
    }
  }

  // 3.5. Availability Intent Extraction (Immediate, 15 Days, 30 Days)
  if (
    /\b(?:immediate|immediately|imidiately|immedate|immediatly|ready to move|ready to move in|ready to shift|asap|turant|ready possession|abhi chahiye)\b/i.test(
      text
    )
  ) {
    filters.availability = "Immediate";
    tags.push("Immediate Move-in");
    text = text.replace(
      /\b(?:immediate|immediately|imidiately|immedate|immediatly|ready to move|ready to move in|ready to shift|asap|turant|ready possession|abhi chahiye)\b/gi,
      " "
    );
  } else if (/\b(?:within 15 days|15 days|in 15 days|next 2 weeks|within two weeks|15 din)\b/i.test(text)) {
    filters.availability = "Within 15 Days";
    tags.push("Within 15 Days");
    text = text.replace(/\b(?:within 15 days|15 days|in 15 days|next 2 weeks|within two weeks|15 din)\b/gi, " ");
  } else if (/\b(?:within 30 days|30 days|within a month|within 1 month|next month|1 mahine)\b/i.test(text)) {
    filters.availability = "Within 30 Days";
    tags.push("Within 30 Days");
    text = text.replace(/\b(?:within 30 days|30 days|within a month|within 1 month|next month|1 mahine)\b/gi, " ");
  }

  // 4. Property Type (English + Hinglish)
  if (/\b(?:apartment|flat|flats|condo|society)\b/i.test(text)) {
    filters.propertyType = "Apartment";
    tags.push("Apartment");
    text = text.replace(/\b(?:apartment|flat|flats|condo|society)\b/gi, " ");
  } else if (/\b(?:villa|villas|bungalow|kothi|bangla)\b/i.test(text)) {
    filters.propertyType = "Villa";
    tags.push("Villa");
    text = text.replace(/\b(?:villa|villas|bungalow|kothi|bangla)\b/gi, " ");
  } else if (/\b(?:independent house|individual house|house|standalone|makaan|ghar)\b/i.test(text)) {
    filters.propertyType = "Independent House";
    tags.push("Independent House");
    text = text.replace(/\b(?:independent house|individual house|house|standalone|makaan|ghar)\b/gi, " ");
  } else if (/\b(?:builder floor|floor)\b/i.test(text)) {
    filters.propertyType = "Builder Floor";
    tags.push("Builder Floor");
    text = text.replace(/\b(?:builder floor|floor)\b/gi, " ");
  } else if (/\b(?:studio|studio apartment)\b/i.test(text)) {
    filters.propertyType = "Studio";
    tags.push("Studio");
    text = text.replace(/\b(?:studio|studio apartment)\b/gi, " ");
  } else if (/\b(?:pg|paying guest|co-living|coliving|hostel)\b/i.test(text)) {
    filters.propertyType = "PG/Co-living";
    tags.push("PG/Co-living");
    text = text.replace(/\b(?:pg|paying guest|co-living|coliving|hostel)\b/gi, " ");
  }

  // 5. Furnishing Status (English + Hinglish)
  if (/\b(?:fully furnished|full furnished|well furnished|saman ke sath)\b/i.test(text)) {
    filters.furnishing = "Fully Furnished";
    tags.push("Fully Furnished");
    text = text.replace(/\b(?:fully furnished|full furnished|well furnished|saman ke sath)\b/gi, " ");
  } else if (/\b(?:semi furnished|semi-furnished|adhe saman)\b/i.test(text)) {
    filters.furnishing = "Semi-Furnished";
    tags.push("Semi-Furnished");
    text = text.replace(/\b(?:semi furnished|semi-furnished|adhe saman)\b/gi, " ");
  } else if (/\b(?:unfurnished|raw|empty|khali flat|bina saman)\b/i.test(text)) {
    filters.furnishing = "Unfurnished";
    tags.push("Unfurnished");
    text = text.replace(/\b(?:unfurnished|raw|empty|khali flat|bina saman)\b/gi, " ");
  }

  // 6. Tenant Preference (English + Hinglish)
  if (/\b(?:bachelor|bachelors|singles|boys|girls|students|ladke|ladkiya)\b/i.test(text)) {
    filters.preferredTenant = "Bachelors";
    tags.push("Bachelors");
    text = text.replace(/\b(?:bachelor|bachelors|singles|boys|girls|students|ladke|ladkiya)\b/gi, " ");
  } else if (/\b(?:family|families|parivar|family only)\b/i.test(text)) {
    filters.preferredTenant = "Family";
    tags.push("Family");
    text = text.replace(/\b(?:family|families|parivar|family only)\b/gi, " ");
  }

  // 7. Amenities: Parking, Pets & Special Amenities (English + Hinglish)
  if (
    /\b(?:allow pets to stay|allow pets|pets to stay|pets can stay|pet friendly|pet-friendly|pets allowed|dog|cat|kutta|billi|pet|pets)\b/i.test(
      text
    )
  ) {
    filters.petFriendly = true;
    tags.push("Pet Friendly");
    text = text.replace(
      /\b(?:allow pets to stay|allow pets|pets to stay|pets can stay|pet friendly|pet-friendly|pets allowed|dog|cat|kutta|billi|pet|pets)\b/gi,
      " "
    );
  }

  if (/\b(?:car parking|covered parking|car park|parking|garage|gadi parking)\b/i.test(text)) {
    filters.parking = true;
    tags.push("Car Parking");
    text = text.replace(/\b(?:car parking|covered parking|car park|parking|garage|gadi parking)\b/gi, " ");
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

  // 8. Sorting Intent Extraction (English + Hinglish)
  if (
    /\b(?:sasta|saste|kam rent|kam kiraya|kam paise|cheapest|cheap|lowest rent|low price|affordable|low to high|budget friendly|low range price|low range|low budget|lowest price|budget price|economical)\b/i.test(
      text
    )
  ) {
    filters.sortBy = "rent_asc";
    tags.push("Lowest Price");
    text = text.replace(
      /\b(?:sasta|saste|kam rent|kam kiraya|kam paise|cheapest|cheap|lowest rent|low price|affordable|low to high|budget friendly|low range price|low range|low budget|lowest price|budget price|economical)\b/gi,
      " "
    );
  } else if (
    /\b(?:mehenga|luxury|badhiya|premium|posh|most expensive|high end|high to low)\b/i.test(
      text
    )
  ) {
    filters.sortBy = "rent_desc";
    tags.push("Premium");
    text = text.replace(
      /\b(?:mehenga|luxury|badhiya|premium|posh|most expensive|high end|high to low)\b/gi,
      " "
    );
  } else if (
    /\b(?:aaj ka|naya|newest|newly added|recent|latest|fresh)\b/i.test(text)
  ) {
    filters.sortBy = "newest";
    tags.push("Newest First");
    text = text.replace(/\b(?:aaj ka|naya|newest|newly added|recent|latest|fresh)\b/gi, " ");
  }

  // 9. Residual Keyword Extraction (Society, Landmark, Project Name)
  const stopWords = new Set([
    "find", "me", "a", "an", "the", "in", "near", "with", "and", "or", "for",
    "i", "want", "need", "looking", "search", "show", "get", "please", "can",
    "you", "around", "at", "having", "with", "like", "good", "best", "cheap",
    "budget", "luxury", "available", "to", "rent", "rental", "properties", "property",
    "immediate", "immediately", "imidiately", "allow", "stay", "low", "range", "price",
    // Hindi / Hinglish / Vernacular
    "chahiye", "dhoondo", "dhoondh", "bhai", "yaar", "wala", "wali", "wale", "karo", "dikhao",
    "batao", "hai", "kya", "me", "mein", "pe", "par", "se", "ke", "ki", "ko", "la", "ku",
    "venum", "iruka", "maari", "panra", "acha", "achha", "badhiya", "sasta", "saste", "kam",
    "kiraya", "ghar", "makaan", "room", "kamra", "flat", "paas", "side", "bina", "brokerage"
  ]);

  const cleanResidual = text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .join(" ")
    .trim();

  if (cleanResidual) {
    filters.keyword = cleanResidual;
  }

  const summary =
    tags.length > 0
      ? `Searching for ${tags.join(" • ")}`
      : cleanResidual
      ? `Searching for "${cleanResidual}"`
      : "Showing all available properties.";

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

