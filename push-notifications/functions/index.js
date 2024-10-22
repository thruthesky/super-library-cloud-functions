/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueWritten, onValueCreated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Choose one of "us-central1", "us-east1", "europe-west1", "asia-southeast1" for the Realtime Database access.

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const region = "asia-southeast1"
exports.tmpUsers = onValueWritten(
    "/users/{uid}",
    async (event) => {
        logger.log('triggered at ' + new Date().toISOString());
        console.log(event.data.after.val());
        return await doSomething(event.data.ref, event.params.uid, event.data.after.val());
    },
);


async function doSomething(ref, uid, data) {
    // Do something
    logger.log('doSomething', ref, uid, data);
    await admin.database().ref("/copy").child(uid).set(data);
}



exports.makeuppercase = onValueCreated(
    "/messages/{pushId}/original",
    (event) => {
        // Grab the current value of what was written to the Realtime Database.
        const original = event.data.val();
        logger.log("Uppercasing", event.params.pushId, original);
        const uppercase = original.toUpperCase();
        // You must return a Promise when performing
        // asynchronous tasks inside a function, such as
        // writing to the Firebase Realtime Database.
        // Setting an "uppercase" sibling in the
        // Realtime Database returns a Promise.
        return event.data.ref.parent.child("uppercase").set(uppercase);
    },
);