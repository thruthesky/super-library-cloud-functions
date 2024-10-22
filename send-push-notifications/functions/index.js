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


const batchCount = 3;


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

        return sendChatMessages(roomId, messageId, data);
    },
);

/**
 * Returns the FCM tokens of the users.
 *
 * @param {string | string[]} uids The user UIDs. It can be a single UID or an array of UIDs.
 * @return {Promise<string[]>}
 */
const getUserTokens = async (uids) => {
    uids = Array.isArray(uids) ? uids : [uids];

    const tokens = [];
    for (const uid of uids) {
        const snapshot = await admin.database().ref("mirrored-fcm-tokens").orderByValue().equalTo(uid).get();
        const userTokens = snapshot.val();
        if (userTokens) {
            tokens.push(...Object.keys(userTokens));
        }
    }
    return tokens;
}

/**
 * Returns the user ids of the chat room users.
 * 
 * @param {string} roomId The room id
 * @returns {Promise<string[]>} returns the user ids of the chat room users.
 */
const getChatRoomUsers = async (roomId) => {
    const snapshot = await admin.database().ref("chat/rooms").child(roomId).child('users').get();
    const userMap = snapshot.val();
    const uids = Object.keys(userMap);
    return uids;
}


/**
 * Returns the message batches.
 * 
 * @param {*} tokensArr the user tokens in an array
 * @param {*} title title of the message
 * @param {*} body body of the message
 * @param {*} imageUrl url of the image. If it is an image, then apply it to the imageUrl. If there is not url, then apply user's photoUrl.
 * @param {*} sound the sound of the push notification
 * @param {*} parameterData page parameter data to be consumed by the flutterflow app
 * @param {*} initialPageName page name to be opened by the flutterflow app
 * @returns {Array} returns the message batches
 */
const getPayloads = (tokensArr, title, body, imageUrl, sound, parameterData, initialPageName) => {
    var messageBatches = [];
    for (let i = 0; i < tokensArr.length; i += batchCount) {
        const tokensBatch = tokensArr.slice(i, Math.min(i + batchCount, tokensArr.length));
        const messages = {
            notification: {
                title,
                body,
                ...(imageUrl && { imageUrl: imageUrl }),
            },
            data: {
                initialPageName,
                parameterData
            },
            android: {
                notification: {
                    ...(sound && { sound: sound }),
                },
            },
            apns: {
                payload: {
                    aps: {
                        ...(sound && { sound: sound }),
                    },
                },
            },
            tokens: tokensBatch,
        };
        messageBatches.push(messages);
    }
    return messageBatches;
}



/**
 * Send messages to the users when there is a new message in the chat room.
 * 
 * @param {*} roomId the chat room id
 * @param {*} messageId the chat message id
 * @param {*} data the chat message data
 */
const sendChatMessages = async (roomId, messageId, data) => {
    console.log('sendChatMessages:: ', roomId, messageId, data);

    const uids = await getChatRoomUsers(roomId);
    const tokens = await getUserTokens(uids);

    console.log('tokens: ', tokens);

    const isSingleChat = roomId.indexOf('---') >= 0;
    const groupChat = !isSingleChat;


    // const notificationData = data;
    let title = data.displayName || "Unknown user";
    if (groupChat) {
        // get chat room name
        // const snapshot = await admin.database().ref("chat/rooms").child(roomId).child('name').get();
        // TODO: get chat room name and append it to the title
        title += " (room name)";
    }
    const body = data.text || "...";
    // TODO: (1) if the url is an image, then apply it to the imageUrl. (2) if there is not url, then apply user's photoUrl.
    const imageUrl = data.url || data.photourl || "";
    const sound = data.notification_sound || "";

    // TODO: support it works with FlutterFlow
    const parameterData = data.parameter_data || "";
    // TODO: support it works with FlutterFlow
    const initialPageName = data.initial_page_name || "";


    const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);


    await sendPushNotifications(messageBatches, '/chat/rooms/' + roomId + '/messages/' + messageId);


}

/**
 * Send push notifications to the users.
 * 
 * @param {*} messageBatches the message batches of the payload
 */
const sendPushNotifications = async (messageBatches, id) => {
    var numSent = 0;
    var numFailed = 0;

    const ref = admin.database().ref('fcm-results').push();
    await ref.set({
        id,
        status: "started",
        startedAt: new Date().toISOString(),
    });

    await Promise.all(
        messageBatches.map(async (messages) => {
            console.log(messages.tokens.length, "messages to send");
            const response = await admin.messaging().sendEachForMulticast(messages);
            numSent += response.successCount;
            numFailed += response.failureCount;
        })
    );

    await ref.update({
        status: "succeeded",
        num_sent: numSent,
        num_failed: numFailed,
        finishedAt: new Date().toISOString(),
    });
}


exports.getChatRoomUsers = getChatRoomUsers;
exports.getUserTokens = getUserTokens;
exports.sendChatMessages = sendChatMessages;
exports.getPayloads = getPayloads;
exports.sendPushNotifications = sendPushNotifications;


