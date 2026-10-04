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
 * Main AI semantic query parser.
 * @param {string} prompt - Raw conversational query from the user.
 * @returns {object} Structured filter params and user-facing explanation.
 */
export function parseAiSearchQuery(prompt) {
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
