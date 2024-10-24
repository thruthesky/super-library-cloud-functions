/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueCreated } = require("firebase-functions/v2/database");

const admin = require("firebase-admin");

// const region = "asia-southeast1";


const batchCount = 3;
const debugLog = true;


// Initialize Firebase app
admin.initializeApp();

exports.pushNotificationOnChatMessage = onValueCreated(
  {
    ref: "/chat/messages/{roomId}/{messageId}",
    /**
     * Supported regions are:
     * "asia-east1" | "asia-northeast1" | "asia-northeast2"
     * | "europe-north1" | "europe-west1" | "europe-west4"
     * | "us-central1" | "us-east1" | "us-east4" | "us-west1"
     * | "asia-east2" | "asia-northeast3" | "asia-southeast1"
     * | "asia-southeast2" | "asia-south1" | "australia-southeast1"
     * | "europe-central2" | "europe-west2" | "europe-west3"
     * | "europe-west6" | "northamerica-northeast1" | "southamerica-east1"
     * | "us-west2" | "us-west3" | "us-west4"
     */
    // region: "asia-southeast1",

    // Memory options: "128MiB" | "256MiB" | "512MiB"
    // | "1GiB" | "2GiB" | "4GiB" | "8GiB" | "16GiB" | "32GiB"
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
  async (event) => {
    // Grab the current value of what was written to the Realtime Database.
    const data = event.data.val();
    const roomId = event.params.roomId;
    const messageId = event.params.messageId;
    console.log("roomId: ", roomId, ", messageId: ", messageId, ", data: ", data);

    await sendChatMessages(roomId, messageId, data);
  },
);

exports.pushNotificationOnData = onValueCreated({
  ref: "data/{dataId}",
}, async (event) => {
  console.log("pushNotificationOnData() begins;", event);

  const data = event.data.val();
  const dataId = event.params.dataId;
  console.log("dataId: ", dataId, ", data: ", data);
  await notifyCategorySubscribers(data.category, dataId, data);
});


exports.pushNotificationOnComment = onValueCreated({
  ref: "comment/{commentId}",
}, async (event) => {
  console.log("pushNotificationOnComment() begins;", event);
  // TODO push notifications on comment
});

exports.pushNotificationOnLike = onValueCreated({
  ref: "like/{likeId}",
}, async (event) => {
  console.log("pushNotificationOnLike() begins;", event);
});


/**
 * Returns the FCM tokens of the users.
 *
 * @param {string | string[]} uids The user UIDs. It can be a single UID or an array of UIDs.
 * @return {Promise<string[]>} returnx
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
};

/**
 * Returns the user ids of the chat room users.
 *
 * @param {string} roomId The room id
 * @return {Promise<string[]>} returns the user ids of the chat room users.
 */
const getChatRoomUsers = async (roomId) => {
  const snapshot = await admin.database().ref("chat/rooms").child(roomId).child("users").get();
  const userMap = snapshot.val();
  const uids = Object.keys(userMap);
  return uids;
};

// TODO: How can we organize CHAT and DATA SUBSCRIPTION push notifications

const notifyCategorySubscribers = async (category, dataId, data) => {
  // Get all users subscribed to the category
  const subscribedUsers = await getSubscribedUids(category);
  if (debugLog) console.log("subscribedUsers: ", subscribedUsers);

  // Get the tokens of the users
  const tokens = await getUserTokens(subscribedUsers);
  if (debugLog) console.log("tokens: ", tokens);

  // TODO prepare payload data
  const title = data.title || "A new notification";
  const body = data.content || "...";
  // TODO review the image URL
  // TODO review if We can also put the image of the user instead.
  let imageUrl = "";
  if (data.urls && data.urls.length > 0) {
    imageUrl = data.urls[0];
  }
  const sound = data.notification_sound || "";

  // TODO: support it works with FlutterFlow
  const parameterData = data.parameter_data || "";
  // TODO: support it works with FlutterFlow
  const initialPageName = data.initial_page_name || "";

  // Batch them
  const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);

  // Send Notification
  await sendPushNotifications(messageBatches, "/data/" + dataId);
};


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
 * @return {Array} returns the message batches
 */
const getPayloads = (tokensArr, title, body, imageUrl, sound, parameterData, initialPageName) => {
  const messageBatches = [];
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
        parameterData,
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
};


/**
 * Send messages to the users when there is a new message in the chat room.
 *
 * @param {*} roomId the chat room id
 * @param {*} messageId the chat message id
 * @param {*} data the chat message data
 */
