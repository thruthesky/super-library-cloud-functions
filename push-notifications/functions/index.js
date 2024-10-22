/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueWritten } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Choose one of "us-central1", "us-east1", "europe-west1", "asia-southeast1" for the Realtime Database access.
const region = "us-central1";
exports.tmpUsers = onValueWritten(
    {
        ref: "/users/{uid}",
        region,
    },
    async (event) => {
        logger.log('triggered at ' + new Date().toISOString());
        console.log(event.data.after.val());
        return await doSomething(event.params.uid, event.data.after.val());
    },
);


exports.doSomething = async (uid, data) => {
    // Do something
    logger.log('begin doSomething()', uid, data);
    await admin.database().ref("/copy").child(uid).set(data);
}



