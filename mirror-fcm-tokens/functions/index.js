const admin = require("firebase-admin");

const {
    onDocumentCreated,
} = require("firebase-functions/v2/firestore");

exports.mirrorFcmTokens = onDocumentCreated("/users/{uid}/fcm_tokens/{documentId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }
        const data = snapshot.data();
        await admin.database().ref("/mirrored-fcm-tokens").child(data.token).set(event.params.uid);
    },
);

