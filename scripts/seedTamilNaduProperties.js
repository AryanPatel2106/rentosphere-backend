import mongoose from "mongoose";
import dotenv from "dotenv";
import { Property } from "../src/models/property.model.js";
import { User } from "../src/models/user.model.js";

dotenv.config();

const TN_LOCALITIES = [
  // --- CHENNAI & OMR IT CORRIDOR ---
  { city: "Chennai", locality: "Adyar", lat: 13.0012, lng: 80.2565, tier: "core" },
  { city: "Chennai", locality: "Besant Nagar", lat: 13.0001, lng: 80.2667, tier: "core" },
  { city: "Chennai", locality: "Thiruvanmiyur", lat: 12.9830, lng: 80.2594, tier: "core" },
  { city: "Chennai", locality: "Kotturpuram", lat: 13.0166, lng: 80.2415, tier: "core" },
  { city: "Chennai", locality: "Alwarpet", lat: 13.0337, lng: 80.2505, tier: "core" },
  { city: "Chennai", locality: "Mylapore", lat: 13.0368, lng: 80.2676, tier: "core" },
  { city: "Chennai", locality: "T Nagar", lat: 13.0418, lng: 80.2341, tier: "core" },
  { city: "Chennai", locality: "Nungambakkam", lat: 13.0569, lng: 80.2425, tier: "core" },
  { city: "Chennai", locality: "Anna Nagar", lat: 13.0850, lng: 80.2101, tier: "core" },
  { city: "Chennai", locality: "Kilpauk", lat: 13.0784, lng: 80.2412, tier: "core" },
  { city: "Chennai", locality: "Velachery", lat: 12.9815, lng: 80.2180, tier: "mid" },
  { city: "Chennai", locality: "Perungudi", lat: 12.9654, lng: 80.2461, tier: "mid" },
  { city: "Chennai", locality: "OMR Thoraipakkam", lat: 12.9416, lng: 80.2362, tier: "mid" },
  { city: "Chennai", locality: "Sholinganallur", lat: 12.9010, lng: 80.2279, tier: "mid" },
  { city: "Chennai", locality: "Navalur", lat: 12.8459, lng: 80.2265, tier: "suburban" },
  { city: "Chennai", locality: "Siruseri (SIPCOT IT Park)", lat: 12.8274, lng: 80.2195, tier: "suburban" },
  { city: "Chennai", locality: "Kelambakkam (Near VIT)", lat: 12.7873, lng: 80.2201, tier: "suburban" },
  { city: "Chennai", locality: "Melakottaiyur (VIT Chennai)", lat: 12.8406, lng: 80.1534, tier: "suburban" },
  { city: "Chennai", locality: "Vandalur", lat: 12.8913, lng: 80.0812, tier: "suburban" },
  { city: "Chennai", locality: "Guduvanchery", lat: 12.8443, lng: 80.0617, tier: "suburban" },
  { city: "Chennai", locality: "Tambaram West", lat: 12.9249, lng: 80.1000, tier: "suburban" },
  { city: "Chennai", locality: "Tambaram East", lat: 12.9229, lng: 80.1275, tier: "suburban" },
  { city: "Chennai", locality: "Chromepet", lat: 12.9516, lng: 80.1462, tier: "suburban" },
  { city: "Chennai", locality: "Pallavaram", lat: 12.9675, lng: 80.1491, tier: "suburban" },
  { city: "Chennai", locality: "Medavakkam", lat: 12.9171, lng: 80.1923, tier: "suburban" },
  { city: "Chennai", locality: "Madipakkam", lat: 12.9647, lng: 80.1961, tier: "mid" },
  { city: "Chennai", locality: "Porur", lat: 13.0382, lng: 80.1565, tier: "mid" },
  { city: "Chennai", locality: "Manapakkam (DLF IT Park)", lat: 13.0210, lng: 80.1804, tier: "mid" },
  { city: "Chennai", locality: "Mogappair", lat: 13.0837, lng: 80.1747, tier: "mid" },
  { city: "Chennai", locality: "Poonamallee", lat: 13.0489, lng: 80.0937, tier: "suburban" },
  { city: "Chennai", locality: "Guindy", lat: 13.0067, lng: 80.2025, tier: "core" },

  // --- COIMBATORE ---
  { city: "Coimbatore", locality: "RS Puram", lat: 11.0089, lng: 76.9507, tier: "core" },
  { city: "Coimbatore", locality: "Race Course", lat: 11.0016, lng: 76.9734, tier: "core" },
  { city: "Coimbatore", locality: "Gandhipuram", lat: 11.0168, lng: 76.9674, tier: "core" },
  { city: "Coimbatore", locality: "Peelamedu (TIDEL Park)", lat: 11.0267, lng: 77.0142, tier: "mid" },
  { city: "Coimbatore", locality: "Saravanampatti (IT Hub)", lat: 11.0797, lng: 76.9997, tier: "mid" },
  { city: "Coimbatore", locality: "Saibaba Colony", lat: 11.0264, lng: 76.9452, tier: "core" },
  { city: "Coimbatore", locality: "Vadavalli", lat: 11.0289, lng: 76.9038, tier: "suburban" },
  { city: "Coimbatore", locality: "Ramanathapuram", lat: 10.9935, lng: 76.9942, tier: "mid" },
  { city: "Coimbatore", locality: "Singanallur", lat: 10.9984, lng: 77.0253, tier: "mid" },
  { city: "Coimbatore", locality: "Kovaipudur", lat: 10.9325, lng: 76.9381, tier: "suburban" },
  { city: "Coimbatore", locality: "Kalapatti", lat: 11.0747, lng: 77.0353, tier: "mid" },

  // --- MADURAI ---
  { city: "Madurai", locality: "KK Nagar", lat: 9.9252, lng: 78.1477, tier: "core" },
  { city: "Madurai", locality: "Anna Nagar", lat: 9.9192, lng: 78.1534, tier: "core" },
  { city: "Madurai", locality: "Mattuthavani", lat: 9.9406, lng: 78.1568, tier: "mid" },
  { city: "Madurai", locality: "TVS Nagar", lat: 9.9017, lng: 78.0987, tier: "mid" },
  { city: "Madurai", locality: "Iyer Bungalow", lat: 9.9678, lng: 78.1402, tier: "suburban" },
  { city: "Madurai", locality: "Othakadai", lat: 9.9575, lng: 78.1964, tier: "suburban" },

  // --- TIRUCHIRAPPALLI (TRICHY) ---
  { city: "Tiruchirappalli", locality: "Thillai Nagar", lat: 10.8286, lng: 78.6874, tier: "core" },
  { city: "Tiruchirappalli", locality: "Cantonment", lat: 10.8050, lng: 78.6856, tier: "core" },
  { city: "Tiruchirappalli", locality: "KK Nagar", lat: 10.7780, lng: 78.7077, tier: "mid" },
  { city: "Tiruchirappalli", locality: "Srirangam", lat: 10.8624, lng: 78.6946, tier: "mid" },
  { city: "Tiruchirappalli", locality: "Vayalur Road", lat: 10.8145, lng: 78.6548, tier: "suburban" },

  // --- SALEM ---
  { city: "Salem", locality: "Fairlands", lat: 11.6775, lng: 78.1444, tier: "core" },
  { city: "Salem", locality: "Hasthampatti", lat: 11.6738, lng: 78.1628, tier: "core" },
  { city: "Salem", locality: "Alagapuram", lat: 11.6845, lng: 78.1362, tier: "mid" },
  { city: "Salem", locality: "Meyyanur", lat: 11.6702, lng: 78.1287, tier: "mid" },

  // --- VELLORE (VIT & CMC REGION) ---
  { city: "Vellore", locality: "Katpadi (Near VIT Campus)", lat: 12.9698, lng: 79.1559, tier: "mid" },
  { city: "Vellore", locality: "Gandhi Nagar", lat: 12.9554, lng: 79.1412, tier: "core" },
  { city: "Vellore", locality: "Sathuvachari", lat: 12.9358, lng: 79.1678, tier: "mid" },
  { city: "Vellore", locality: "Bagayam (Near CMC)", lat: 12.8752, lng: 79.1352, tier: "suburban" },

  // --- TIRUPPUR ---
  { city: "Tiruppur", locality: "Avinashi Road", lat: 11.1186, lng: 77.3411, tier: "core" },
  { city: "Tiruppur", locality: "Rayapuram", lat: 11.1075, lng: 77.3556, tier: "mid" },
  { city: "Tiruppur", locality: "Kumar Nagar", lat: 11.1294, lng: 77.3524, tier: "mid" },

  // --- ERODE ---
  { city: "Erode", locality: "Perundurai Road", lat: 11.3410, lng: 77.7172, tier: "core" },
  { city: "Erode", locality: "Thindal", lat: 11.3214, lng: 77.6789, tier: "mid" },

  // --- HOSUR (INDUSTRIAL & TECH CORRIDOR) ---
  { city: "Hosur", locality: "SIPCOT Phase 1", lat: 12.7489, lng: 77.8201, tier: "mid" },
  { city: "Hosur", locality: "Bagalur Road", lat: 12.7405, lng: 77.8423, tier: "mid" },
  { city: "Hosur", locality: "Rayakottai Road", lat: 12.7225, lng: 77.8315, tier: "suburban" },

  // --- TIRUNELVELI ---
  { city: "Tirunelveli", locality: "Palayamkottai", lat: 8.7139, lng: 77.7441, tier: "core" },
  { city: "Tirunelveli", locality: "Perumalpuram", lat: 8.7056, lng: 77.7214, tier: "mid" },

  // --- CHENGALPATTU & KANCHIPURAM ---
  { city: "Chengalpattu", locality: "Maraimalai Nagar", lat: 12.7958, lng: 80.0242, tier: "suburban" },
  { city: "Chengalpattu", locality: "Mahindra World City", lat: 12.7381, lng: 80.0051, tier: "suburban" },
  { city: "Kanchipuram", locality: "Collectorate Area", lat: 12.8342, lng: 79.7036, tier: "suburban" },
  { city: "Kanchipuram", locality: "Sriperumbudur Hub", lat: 12.9691, lng: 79.9482, tier: "suburban" }
];

