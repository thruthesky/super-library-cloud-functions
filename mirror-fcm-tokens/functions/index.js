const admin = require("firebase-admin");

const { defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");

const { onDocumentCreated } = require("firebase-functions/v2/firestore");


// Get the region from the user and set it as a global option
setGlobalOptions({
    region: defineString("REGION"),
});

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * This function mirrors the fcm tokens in the /users/{uid}/fcm_tokens collection to the /mirrored-fcm-tokens collection.
 */
exports.mirrorFcmTokens = onDocumentCreated("/users/{uid}/fcm_tokens/{documentId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }
        const data = snapshot.data();
        await admin.database().ref("/mirrored-fcm-tokens").child(data.fcm_token).set(event.params.uid);
    },
);




