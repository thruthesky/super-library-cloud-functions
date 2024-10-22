/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


// const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const {
    onDocumentCreated,
} = require("firebase-functions/v2/firestore");



// Choose one of "us-central1", "us-east1", "europe-west1", "asia-southeast1" for the Realtime Database access.
// const region = "us-central1";
exports.mirrorFcmTokens = onDocumentCreated("/users/{uid}/fcm_tokens/{documentId}",
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log("No data associated with the event");
            return;
        }
        const data = snapshot.data();
        const token = data.fcm_token;
        const uid = event.params.uid;
        await admin.database().ref("/mirrored-fcm-tokens").child(token).set(uid);
    },
);

// exports.testFunc = onValueWritten(
//     {
//         ref: "/users/{uid}",
//         region,
//     },
//     async (event) => {
//         logger.log('triggered at ' + new Date().toISOString());
//         console.log(event.data.after.val());
//         return await doSomething(event.params.uid, event.data.after.val());
//     },
// );




// exports.doSomething = async (uid, data) => {
//     // Do something
//     logger.log('begin doSomething()', uid, data);
//     await admin.database().ref("/copy").child(uid).set(data);
// }