const PHOTO_SETS = [
  [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1502005229762-ee1b2b90e0e1?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop&q=80"
  ]
];

const ALL_AMENITIES = [
  "24/7 Security",
  "Power Backup",
  "Covered Car Parking",
  "Automatic Lift",
  "Equipped Gym",
  "Swimming Pool",
  "Clubhouse",
  "Children's Play Area",
  "Gated Society",
  "Piped Gas Connection",
  "Intercom Facility",
  "Jogging Track",
  "Wi-Fi Connectivity",
  "Rainwater Harvesting",
  "24/7 CCTV Surveillance",
  "Visitor Parking",
  "Badminton Court",
  "Fire Fighting System",
  "RO Water Plant",
  "Solar Water Heater"
];

const TN_OWNERS = [
  { fullName: "Aryan Patel", email: "aryanpatel8082@gmail.com", mobileNumber: "+91 98765 43210" },
  { fullName: "Karthik Subramanian", email: "karthik.subramanian@rentosphere.in", mobileNumber: "+91 98401 23456" },
  { fullName: "Suresh Sundaram", email: "suresh.sundaram@rentosphere.in", mobileNumber: "+91 98412 34567" },
  { fullName: "Lakshmi Narayanan", email: "lakshmi.narayanan@rentosphere.in", mobileNumber: "+91 98423 45678" },
  { fullName: "Balaji Venkatesh", email: "balaji.venkatesh@rentosphere.in", mobileNumber: "+91 98434 56789" },
  { fullName: "Meenakshi Ramachandran", email: "meenakshi.r@rentosphere.in", mobileNumber: "+91 98445 67890" },
  { fullName: "Anand Krishnan", email: "anand.krishnan@rentosphere.in", mobileNumber: "+91 98456 78901" },
  { fullName: "Vignesh Rajan", email: "vignesh.rajan@rentosphere.in", mobileNumber: "+91 98467 89012" },
  { fullName: "Deepa Natarajan", email: "deepa.natarajan@rentosphere.in", mobileNumber: "+91 98478 90123" },
  { fullName: "Ganesh Moorthy", email: "ganesh.moorthy@rentosphere.in", mobileNumber: "+91 98489 01234" },
  { fullName: "Sangeetha Sridhar", email: "sangeetha.sridhar@rentosphere.in", mobileNumber: "+91 98490 12345" },
  { fullName: "Arun Kumar Pandian", email: "arunkumar.p@rentosphere.in", mobileNumber: "+91 98401 98765" },
  { fullName: "Divya Chandrasekaran", email: "divya.chandra@rentosphere.in", mobileNumber: "+91 98412 87654" },
  { fullName: "Saravanan Murugan", email: "saravanan.m@rentosphere.in", mobileNumber: "+91 98423 76543" },
  { fullName: "Revathi Parthasarathy", email: "revathi.p@rentosphere.in", mobileNumber: "+91 98434 65432" }
];

