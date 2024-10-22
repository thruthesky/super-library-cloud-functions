
const { onValueWritten, onValueCreated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Choose one of "us-central1", "us-east1", "europe-west1", "asia-southeast1" for the Realtime Database access.

if (admin.apps.length === 0) {
    admin.initializeApp();
}

