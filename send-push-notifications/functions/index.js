/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueCreated } = require("firebase-functions/v2/database");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

const region = "asia-southeast1"


exports.makeuppercase = onValueCreated(
    {
        ref: "/chat/messages/{roomId}/{messageId}",
        /**
         * Supported regions are:
         * "asia-east1" | "asia-northeast1" | "asia-northeast2" | "europe-north1" | "europe-west1" | "europe-west4" | "us-central1" | "us-east1" | "us-east4" | "us-west1" | "asia-east2" | "asia-northeast3" | "asia-southeast1" | "asia-southeast2" | "asia-south1" | "australia-southeast1" | "europe-central2" | "europe-west2" | "europe-west3" | "europe-west6" | "northamerica-northeast1" | "southamerica-east1" | "us-west2" | "us-west3" | "us-west4"
         */
        // region: "asia-southeast1",

        // Memory options: "128MiB" | "256MiB" | "512MiB" | "1GiB" | "2GiB" | "4GiB" | "8GiB" | "16GiB" | "32GiB"
        // memory: "2GiB",

        // Timeout values: 0 to 540 (in seconds)
        // timeoutSeconds: 540,

        // minInstances: 1,
        // maxInstances: 2,

        // Number of requests a function can serve at once.
        // concurrency: 9,


        // cpu?: number | "gcf_gen1";


        // You may need it for a fixed public IP address.
        // vpcConnector?: string | Expression < string > | ResetValue;
        // vpcConnectorEgressSettings?: options.VpcEgressSetting | ResetValue;

        // Specific service account for the function to run as.
        // serviceAccount?: { ... }

        // ingressSettings?: options.IngressSetting | ResetValue;


        // labels?: Record < string, string>;
        // secrets ?: (string | SecretParam)[];
        /** Whether failed executions should be delivered again. */
        // retry ?: boolean | Expression < boolean > | ResetValue;
    },
    (event) => {
        // Grab the current value of what was written to the Realtime Database.
        const data = event.data.val();
        const roomId = event.params.roomId;
        const messageId = event.params.messageId;
        console.log("roomId: ", roomId, ", messageId: ", messageId, ", data: ", data);

        return sendMessages(roomId, messageId, data);
    },
);

exports.sendMessages = async (roomId, messageId, data) => {
    // Do something
    logger.log('sendMessages', roomId, messageId, data);
    await admin.database().ref("/tmp").child(roomId).child(messageId).set(data.toUpperCase());
}