const PROPERTY_CONFIGS = {
  core: [
    { bhk: "1BHK", type: "Apartment", minRent: 19000, maxRent: 28000, minArea: 550, maxArea: 750, baths: 1, balconies: 1 },
    { bhk: "2BHK", type: "Apartment", minRent: 32000, maxRent: 52000, minArea: 950, maxArea: 1350, baths: 2, balconies: 2 },
    { bhk: "3BHK", type: "Apartment", minRent: 52000, maxRent: 95000, minArea: 1550, maxArea: 2200, baths: 3, balconies: 3 },
    { bhk: "4BHK", type: "Villa", minRent: 95000, maxRent: 180000, minArea: 2500, maxArea: 3800, baths: 4, balconies: 3 }
  ],
  mid: [
    { bhk: "1RK", type: "Studio", minRent: 11000, maxRent: 17000, minArea: 350, maxArea: 480, baths: 1, balconies: 1 },
    { bhk: "1BHK", type: "Apartment", minRent: 15000, maxRent: 23000, minArea: 550, maxArea: 750, baths: 1, balconies: 1 },
    { bhk: "2BHK", type: "Apartment", minRent: 22000, maxRent: 38000, minArea: 950, maxArea: 1300, baths: 2, balconies: 2 },
    { bhk: "3BHK", type: "Apartment", minRent: 36000, maxRent: 60000, minArea: 1400, maxArea: 1950, baths: 3, balconies: 3 },
    { bhk: "4BHK", type: "Builder Floor", minRent: 60000, maxRent: 98000, minArea: 2200, maxArea: 3200, baths: 4, balconies: 3 }
  ],
  suburban: [
    { bhk: "1RK", type: "Studio", minRent: 8500, maxRent: 13500, minArea: 320, maxArea: 450, baths: 1, balconies: 1 },
    { bhk: "1BHK", type: "Apartment", minRent: 11000, maxRent: 17000, minArea: 500, maxArea: 700, baths: 1, balconies: 1 },
    { bhk: "2BHK", type: "Apartment", minRent: 16000, maxRent: 26000, minArea: 850, maxArea: 1200, baths: 2, balconies: 2 },
    { bhk: "3BHK", type: "Apartment", minRent: 24000, maxRent: 42000, minArea: 1300, maxArea: 1800, baths: 3, balconies: 2 },
    { bhk: "3BHK", type: "Villa", minRent: 35000, maxRent: 65000, minArea: 1800, maxArea: 2600, baths: 3, balconies: 3 }
  ]
};

