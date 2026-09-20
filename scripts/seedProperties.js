import mongoose from "mongoose";
import dotenv from "dotenv";
import { Property } from "../src/models/property.model.js";
import { User } from "../src/models/user.model.js";

dotenv.config();

const CITIES_LOCALITIES = [
  // 1. Bengaluru
  { city: "Bengaluru", state: "Karnataka", locality: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { city: "Bengaluru", state: "Karnataka", locality: "Indiranagar", lat: 12.9719, lng: 77.6412 },
  { city: "Bengaluru", state: "Karnataka", locality: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { city: "Bengaluru", state: "Karnataka", locality: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { city: "Bengaluru", state: "Karnataka", locality: "Bellandur", lat: 12.9304, lng: 77.6784 },
  { city: "Bengaluru", state: "Karnataka", locality: "Electronic City", lat: 12.8458, lng: 77.6603 },
  { city: "Bengaluru", state: "Karnataka", locality: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  { city: "Bengaluru", state: "Karnataka", locality: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { city: "Bengaluru", state: "Karnataka", locality: "Hebbal", lat: 13.0358, lng: 77.5970 },
  { city: "Bengaluru", state: "Karnataka", locality: "Sarjapur Road", lat: 12.9103, lng: 77.6835 },

  // 2. Mumbai & MMR
  { city: "Mumbai", state: "Maharashtra", locality: "Bandra West", lat: 19.0596, lng: 72.8295 },
  { city: "Mumbai", state: "Maharashtra", locality: "Andheri West", lat: 19.1363, lng: 72.8277 },
  { city: "Mumbai", state: "Maharashtra", locality: "Powai", lat: 19.1176, lng: 72.9060 },
  { city: "Mumbai", state: "Maharashtra", locality: "Juhu", lat: 19.1075, lng: 72.8263 },
  { city: "Mumbai", state: "Maharashtra", locality: "Worli", lat: 19.0176, lng: 72.8181 },
  { city: "Mumbai", state: "Maharashtra", locality: "Malad West", lat: 19.1860, lng: 72.8485 },
  { city: "Mumbai", state: "Maharashtra", locality: "Lower Parel", lat: 18.9953, lng: 72.8302 },
  { city: "Thane", state: "Maharashtra", locality: "Thane West", lat: 19.2183, lng: 72.9781 },
  { city: "Navi Mumbai", state: "Maharashtra", locality: "Vashi", lat: 19.0771, lng: 72.9986 },
  { city: "Mumbai", state: "Maharashtra", locality: "Goregaon East", lat: 19.1663, lng: 72.8526 },

  // 3. Delhi-NCR
  { city: "New Delhi", state: "Delhi", locality: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
  { city: "New Delhi", state: "Delhi", locality: "Greater Kailash", lat: 28.5482, lng: 77.2426 },
  { city: "New Delhi", state: "Delhi", locality: "Saket", lat: 28.5244, lng: 77.2155 },
  { city: "New Delhi", state: "Delhi", locality: "Vasant Kunj", lat: 28.5200, lng: 77.1550 },
  { city: "Gurugram", state: "Haryana", locality: "DLF Phase 5", lat: 28.4595, lng: 77.0945 },
  { city: "Gurugram", state: "Haryana", locality: "Cyber City", lat: 28.4950, lng: 77.0895 },
  { city: "Gurugram", state: "Haryana", locality: "Sohna Road", lat: 28.4124, lng: 77.0425 },
  { city: "Noida", state: "Uttar Pradesh", locality: "Sector 62", lat: 28.6279, lng: 77.3649 },
  { city: "Noida", state: "Uttar Pradesh", locality: "Sector 137", lat: 28.5085, lng: 77.4095 },
  { city: "Ghaziabad", state: "Uttar Pradesh", locality: "Indirapuram", lat: 28.6415, lng: 77.3713 },

  // 4. Pune
  { city: "Pune", state: "Maharashtra", locality: "Koregaon Park", lat: 18.5362, lng: 73.8958 },
  { city: "Pune", state: "Maharashtra", locality: "Baner", lat: 18.5590, lng: 73.7868 },
  { city: "Pune", state: "Maharashtra", locality: "Wakad", lat: 18.5987, lng: 73.7688 },
  { city: "Pune", state: "Maharashtra", locality: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
  { city: "Pune", state: "Maharashtra", locality: "Kharadi", lat: 18.5516, lng: 73.9348 },
  { city: "Pune", state: "Maharashtra", locality: "Hinjewadi", lat: 18.5913, lng: 73.7389 },
  { city: "Pune", state: "Maharashtra", locality: "Kothrud", lat: 18.5074, lng: 73.8077 },
  { city: "Pune", state: "Maharashtra", locality: "Aundh", lat: 18.5626, lng: 73.8087 },

  // 5. Hyderabad
  { city: "Hyderabad", state: "Telangana", locality: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { city: "Hyderabad", state: "Telangana", locality: "Hitec City", lat: 17.4435, lng: 78.3772 },
  { city: "Hyderabad", state: "Telangana", locality: "Madhapur", lat: 17.4483, lng: 78.3915 },
  { city: "Hyderabad", state: "Telangana", locality: "Jubilee Hills", lat: 17.4319, lng: 78.4073 },
  { city: "Hyderabad", state: "Telangana", locality: "Banjara Hills", lat: 17.4156, lng: 78.4357 },
  { city: "Hyderabad", state: "Telangana", locality: "Kondapur", lat: 17.4699, lng: 78.3578 },
  { city: "Hyderabad", state: "Telangana", locality: "Kukatpally", lat: 17.4849, lng: 78.4138 },

  // 6. Chennai
  { city: "Chennai", state: "Tamil Nadu", locality: "Adyar", lat: 13.0012, lng: 80.2565 },
  { city: "Chennai", state: "Tamil Nadu", locality: "Anna Nagar", lat: 13.0850, lng: 80.2101 },
  { city: "Chennai", state: "Tamil Nadu", locality: "OMR Thoraipakkam", lat: 12.9416, lng: 80.2362 },
  { city: "Chennai", state: "Tamil Nadu", locality: "Velachery", lat: 12.9815, lng: 80.2180 },
  { city: "Chennai", state: "Tamil Nadu", locality: "Besant Nagar", lat: 13.0001, lng: 80.2667 },
  { city: "Chennai", state: "Tamil Nadu", locality: "T Nagar", lat: 13.0418, lng: 80.2341 },
  { city: "Chennai", state: "Tamil Nadu", locality: "Sholinganallur", lat: 12.9010, lng: 80.2279 },

  // 7. Kolkata
  { city: "Kolkata", state: "West Bengal", locality: "Salt Lake Sector V", lat: 22.5804, lng: 88.4378 },
  { city: "Kolkata", state: "West Bengal", locality: "New Town", lat: 22.5958, lng: 88.4796 },
  { city: "Kolkata", state: "West Bengal", locality: "Park Street", lat: 22.5512, lng: 88.3526 },
  { city: "Kolkata", state: "West Bengal", locality: "Ballygunge", lat: 22.5280, lng: 88.3655 },
  { city: "Kolkata", state: "West Bengal", locality: "Rajarhat", lat: 22.6190, lng: 88.4728 },

  // 8. Ahmedabad
  { city: "Ahmedabad", state: "Gujarat", locality: "SG Highway", lat: 23.0525, lng: 72.5186 },
  { city: "Ahmedabad", state: "Gujarat", locality: "Satellite", lat: 23.0304, lng: 72.5178 },
  { city: "Ahmedabad", state: "Gujarat", locality: "Bodakdev", lat: 23.0396, lng: 72.5126 },
  { city: "Ahmedabad", state: "Gujarat", locality: "Prahlad Nagar", lat: 23.0120, lng: 72.5075 },

  // 9. Jaipur
  { city: "Jaipur", state: "Rajasthan", locality: "Malviya Nagar", lat: 26.8524, lng: 75.8122 },
  { city: "Jaipur", state: "Rajasthan", locality: "Vaishali Nagar", lat: 26.9113, lng: 75.7423 },
  { city: "Jaipur", state: "Rajasthan", locality: "C-Scheme", lat: 26.9075, lng: 75.8056 },
  { city: "Jaipur", state: "Rajasthan", locality: "Mansarovar", lat: 26.8576, lng: 75.7663 },

  // 10. Kochi / Goa / Chandigarh
  { city: "Kochi", state: "Kerala", locality: "Kakkanad", lat: 10.0159, lng: 76.3419 },
  { city: "Panaji", state: "Goa", locality: "Miramar Beach", lat: 15.4820, lng: 73.8115 },
  { city: "Candolim", state: "Goa", locality: "Candolim Beach Road", lat: 15.5182, lng: 73.7626 },
  { city: "Chandigarh", state: "Chandigarh", locality: "Sector 17", lat: 30.7415, lng: 76.7681 }
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
  "Covered Parking",
  "Lift",
  "Gym",
  "Swimming Pool",
  "Clubhouse",
  "Children's Play Area",
  "Gated Society",
  "Piped Gas",
  "Intercom",
  "Jogging Track",
  "Wi-Fi Connectivity",
  "Rainwater Harvesting",
  "CCTV Surveillance",
  "Visitor Parking",
  "Badminton Court",
  "Fire Fighting System"
];

const DUMMY_OWNERS = [
  { fullName: "Aryan Patel", email: "aryanpatel8082@gmail.com", mobileNumber: "+91 98765 43210" },
  { fullName: "Rahul Sharma", email: "rahul.sharma842@rentosphere.in", mobileNumber: "+91 98234 56781" },
  { fullName: "Priya Nair", email: "priya.nair901@rentosphere.in", mobileNumber: "+91 98112 34567" },
  { fullName: "Amit Verma", email: "amit.verma342@rentosphere.in", mobileNumber: "+91 98345 67890" },
  { fullName: "Sneha Kulkarni", email: "sneha.kulkarni@rentosphere.in", mobileNumber: "+91 98456 78901" },
  { fullName: "Vikram Reddy", email: "vikram.reddy77@rentosphere.in", mobileNumber: "+91 98789 01234" },
  { fullName: "Ananya Iyer", email: "ananya.iyer55@rentosphere.in", mobileNumber: "+91 98901 23456" },
  { fullName: "Rajesh Gupta", email: "rajesh.gupta88@rentosphere.in", mobileNumber: "+91 98123 45678" },
  { fullName: "Deepak Rao", email: "deepak.rao23@rentosphere.in", mobileNumber: "+91 98246 81357" },
  { fullName: "Meera Sen", email: "meera.sen64@rentosphere.in", mobileNumber: "+91 98369 14725" },
  { fullName: "Siddharth Joshi", email: "siddharth.joshi@rentosphere.in", mobileNumber: "+91 98480 25836" },
  { fullName: "Kavita Singhal", email: "kavita.singhal@rentosphere.in", mobileNumber: "+91 98591 36947" }
];

const PROPERTY_CONFIGS = [
  {
    bhk: "1RK",
    type: "Studio",
    furnishing: "Fully Furnished",
    minRent: 12000,
    maxRent: 19000,
    minArea: 350,
    maxArea: 480,
    baths: 1,
    balconies: 1,
    titleTemplates: [
      "Chic & Cozy Studio Apartment",
      "Fully Furnished Modern 1RK",
      "Compact Studio near Tech Parks",
      "Sunlit 1RK Studio with Balcony"
    ]
  },
  {
    bhk: "1BHK",
    type: "Apartment",
    furnishing: "Semi-Furnished",
    minRent: 18000,
    maxRent: 29000,
    minArea: 550,
    maxArea: 750,
    baths: 1,
    balconies: 1,
    titleTemplates: [
      "Modern 1BHK in Premium Gated Society",
      "Well-Ventilated 1BHK with Modular Kitchen",
      "Spacious 1BHK close to Metro Station",
      "Peaceful 1BHK Flat with Green Views"
    ]
  },
  {
    bhk: "2BHK",
    type: "Apartment",
    furnishing: "Fully Furnished",
    minRent: 28000,
    maxRent: 54000,
    minArea: 950,
    maxArea: 1350,
    baths: 2,
    balconies: 2,
    titleTemplates: [
      "Spacious 2BHK with Scenic Balcony Views",
      "Designer Furnished 2BHK Apartment",
      "Premium 2BHK in High-Rise Society",
      "Sun-Drenched 2BHK Home with Modern Interiors"
    ]
  },
  {
    bhk: "3BHK",
    type: "Apartment",
    furnishing: "Semi-Furnished",
    minRent: 48000,
    maxRent: 95000,
    minArea: 1450,
    maxArea: 2100,
    baths: 3,
    balconies: 3,
    titleTemplates: [
      "Luxurious 3BHK Apartment with Lake Views",
      "Grand 3BHK with Servant Room & Covered Parking",
      "Ultra-Modern 3BHK Residence in Gated Township",
      "Elegant 3BHK Corner Flat with 3 Balconies"
    ]
  },
  {
    bhk: "4BHK",
    type: "Villa",
    furnishing: "Fully Furnished",
    minRent: 95000,
    maxRent: 185000,
    minArea: 2400,
    maxArea: 3800,
    baths: 4,
    balconies: 4,
    titleTemplates: [
      "Exclusive 4BHK Luxury Villa with Private Garden",
      "Executive 4BHK Penthouse with Skyline Terrace",
      "Palatial 4BHK Duplex in Prime Neighborhood",
      "Gated 4BHK Villa with Clubhouse & Pool Access"
    ]
  }
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

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in environment");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("MongoDB connected successfully.");

  // Ensure owner accounts exist
  const ownerIds = [];
  for (const owner of DUMMY_OWNERS) {
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
  console.log(`Ensured ${ownerIds.length} landlord accounts in database.`);

  const propertiesToInsert = [];

  // Generate 3 to 4 properties per locality
  for (const loc of CITIES_LOCALITIES) {
    const propertyCountForLoc = getRandomInt(3, 4);

    for (let i = 0; i < propertyCountForLoc; i++) {
      const config = getRandomItem(PROPERTY_CONFIGS);
      const ownerId = getRandomItem(ownerIds);

      // Add minor jitter so map markers do not collide at the exact same point
      const jitterLat = (Math.random() - 0.5) * 0.012;
      const jitterLng = (Math.random() - 0.5) * 0.012;
      const finalLat = parseFloat((loc.lat + jitterLat).toFixed(6));
      const finalLng = parseFloat((loc.lng + jitterLng).toFixed(6));

      // Rent rounded to nearest ₹500
      const baseRent = getRandomInt(config.minRent, config.maxRent);
      const rent = Math.round(baseRent / 500) * 500;
      const depositMultiplier = getRandomInt(2, 4);
      const deposit = rent * depositMultiplier;

      const builtUpArea = getRandomInt(config.minArea, config.maxArea);
      const title = `${getRandomItem(config.titleTemplates)} in ${loc.locality}`;
      const photos = getRandomItem(PHOTO_SETS);
      const amenities = getRandomSubset(ALL_AMENITIES, getRandomInt(6, 12));

      const tenantType = getRandomItem(["Anyone", "Family", "Bachelors", "Company"]);
      const availability = getRandomItem(["Immediate", "Within 15 Days", "Within 30 Days"]);
      const furnishing = getRandomItem(["Fully Furnished", "Semi-Furnished", "Unfurnished"]);

      const totalFloors = getRandomInt(4, 25);
      const floor = getRandomInt(1, totalFloors);

      const description = `This immaculate ${config.bhk} ${config.type.toLowerCase()} located in ${loc.locality}, ${loc.city} offers contemporary urban living with superior natural ventilation, thoughtful spatial planning, and high-quality fittings. Situated in a well-managed residential community with round-the-clock security, dedicated power backup, and easy connectivity to prime commercial zones, metro stations, and reputable educational institutions. Ready for immediate occupancy with zero brokerage.`;

      propertiesToInsert.push({
        owner: ownerId,
        title,
        locality: {
          placeId: `dummy_${loc.city.toLowerCase()}_${loc.locality.toLowerCase().replace(/[^a-z0-9]/g, "")}_${i}`,
          label: `${loc.locality}, ${loc.city}`,
          text: `${loc.locality}, ${loc.city}, ${loc.state}, India`,
          city: loc.city
        },
        location: {
          type: "Point",
          coordinates: [finalLng, finalLat] // GeoJSON longitude first, then latitude
        },
        rent,
        deposit,
        propertyType: config.type,
        BHKType: config.bhk,
        Furnishing: furnishing,
        preferredTenant: tenantType,
        Availability: availability,
        builtUpArea,
        bathrooms: config.baths,
        balconies: config.balconies,
        floor,
        totalFloors,
        Parking: Math.random() > 0.15,
        PetFriendly: Math.random() > 0.35,
        photos,
        amenities,
        description,
        status: "active",
        views: getRandomInt(25, 450)
      });
    }
  }

  console.log(`Prepared ${propertiesToInsert.length} dummy properties across ${CITIES_LOCALITIES.length} localities.`);

  // Insert properties
  const inserted = await Property.insertMany(propertiesToInsert);
  console.log(`Successfully inserted ${inserted.length} properties!`);

  const totalCount = await Property.countDocuments();
  console.log(`Total properties currently in Rentosphere database: ${totalCount}`);

  await mongoose.disconnect();
  console.log("Seeding complete and disconnected.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
