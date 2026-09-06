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