import { autocompletePlaces } from "../services/location.service.js";

export const autocompleteLocation = async (req, res) => {

    try {

        const { q } = req.query;

        if (!q) {

            return res.status(400).json({
                success: false,
                message: "Query is required."
            });
        }

        const response = await autocompletePlaces(q);

        let suggestions =
            response.suggestions?.map((item) => {

                const prediction = item.placePrediction;

                return {

                    placeId: prediction.placeId,

                    label:
                        prediction.structuredFormat?.mainText?.text ??
                        prediction.text?.text ??
                        "",

                    text:
                        prediction.text?.text ??
                        ""

                };

            }) || [];

        // Remove duplicates
        const seen = new Set();

        suggestions = suggestions.filter((place) => {

            if (seen.has(place.placeId)) {
                return false;
            }

            seen.add(place.placeId);
            return true;

        });

        return res.status(200).json({

            success: true,

            data: suggestions

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

};