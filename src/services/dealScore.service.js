/**
 * Deal Score & Market Value Rating Service
 * Compares listing rents against hedonic market benchmarks to detect high-value deals.
 */

// City-level baseline monthly rent for a standard 2 BHK Semi-Furnished apartment
const CITY_BASELINES = {
  chennai: 26000,
  coimbatore: 18000,
  madurai: 14000,
  kanchipuram: 13000,
  salem: 12500,
  tiruchirappalli: 13500,
  tirunelveli: 11000,
  vellore: 13000,
  erode: 12000,
  bangalore: 32000,
  hyderabad: 24000,
  mumbai: 48000,
  pune: 25000,
  delhi: 28000
};

// Premium localities that command higher rent multipliers
const LOCALITY_MULTIPLIERS = {
  "t. nagar": 1.45,
  "t nagar": 1.45,
  "adyar": 1.40,
  "alwarpet": 1.55,
  "anna nagar": 1.35,
  "besant nagar": 1.45,
  "nungambakkam": 1.45,
  "mylapore": 1.30,
  "velachery": 1.15,
  "omr": 1.10,
  "sholinganallur": 1.05,
  "thoraipakkam": 1.10,
  "guindy": 1.25,
  "porur": 1.05,
  "koramangala": 1.50,
  "indiranagar": 1.55,
  "whitefield": 1.20,
  "hsr layout": 1.35,
  "rs puram": 1.30,
  "gandhipuram": 1.15,
  "peelamedu": 1.10
};

// BHK ordinal multipliers relative to 2 BHK (1.0)
const BHK_MULTIPLIERS = {
  "1 RK": 0.55,
  "1RK": 0.55,
  "1 BHK": 0.70,
  "1BHK": 0.70,
  "2 BHK": 1.00,
  "2BHK": 1.00,
  "3 BHK": 1.45,
  "3BHK": 1.45,
  "4 BHK": 1.95,
  "4BHK": 1.95,
  "4+ BHK": 2.20,
  "4+BHK": 2.20
};

/**
 * Calculates estimated market benchmark rent for a given property.
 */
export function estimateMarketBenchmark(property) {
  if (!property) return 20000;

  // 1. Resolve city
  const city = (property.locality?.city || "").toLowerCase().trim();
  let baseRent = CITY_BASELINES[city] || 20000;

  // 2. Locality multiplier
  const locText = (property.locality?.label || property.locality?.text || "").toLowerCase();
  for (const [loc, mult] of Object.entries(LOCALITY_MULTIPLIERS)) {
    if (locText.includes(loc)) {
      baseRent = Math.round(baseRent * mult);
      break;
    }
  }

  // 3. BHK Multiplier
  const bhk = (property.BHKType || property.bhkType || "2 BHK").toUpperCase().replace(/\s+/g, "");
  const bhkKey = bhk.includes("RK") ? "1RK" : bhk;
  const bhkMultiplier = BHK_MULTIPLIERS[bhkKey] || 1.0;
  let estimated = baseRent * bhkMultiplier;

  // 4. Furnishing adjustment
  const furn = (property.Furnishing || property.furnishing || "").toLowerCase();
  if (furn.includes("fully")) {
    estimated *= 1.15; // +15%
  } else if (furn.includes("unfurn")) {
    estimated *= 0.90; // -10%
  }

  // 5. Property type adjustment
  const pType = (property.propertyType || "").toLowerCase();
  if (pType.includes("villa")) {
    estimated *= 1.35;
  } else if (pType.includes("independent") || pType.includes("house")) {
    estimated *= 1.10;
  }

  // 6. Amenities premium (parking, power backup, lift, gym)
  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  if (property.Parking || property.parking || amenities.some(a => /parking/i.test(a))) {
    estimated += 1000;
  }
  if (amenities.some(a => /power backup/i.test(a))) {
    estimated += 1000;
  }
  if (amenities.some(a => /gym|pool|club/i.test(a))) {
    estimated += 1500;
  }

  // Round to nearest 500
  return Math.round(estimated / 500) * 500;
}

/**
 * Calculates Deal Score for a single property.
 * @param {object} property
 * @returns {object} Deal metadata
 */
export function calculateDealScore(property) {
  const actualRent = Number(property.rent) || 0;
  if (actualRent <= 0) {
    return {
      dealType: "Fair Price",
      label: "Fair Market Price",
      discountPercent: 0,
      marketRent: actualRent,
      color: "blue",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      savingsAmount: 0,
      summary: "Priced at standard rate"
    };
  }

  const marketRent = estimateMarketBenchmark(property);
  const diffPercent = ((marketRent - actualRent) / marketRent) * 100;
  const savings = Math.max(0, marketRent - actualRent);

  if (diffPercent >= 8) {
    const roundedDiscount = Math.min(45, Math.round(diffPercent));
    return {
      dealType: "Great Deal",
      label: `${roundedDiscount}% Below Market`,
      discountPercent: roundedDiscount,
      marketRent,
      color: "emerald",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold",
      savingsAmount: savings,
      summary: `Save ~₹${savings.toLocaleString("en-IN")}/mo vs local market average (₹${marketRent.toLocaleString("en-IN")}/mo)`
    };
  }

  if (diffPercent <= -10) {
    const premiumPercent = Math.round(Math.abs(diffPercent));
    return {
      dealType: "Premium",
      label: "Premium Spec",
      discountPercent: -premiumPercent,
      marketRent,
      color: "amber",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-300 font-semibold",
      savingsAmount: 0,
      summary: `High-spec property priced above local baseline (₹${marketRent.toLocaleString("en-IN")}/mo)`
    };
  }

  return {
    dealType: "Fair Price",
    label: "Fair Market Price",
    discountPercent: 0,
    marketRent,
    color: "blue",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 font-medium",
    savingsAmount: 0,
    summary: `Priced in line with local market average (₹${marketRent.toLocaleString("en-IN")}/mo)`
  };
}

/**
 * Attaches deal scores to an array of properties in-place.
 */
export function attachDealScores(properties = []) {
  return properties.map(p => {
    // If Mongoose lean or doc object
    const plain = typeof p.toObject === "function" ? p.toObject() : { ...p };
    plain.deal = calculateDealScore(plain);
    return plain;
  });
}