const TITLE_PREFIXES = [
  "Spacious & Sunlit",
  "Modern Fully Furnished",
  "Elegant Vastu-Compliant",
  "Brand New Designer",
  "Peaceful Lake-View",
  "Executive Luxury",
  "Well-Ventilated Corner",
  "Premium High-Rise",
  "Cozy & Quiet",
  "Charming Garden-Facing",
  "Ultra-Modern Smart",
  "Comfortable Family-Friendly"
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubset(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedTamilNadu() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected successfully.");

  // Ensure owners exist
  const ownerIds = [];
  for (const owner of TN_OWNERS) {
    let user = await User.findOne({ email: owner.email });
    if (!user) {
      user = new User({
        email: owner.email,
        password: "Password@123",
        fullName: owner.fullName,
        mobileNumber: owner.mobileNumber
      });
      await user.save();
    }
    ownerIds.push(user._id);
  }
  console.log(`Ensured ${ownerIds.length} landlord accounts for Tamil Nadu.`);

  const propertiesToInsert = [];

  // Generate 5 to 7 properties per locality across 73 localities = 365 to 500+ properties!
  for (const loc of TN_LOCALITIES) {
    const countForLoc = getRandomInt(5, 7);
    const configs = PROPERTY_CONFIGS[loc.tier] || PROPERTY_CONFIGS.mid;

    for (let i = 0; i < countForLoc; i++) {
      const config = getRandomItem(configs);
      const ownerId = getRandomItem(ownerIds);

      // Jitter so map pins don't overlap exactly
      const jitterLat = (Math.random() - 0.5) * 0.015;
      const jitterLng = (Math.random() - 0.5) * 0.015;
      const finalLat = parseFloat((loc.lat + jitterLat).toFixed(6));
      const finalLng = parseFloat((loc.lng + jitterLng).toFixed(6));

      const rawRent = getRandomInt(config.minRent, config.maxRent);
      const rent = Math.round(rawRent / 500) * 500;
      const depositMultiplier = getRandomInt(2, 4);
      const deposit = rent * depositMultiplier;

      const builtUpArea = getRandomInt(config.minArea, config.maxArea);
      const prefix = getRandomItem(TITLE_PREFIXES);
      const title = `${prefix} ${config.bhk} in ${loc.locality}`;

      const photos = getRandomItem(PHOTO_SETS);
      const amenities = getRandomSubset(ALL_AMENITIES, getRandomInt(7, 14));

      const tenant = getRandomItem(["Anyone", "Family", "Bachelors", "Company"]);
      const availability = getRandomItem(["Immediate", "Within 15 Days", "Within 30 Days"]);
      const furnishing = getRandomItem(["Fully Furnished", "Semi-Furnished", "Unfurnished"]);

      const totalFloors = getRandomInt(3, 20);
      const floor = getRandomInt(1, totalFloors);

      const description = `This well-maintained ${config.bhk} ${config.type.toLowerCase()} situated in ${loc.locality}, ${loc.city}, Tamil Nadu provides serene residential comfort with excellent cross-ventilation, expansive rooms, and quality modern fittings. Located close to major transportation networks, IT corridors, tech hubs, grocery superstores, and leading healthcare institutions. Direct owner listing with zero brokerage.`;

      propertiesToInsert.push({
        owner: ownerId,
        title,
        locality: {
          placeId: `dummy_tn_${loc.city.toLowerCase()}_${loc.locality.toLowerCase().replace(/[^a-z0-9]/g, "")}_${i}`,
          label: `${loc.locality}, ${loc.city}`,
          text: `${loc.locality}, ${loc.city}, Tamil Nadu, India`,
          city: loc.city,
          state: "Tamil Nadu"
        },
        location: {
          type: "Point",
          coordinates: [finalLng, finalLat]
        },
        rent,
        deposit,
        propertyType: config.type,
        BHKType: config.bhk,
        Furnishing: furnishing,
        preferredTenant: tenant,
        Availability: availability,
        builtUpArea,
        bathrooms: config.baths,
        balconies: config.balconies,
        floor,
        totalFloors,
        Parking: Math.random() > 0.15,
        PetFriendly: Math.random() > 0.4,
        photos,
        amenities,
        description,
        status: "active",
        views: getRandomInt(15, 600)
      });
    }
  }

  console.log(`Generated ${propertiesToInsert.length} properties across ${TN_LOCALITIES.length} Tamil Nadu localities!`);

  // Insert in chunks of 100
  const CHUNK_SIZE = 100;
  let totalInserted = 0;
  for (let i = 0; i < propertiesToInsert.length; i += CHUNK_SIZE) {
    const chunk = propertiesToInsert.slice(i, i + CHUNK_SIZE);
    await Property.insertMany(chunk);
    totalInserted += chunk.length;
    console.log(`Inserted ${totalInserted}/${propertiesToInsert.length} properties...`);
  }

  const totalInDB = await Property.countDocuments();
  const totalTNInDB = await Property.countDocuments({ "locality.text": /Tamil Nadu/i });
  console.log(`\n========================================`);
  console.log(`Successfully added ${totalInserted} Tamil Nadu properties!`);
  console.log(`Total Tamil Nadu properties in database: ${totalTNInDB}`);
  console.log(`Total properties overall in Rentosphere: ${totalInDB}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seedTamilNadu().catch((err) => {
  console.error("Error seeding Tamil Nadu properties:", err);
  process.exit(1);
});
