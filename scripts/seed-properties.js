import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Property } from "../src/models/property.model.js";
import { User } from "../src/models/user.model.js";

const sampleImages = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80"
];

const seedProperties = [
    // ── BANGALORE ─────────────────────────────────────────────────────────────
    {
        title: "Modern 2BHK Apartment in Koramangala 4th Block",
        locality: {
            placeId: "ChIJbU60QAXr-zsRghNq7t9m0V0",
            label: "Koramangala 4th Block",
            text: "Koramangala 4th Block, Bengaluru, Karnataka 560034, India",
            city: "Bangalore"
        },
        location: { type: "Point", coordinates: [77.6271, 12.9345] },
        rent: 36000,
        deposit: 100000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 1150,
        bathrooms: 2,
        balconies: 1,
        floor: 3,
        totalFloors: 5,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[0], sampleImages[2]],
        amenities: ["Lift", "Power Backup", "Gym", "Gated Security", "Covered Parking"],
        description: "Sunlit 2BHK corner unit in prime Koramangala with designer woodwork, modular kitchen, chimney, 100% power backup, and walking distance to cafes."
    },
    {
        title: "Luxury 3BHK Penthouse with Private Terrace in Indiranagar",
        locality: {
            placeId: "ChIJkZ98d-MRrjsRIp1LzF_Yy4A",
            label: "Indiranagar 100 Feet Road",
            text: "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038, India",
            city: "Bangalore"
        },
        location: { type: "Point", coordinates: [77.6412, 12.9719] },
        rent: 68000,
        deposit: 250000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Family",
        Availability: "Immediate",
        builtUpArea: 1950,
        bathrooms: 3,
        balconies: 2,
        floor: 4,
        totalFloors: 4,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[4], sampleImages[1]],
        amenities: ["Private Terrace", "Lift", "Power Backup", "Clubhouse", "Swimming Pool", "24x7 Security"],
        description: "Stunning penthouse in quiet Indiranagar lane featuring panoramic city views, Italian marble flooring, walk-in closets, and EV charging station."
    },
    {
        title: "Chic 1BHK Studio Apartment in HSR Layout Sector 1",
        locality: {
            placeId: "ChIJvR1c6s0UrjsRtJc7qVb76yQ",
            label: "HSR Layout Sector 1",
            text: "HSR Layout Sector 1, Bengaluru, Karnataka 560102, India",
            city: "Bangalore"
        },
        location: { type: "Point", coordinates: [77.6514, 12.9116] },
        rent: 22000,
        deposit: 60000,
        propertyType: "Studio",
        BHKType: "1BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Bachelors",
        Availability: "Immediate",
        builtUpArea: 650,
        bathrooms: 1,
        balconies: 1,
        floor: 2,
        totalFloors: 4,
        Parking: true,
        PetFriendly: false,
        photos: [sampleImages[3], sampleImages[5]],
        amenities: ["Lift", "Power Backup", "Covered Parking", "CCTV"],
        description: "Perfect for tech professionals working in Bellandur or Outer Ring Road. High-speed broadband ready, wardrobe, geyser, and peaceful neighborhood."
    },
    {
        title: "Spacious 3BHK Gated Community Flat in Whitefield",
        locality: {
            placeId: "ChIJW5W94JcVrjsRU-W39Jm5Kk4",
            label: "Whitefield Main Road",
            text: "Whitefield, Bengaluru, Karnataka 560066, India",
            city: "Bangalore"
        },
        location: { type: "Point", coordinates: [77.7499, 12.9698] },
        rent: 42000,
        deposit: 120000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Family",
        Availability: "Within 15 Days",
        builtUpArea: 1650,
        bathrooms: 3,
        balconies: 2,
        floor: 7,
        totalFloors: 14,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[6], sampleImages[2]],
        amenities: ["Swimming Pool", "Gym", "Tennis Court", "Clubhouse", "Children Play Area", "24x7 Security"],
        description: "Resort-style living in a top-tier gated community near ITPL. Clubhouse, supermarket on premises, running track, and metro station just 800m away."
    },
    {
        title: "Budget 1RK Studio Room in BTM Layout 2nd Stage",
        locality: {
            placeId: "ChIJg28qHwEUrjsR76R_c0uXhGg",
            label: "BTM Layout 2nd Stage",
            text: "BTM Layout 2nd Stage, Bengaluru, Karnataka 560076, India",
            city: "Bangalore"
        },
        location: { type: "Point", coordinates: [77.6101, 12.9166] },
        rent: 14000,
        deposit: 40000,
        propertyType: "Studio",
        BHKType: "1RK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Bachelors",
        Availability: "Immediate",
        builtUpArea: 400,
        bathrooms: 1,
        balconies: 0,
        floor: 1,
        totalFloors: 3,
        Parking: false,
        PetFriendly: false,
        photos: [sampleImages[3]],
        amenities: ["Wi-Fi", "Refrigerator", "Bed & Mattress", "Wardrobe", "Geyser"],
        description: "Clean, independent 1RK studio room with attached bathroom, kitchenette with mini-fridge, queen bed, study table, and zero brokerage."
    },

    // ── CHENNAI & VIT CHENNAI ──────────────────────────────────────────────────
    {
        title: "Modern 2BHK Flat Near VIT Chennai Campus",
        locality: {
            placeId: "ChIJZx9Jjq9ZUjoRLX11GxNCS5Q",
            label: "VIT Chennai, Kelambakkam - Vandalur Rd",
            text: "Vandalur - Kelambakkam Road, Melakottaiyur, Chennai, Tamil Nadu 600127, India",
            city: "Chennai"
        },
        location: { type: "Point", coordinates: [80.1534, 12.8406] },
        rent: 18500,
        deposit: 60000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 1080,
        bathrooms: 2,
        balconies: 1,
        floor: 2,
        totalFloors: 5,
        Parking: true,
        PetFriendly: false,
        photos: [sampleImages[0], sampleImages[8]],
        amenities: ["Lift", "Power Backup", "Covered Bike/Car Parking", "Security"],
        description: "5 minutes walk from VIT Chennai main academic block. Spacious bedrooms, ceiling fans, curtain rods, and modular kitchen with pipeline gas connection."
    },
    {
        title: "Fully Furnished 3BHK Apartment in OMR Thoraipakkam",
        locality: {
            placeId: "ChIJOXW-d_hkUjoRFw4nUeJ33R8",
            label: "OMR Thoraipakkam",
            text: "Old Mahabalipuram Rd, Thoraipakkam, Chennai, Tamil Nadu 600097, India",
            city: "Chennai"
        },
        location: { type: "Point", coordinates: [80.2337, 12.9352] },
        rent: 32000,
        deposit: 120000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Family",
        Availability: "Immediate",
        builtUpArea: 1420,
        bathrooms: 3,
        balconies: 2,
        floor: 5,
        totalFloors: 9,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[2], sampleImages[5]],
        amenities: ["Lift", "Swimming Pool", "Gym", "Power Backup", "Clubhouse"],
        description: "Located right on the IT corridor. ACs in all bedrooms, 55-inch smart TV, dining set, automatic washing machine, and 2 car parkings."
    },
    {
        title: "Elegant 4BHK Independent Villa in Anna Nagar West",
        locality: {
            placeId: "ChIJW52qGohhUjoR34R2jH3v2aE",
            label: "Anna Nagar West",
            text: "Anna Nagar West, Chennai, Tamil Nadu 600040, India",
            city: "Chennai"
        },
        location: { type: "Point", coordinates: [80.1983, 13.0878] },
        rent: 75000,
        deposit: 300000,
        propertyType: "Villa",
        BHKType: "4BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Family",
        Availability: "Within 30 Days",
        builtUpArea: 2800,
        bathrooms: 4,
        balconies: 3,
        floor: 1,
        totalFloors: 2,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[4], sampleImages[7]],
        amenities: ["Private Garden", "Covered 2-Car Parking", "Servant Room", "Solar Water Heater"],
        description: "Independent luxury duplex villa on wide tree-lined street. Private landscaped garden, teakwood doors, expansive terrace, and close to top schools."
    },

    // ── MUMBAI ────────────────────────────────────────────────────────────────
    {
        title: "Sea-Facing 2BHK Designer Flat in Bandra West",
        locality: {
            placeId: "ChIJwe1EZjXJ5zsRaYFtP_d7W4Y",
            label: "Carter Road, Bandra West",
            text: "Carter Rd, Bandra West, Mumbai, Maharashtra 400050, India",
            city: "Mumbai"
        },
        location: { type: "Point", coordinates: [72.8258, 19.0607] },
        rent: 92000,
        deposit: 300000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 950,
        bathrooms: 2,
        balconies: 1,
        floor: 8,
        totalFloors: 12,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[1], sampleImages[6]],
        amenities: ["Sea View", "Lift", "Gym", "Concierge", "Covered Parking", "24x7 Security"],
        description: "Mesmerizing Arabian Sea views from living room and master bedroom. Minimalist Scandinavian interior, soundproof double-glazed windows, and prime Bandra location."
    },
    {
        title: "Contemporary 2BHK Near Metro in Andheri West",
        locality: {
            placeId: "ChIJj6wT_eDJ5zsRfgq_85Jj1G8",
            label: "Lokhandwala Complex, Andheri West",
            text: "Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053, India",
            city: "Mumbai"
        },
        location: { type: "Point", coordinates: [72.8273, 19.1417] },
        rent: 58000,
        deposit: 200000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Bachelors",
        Availability: "Immediate",
        builtUpArea: 820,
        bathrooms: 2,
        balconies: 1,
        floor: 5,
        totalFloors: 14,
        Parking: true,
        PetFriendly: false,
        photos: [sampleImages[0], sampleImages[2]],
        amenities: ["Lift", "Power Backup", "Gym", "Intercom", "Security"],
        description: "Right in the vibrant heart of Lokhandwala. Walking distance from clubs, organic markets, and DN Nagar Metro station. Ready to move."
    },
    {
        title: "Spacious 3BHK in Hiranandani Gardens Powai",
        locality: {
            placeId: "ChIJ67VvT8fG5zsRrn49p9XjC-8",
            label: "Hiranandani Gardens Powai",
            text: "Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076, India",
            city: "Mumbai"
        },
        location: { type: "Point", coordinates: [72.9134, 19.1176] },
        rent: 78000,
        deposit: 250000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Family",
        Availability: "Within 15 Days",
        builtUpArea: 1480,
        bathrooms: 3,
        balconies: 2,
        floor: 11,
        totalFloors: 22,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[4], sampleImages[5]],
        amenities: ["Clubhouse", "Swimming Pool", "Heritage Architecture", "Gym", "Garden"],
        description: "Neoclassical high-rise living in world-renowned Hiranandani township. Proximity to IIT Bombay, Lake Powai promenade, and international schools."
    },

    // ── DELHI NCR (GURGAON & NOIDA) ──────────────────────────────────────────
    {
        title: "Luxury 3BHK Condo on Golf Course Road Gurgaon",
        locality: {
            placeId: "ChIJW54v42ETDTkR9i1O33R3-bE",
            label: "Golf Course Road Sector 54",
            text: "Golf Course Road, Sector 54, Gurugram, Haryana 122011, India",
            city: "Gurgaon"
        },
        location: { type: "Point", coordinates: [77.1065, 28.4352] },
        rent: 65000,
        deposit: 150000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Family",
        Availability: "Immediate",
        builtUpArea: 2100,
        bathrooms: 3,
        balconies: 3,
        floor: 9,
        totalFloors: 24,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[1], sampleImages[7]],
        amenities: ["Golf Course View", "Infinity Pool", "Clubhouse", "Concierge", "Reserved Covered Parking"],
        description: "Premium address opposite Rapid Metro station. VRV air-conditioning, imported sanitaryware, double-height lobby, and private clubhouse privileges."
    },
    {
        title: "Smart 2BHK Builder Floor in DLF Phase 3 Gurgaon",
        locality: {
            placeId: "ChIJH9P4zLwTDTkRY5h4Z3_w5aY",
            label: "DLF Phase 3 Cyber City",
            text: "DLF Phase 3, Sector 24, Gurugram, Haryana 122002, India",
            city: "Gurgaon"
        },
        location: { type: "Point", coordinates: [77.0982, 28.4912] },
        rent: 32000,
        deposit: 64000,
        propertyType: "Builder Floor",
        BHKType: "2BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Bachelors",
        Availability: "Immediate",
        builtUpArea: 1100,
        bathrooms: 2,
        balconies: 1,
        floor: 2,
        totalFloors: 4,
        Parking: true,
        PetFriendly: false,
        photos: [sampleImages[2], sampleImages[3]],
        amenities: ["Power Backup", "Gated Security", "Lift", "CCTV"],
        description: "Within 5 minutes of Cyber Hub and Ambience Mall. Ideal for young corporate leaders. Fully equipped modular kitchen, 100% power backup, and modern interiors."
    },
    {
        title: "Affordable 2BHK High-Rise Apartment in Noida Sector 62",
        locality: {
            placeId: "ChIJW0j9Z_7mDDkRSa4b6k1_o0Y",
            label: "Sector 62 Noida",
            text: "Sector 62, Noida, Uttar Pradesh 201309, India",
            city: "Noida"
        },
        location: { type: "Point", coordinates: [77.3621, 28.6284] },
        rent: 21000,
        deposit: 42000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 1050,
        bathrooms: 2,
        balconies: 2,
        floor: 6,
        totalFloors: 18,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[0], sampleImages[6]],
        amenities: ["Lift", "Power Backup", "Gym", "Park", "Security"],
        description: "Well-connected to Sector 62 Electronic City Metro. Peaceful society with lush central green park, badminton court, and round-the-clock security."
    },

    // ── PUNE ──────────────────────────────────────────────────────────────────
    {
        title: "2BHK Flat in Hinjewadi Phase 1 Near Tech Hub",
        locality: {
            placeId: "ChIJRf1XoqvTwjsR45uD_w9m51A",
            label: "Hinjewadi Phase 1",
            text: "Hinjewadi Rajiv Gandhi Infotech Park, Pune, Maharashtra 411057, India",
            city: "Pune"
        },
        location: { type: "Point", coordinates: [73.7297, 18.5913] },
        rent: 24000,
        deposit: 60000,
        propertyType: "Apartment",
        BHKType: "2BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 980,
        bathrooms: 2,
        balconies: 1,
        floor: 4,
        totalFloors: 11,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[5], sampleImages[8]],
        amenities: ["Lift", "Power Backup", "Gym", "Covered Parking", "Clubhouse"],
        description: "Walking distance to Infosys, Wipro, and TCS campus. Features ergonomic work desk setup, high-speed fiber internet, and full home furnishings."
    },
    {
        title: "Premium 3BHK Apartment in Viman Nagar",
        locality: {
            placeId: "ChIJW5T_p_LSwjsR09X49h3aC5M",
            label: "Viman Nagar Central",
            text: "Viman Nagar, Pune, Maharashtra 411014, India",
            city: "Pune"
        },
        location: { type: "Point", coordinates: [73.9143, 18.5679] },
        rent: 44000,
        deposit: 120000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Semi-Furnished",
        preferredTenant: "Family",
        Availability: "Immediate",
        builtUpArea: 1550,
        bathrooms: 3,
        balconies: 2,
        floor: 6,
        totalFloors: 10,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[1], sampleImages[4]],
        amenities: ["Lift", "Swimming Pool", "Gym", "Power Backup", "Children Play Area"],
        description: "Just 10 minutes from Pune Airport and Phoenix Marketcity. Expansive living room with wooden flooring, piped gas, and 2 dedicated car parkings."
    },

    // ── HYDERABAD ─────────────────────────────────────────────────────────────
    {
        title: "High-Rise 3BHK in Hitec City Financial District",
        locality: {
            placeId: "ChIJw7Zp-lGTyzsRF74p9a6L81U",
            label: "Hitec City / Financial District",
            text: "Financial District, Nanakramguda, Hyderabad, Telangana 500032, India",
            city: "Hyderabad"
        },
        location: { type: "Point", coordinates: [78.3498, 17.4156] },
        rent: 48000,
        deposit: 120000,
        propertyType: "Apartment",
        BHKType: "3BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Anyone",
        Availability: "Immediate",
        builtUpArea: 1780,
        bathrooms: 3,
        balconies: 2,
        floor: 14,
        totalFloors: 28,
        Parking: true,
        PetFriendly: true,
        photos: [sampleImages[0], sampleImages[4]],
        amenities: ["Infinity Pool", "Clubhouse", "Gym", "Squash Court", "Covered Parking", "24x7 Security"],
        description: "Breathtaking views from 14th floor. Minutes from Microsoft, Google, and Amazon campuses. Premium fittings, central AC, and grand clubhouse access."
    },
    {
        title: "Cozy 1BHK Flat in Gachibowli",
        locality: {
            placeId: "ChIJH1wY6U2TyzsRu21k_4vV4Y0",
            label: "Gachibowli IT Corridor",
            text: "Gachibowli, Hyderabad, Telangana 500032, India",
            city: "Hyderabad"
        },
        location: { type: "Point", coordinates: [78.3578, 17.4401] },
        rent: 19500,
        deposit: 40000,
        propertyType: "Apartment",
        BHKType: "1BHK",
        Furnishing: "Fully Furnished",
        preferredTenant: "Bachelors",
        Availability: "Immediate",
        builtUpArea: 600,
        bathrooms: 1,
        balconies: 1,
        floor: 3,
        totalFloors: 5,
        Parking: true,
        PetFriendly: false,
        photos: [sampleImages[3], sampleImages[2]],
        amenities: ["Lift", "Power Backup", "Wi-Fi Ready", "Security"],
        description: "Move-in ready flat equipped with double bed, mattress, wardrobe, smart LED TV, refrigerator, and microwave."
    }
];

async function seed() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected successfully.");

        // Find existing user to assign as owner
        let ownerUser = await User.findOne({ email: "aryanpatel8082@gmail.com" });
        if (!ownerUser) {
            ownerUser = await User.findOne({});
        }

        if (!ownerUser) {
            console.error("No user found in DB to associate properties with! Please register a user first.");
            process.exit(1);
        }

        console.log(`Using owner: ${ownerUser.fullName || ownerUser.email} (${ownerUser._id})`);

        // Check if properties already exist
        const count = await Property.countDocuments();
        console.log(`Existing property count in DB: ${count}`);

        const propertiesToInsert = seedProperties.map((p) => ({
            ...p,
            owner: ownerUser._id,
            status: "active",
            views: Math.floor(Math.random() * 80) + 12
        }));

        const result = await Property.insertMany(propertiesToInsert);
        console.log(`Successfully seeded ${result.length} authentic properties into MongoDB!`);

        const newCount = await Property.countDocuments();
        console.log(`Total properties in DB now: ${newCount}`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding error:", err);
        process.exit(1);
    }
}

seed();