const sendChatMessages = async (roomId, messageId, data) => {
  console.log("sendChatMessages:: ", roomId, messageId, data);

  const uids = await getChatRoomUsers(roomId);

  // In chat messages, the user must be subscribed.
  // When `fcm-subscriptions/{room-id}/{myUid}` is null, it means
  // that the user is subscribed, otherwise, the user should not
  // receive the notificaiton

  // get unsubscribeds
  const unsubscribedUids = await getUnsubscribedUids(roomId);
  if (debugLog) console.log("unsubscribeds: ", unsubscribedUids);
  if (debugLog) console.log("unsubscribeds (roomId): ", roomId);

  // remove unsubscribed users
  const subscribedUids = uids.filter((item) => !unsubscribedUids.includes(item));

  const tokens = await getUserTokens(subscribedUids);

  if (debugLog) console.log("tokens: ", tokens);

  const isSingleChat = roomId.indexOf("---") >= 0;
  const groupChat = !isSingleChat;


  // const notificationData = data;
  let title = data.displayName || "Unknown user";
  if (groupChat) {
    // get chat room name
    const snapshot = await admin.database().ref("chat/rooms").child(roomId).child("name").get();
    // append chat room name to the title
    title += " (" + (snapshot.val() || "Group Chat") + ")";
  }
  const body = data.text || "...";
  // (1) if the url is an image, then apply it to the imageUrl. (2) if there is not url, then apply user's photoUrl.
  const imageUrl = data.url || data.photourl || "";
  const sound = data.notification_sound || "";

  // TODO: support it works with FlutterFlow
  const parameterData = data.parameter_data || "";
  // TODO: support it works with FlutterFlow
  const initialPageName = data.initial_page_name || "";

  const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);
  await sendPushNotifications(messageBatches, "/chat/rooms/" + roomId + "/messages/" + messageId);
};

/**
 * Gets the subscribed users from the subscriptionId
 * @param {string} subscriptionId of the room
 * @return {string} array of string
 */
const getSubscribedUids = async (subscriptionId) => {
  const snapshot = await admin.database().ref("fcm-subscriptions").child(subscriptionId).get();
  const subscribed = snapshot.val();
  if (subscribed) {
    const uids = Object.keys(subscribed);
    return uids;
  }
  return [];
};

/**
 * TODO review
 * Gets the unsubscribed users from the room id
 * This is for reversed.
 * This is really the same with `getSubscribedUids` func.
 * NOTE that some subscription is reversed
 *
 * @param {roomId} subscriptionId of the room
 * @return {string} array of string
 */
const getUnsubscribedUids = async (subscriptionId) => {
  const snapshot = await admin.database().ref("fcm-subscriptions").child(subscriptionId).get();
  const unsubscribed = snapshot.val();
  if (unsubscribed) {
    const uids = Object.keys(unsubscribed);
    return uids;
  }
  return [];
};

/**
 * Send push notifications to the users.
 *
 * @param {*} messageBatches the message batches of the payload
 * @param {*} id the id
 */
const sendPushNotifications = async (messageBatches, id) => {
  let numSent = 0;
  let numFailed = 0;

  const ref = admin.database().ref("fcm-results").push();
  const beforeLogData = {
    id,
    status: "started",
    startedAt: new Date().toISOString(),
  };
  if (debugLog) console.log(beforeLogData);
  await ref.set(beforeLogData);

  await Promise.all(
    messageBatches.map(async (messages) => {
      if (debugLog) {
        console.log("sendPushNotifications():", messages.tokens.length, "messages to send");
        console.log(messages);
      }
      const response = await admin.messaging().sendEachForMulticast(messages);
      numSent += response.successCount;
      numFailed += response.failureCount;
    }),
  );

  const afterLogData = {
    status: "finished",
    num_sent: numSent,
    num_failed: numFailed,
    finishedAt: new Date().toISOString(),
  };
  if (debugLog) console.log(afterLogData);
  await ref.update(afterLogData);
};


exports.getChatRoomUsers = getChatRoomUsers;
exports.getUserTokens = getUserTokens;
exports.sendChatMessages = sendChatMessages;
exports.getPayloads = getPayloads;
exports.getUnsubscribedUids = getUnsubscribedUids;
exports.getSubscribedUids = getSubscribedUids;
exports.sendPushNotifications = sendPushNotifications;


