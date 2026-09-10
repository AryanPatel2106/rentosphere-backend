export const autocompletePlaces = async (query) => {

    const response = await fetch(
        "https://places.googleapis.com/v1/places:autocomplete",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask":
                    "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat"
            },

            body: JSON.stringify({

                input: query,

                includedRegionCodes: ["IN"],

                includeQueryPredictions: false,

                languageCode: "en"

            })

        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return await response.json();

};

const coordinatesCache = new Map();

/**
 * Fetch latitude & longitude for a given Google placeId
 */
export const getPlaceCoordinates = async (placeId) => {
    if (!placeId) return null;

    if (coordinatesCache.has(placeId)) {
        return coordinatesCache.get(placeId);
    }

    try {
        const response = await fetch(
            `https://places.googleapis.com/v1/places/${placeId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "id,displayName,location,formattedAddress"
                }
            }
        );

        if (!response.ok) {
            console.error("Place details failed:", await response.text());
            return null;
        }

        const data = await response.json();

        if (data.location?.latitude !== undefined && data.location?.longitude !== undefined) {
            const coords = {
                latitude: data.location.latitude,
                longitude: data.location.longitude,
                label: data.displayName?.text || "",
                address: data.formattedAddress || ""
            };
            coordinatesCache.set(placeId, coords);
            return coords;
        }

        return null;
    } catch (err) {
        console.error("Error fetching place coordinates:", err);
        return null;
    }
};

/**
 * Search place coordinates using free-form text query
 */
export const searchPlaceCoordinates = async (textQuery) => {
    if (!textQuery || !textQuery.trim()) return null;

    const cacheKey = `query:${textQuery.toLowerCase().trim()}`;
    if (coordinatesCache.has(cacheKey)) {
        return coordinatesCache.get(cacheKey);
    }

    try {
        const response = await fetch(
            "https://places.googleapis.com/v1/places:searchText",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                    "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress"
                },
                body: JSON.stringify({
                    textQuery: textQuery.trim(),
                    regionCode: "IN",
                    languageCode: "en"
                })
            }
        );

        if (!response.ok) {
            console.error("Places searchText failed:", await response.text());
            return null;
        }

        const data = await response.json();
        const firstPlace = data.places?.[0];

        if (firstPlace?.location?.latitude !== undefined && firstPlace?.location?.longitude !== undefined) {
            const coords = {
                placeId: firstPlace.id,
                latitude: firstPlace.location.latitude,
                longitude: firstPlace.location.longitude,
                label: firstPlace.displayName?.text || "",
                address: firstPlace.formattedAddress || ""
            };
            coordinatesCache.set(cacheKey, coords);
            return coords;
        }

        return null;
    } catch (err) {
        console.error("Error in searchPlaceCoordinates:", err);
        return null;
    }
};