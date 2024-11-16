/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onValueCreated } = require("firebase-functions/v2/database");
const { defineString } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");

const admin = require("firebase-admin");

// Region
// You may not need to set the region by defining it here.
// For FlutterFlow, the region is set in the FlutterFlow UI.
// For Deploying from CLI, you can set the region with the [defineString].
//
// const region = "asia-southeast1";


// Get the region from the user and set it as a global option
setGlobalOptions({
  region: defineString("REGION"),
});

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// FOR TESTING
// if (admin.apps.length === 0) {
//   admin.initializeApp({
//     databaseURL: "http://127.0.0.1:9000/?ns=withcenter-test-4-default-rtdb",
//     projectId: "withcenter-test-4",
//   });
// }

// 500 is good for the production. 3 is good for the testing.
const batchCount = 500;
const debugLog = true;


// Initialize Firebase app
// admin.initializeApp();

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
    // region: region,

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
  ref: "data/{dataKey}",
  // region: region,
}, async (event) => {
  console.log("pushNotificationOnData() begins;", event);

  const data = event.data.val();
  const dataKey = event.params.dataKey;
  console.log("dataKey: ", dataKey, ", data: ", data);
  await notifyDataCategorySubscribers(dataKey, data);
});

// TODO cleanup
// exports.pushNotificationOnComment = onValueCreated({
//   ref: "comment/{commentId}",
//   // region: region,
// }, async (event) => {
//   console.log("pushNotificationOnComment() begins;", event);

//   const data = event.data.val();
//   const dataKey = event.params.dataKey;
//   console.log("dataKey: ", dataKey, ", data: ", data);

//   // TODO Continue from here when comment data structure is ready
//   // await notifyParentCommentersAndOwnerOfData(dataKey, data);
// });

exports.pushNotificationOnComment = onValueCreated({
  ref: "comments/{commentId}",
  // region: region,
}, async (event) => {
  console.log("pushNotificationOnComment() begins;", event);

  const data = event.data.val();
  const commentId = event.params.commentId;
  console.log("commentId: ", commentId, ", data: ", data);

  await notifyParentCommentersAndOwnerOfData(commentId, data);
});

exports.pushNotificationOnLike = onValueCreated({
  ref: "like/{likeId}",
  // region: region,
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
  if (!uids) return [];
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

const notifyParentCommentersAndOwnerOfData = async (commentId, data) => {

  // Using individual properties from 'data'
  const rootKey = data.rootKey;
  const parentKey = data.parentKey;
  const uid = data.uid;
  const content = data.content;
  const notification_sound = data.notification_sound;
  const urls = data.urls;

  // Get the parent's parent's parent's... keys (ancestor keys)
  const ancestorKeys = await getAncestorKeys(parentKey);

  // Get the data owner UID, if rootKey exists
  const dataOwnerUid = rootKey ? (await admin.database().ref("data").child(rootKey).child("uid").get()).val() : "";

  // Get the uids of the ancestor keys and user tokens
  const uidsToNotify = [...new Set((await getUidsOfCommentKeys(ancestorKeys))
    .filter(uidInArray => uidInArray !== uid))];

  const userTokensPromises = uidsToNotify.map(getUserTokens);

  // Fetch tokens for data owner and commenters
  const allTokens = await Promise.all([
    getUserTokens(dataOwnerUid != uid ? dataOwnerUid : ""),
    ...userTokensPromises,
  ]).then(tokens => tokens.flat())                            // Flatten the array
    .then(flattenedTokens => [...new Set(flattenedTokens)]);  // Remove duplicates using Set

  if (!allTokens.length) {
    if (debugLog) console.log("No tokens found for commenter:", allTokens);
    return;
  }

  if (debugLog) console.log("TOKENS! commenter:", allTokens);

  // Get commenter name, fallback to "Someone"
  const commenterName = uid ? (await admin.database().ref("users").child(uid).child("displayName").get()).val() || "Someone" : "Someone";

  // Prepare notification data
  const title = `${commenterName} commented on your post`.substring(0, 100);
  const body = (content || "...").substring(0, 100);
  const imageUrl = urls?.[0] || ""; // Use the first URL, if exists
  const sound = notification_sound || "";
  const category = rootKey ? (await admin.database().ref("data").child(rootKey).child("category").get()).val() : "";

  const parameterData = JSON.stringify({ category, rootKey });
  const initialPageName = "DataDetailScreen";

  // Prepare notification payloads
  const messageBatches = getPayloads(allTokens, title, body, imageUrl, sound, parameterData, initialPageName);

  // Send the notifications
  await sendPushNotifications(messageBatches, `/comments/${commentId}`);

}




/**
 * Gets the parent's parent's parent's... key, a.k.a. ancestor keys
 * @param {*} parentKey the parent key
 * @return {Promise<string[]>} array of string
 */
const getAncestorKeys = async (parentKey) => {
  const ancestorKeys = [];
  let _parentKey = parentKey;
  while (_parentKey != null) {
    ancestorKeys.push(_parentKey);
    console.log("parentKey: ", _parentKey);
    // get parent key one by one
    const parentKeySnapshot = await admin.database().ref("comments").child(_parentKey).child("parentKey").get();
    _parentKey = parentKeySnapshot.val();
  }
  return ancestorKeys;
};

// TODO test
const getUidsOfCommentKeys = async (commentKeys) => {
  const uidPromises = commentKeys.map(async (commentKey) => {
    const uidSnapshot = await admin.database().ref("comments").child(commentKey).child("uid").get();
    return uidSnapshot.val();
  });

  // Wait for all promises to resolve and gather the results
  return Array.from(new Set(await Promise.all(uidPromises)));
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
  // Note that if the value is false, then the user didn't accept the invitation. Do we need to consider this?
  const uids = Object.keys(userMap);
  return uids;
};

// TODO: How can we organize CHAT and DATA SUBSCRIPTION push notifications

const notifyDataCategorySubscribers = async (dataKey, data) => {
  const category = data.category;
  // Get all users subscribed to the category
  const subscribedUsers = await getSubscribedUids(category);
  if (debugLog) console.log("subscribedUsers: ", subscribedUsers);

  // Get the tokens of the users
  const tokens = await getUserTokens(subscribedUsers);
  if (debugLog) console.log("tokens: ", tokens);

  //
  const title = (data.title || "A new notification").substring(0, 100);
  const body = (data.content || "...").substring(0, 100);
  // TODO: Add user's profile photo url if there is no image url.
  // TODO: what if the urls[0] is not an image?
  let imageUrl = "";
  if (data.urls && data.urls.length > 0) {
    imageUrl = data.urls[0];
  }
  const sound = data.notification_sound || "";

  const parameterData = JSON.stringify({ category, dataKey });
  const initialPageName = "DataDetailScreen";


  // Batch them
  const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);

  // Send Notification
  await sendPushNotifications(messageBatches, "/data/" + dataKey);
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

  const senderUid = data.uid;
  if (debugLog) console.log("senderUid: ", senderUid);

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

  // get index of senderUid to remove the sender UId
  const senderUidIndex = subscribedUids.indexOf(senderUid);

  // only splice array when item is found
  // 2nd parameter means remove one item only
  if (senderUidIndex > -1) subscribedUids.splice(senderUidIndex, 1);

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

  const parameterData = JSON.stringify({ roomId, messageId });
  const initialPageName = "ChatRoomScreen";

  const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);
  await sendPushNotifications(messageBatches, "/chat/rooms/" + roomId + "/messages/" + messageId);
};

/**
 * Gets the subscribed users from the subscriptionId
 * @param {string} subscriptionId of the room
 * @return {*} array of string
 */
const getSubscribedUids = async (subscriptionId) => {
  const snapshot = await admin.database().ref("fcm-subscriptions").child(subscriptionId).get();
  return snapshot.exists() ? Object.keys(snapshot.val()) : [];
};

/**
 * Gets the unsubscribed users from the room id
 * This is for reversed.
 * This is really the same with `getSubscribedUids` func.
 * NOTE that some subscription is reversed
 *
 * @param {roomId} subscriptionId of the room
 * @return {*} array of string
 */
const getUnsubscribedUids = async (subscriptionId) => {
  return await getSubscribedUids(subscriptionId);
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
exports.notifyDataCategorySubscribers = notifyDataCategorySubscribers;
exports.notifyParentCommentersAndOwnerOfData = notifyParentCommentersAndOwnerOfData;
exports.getAncestorKeys = getAncestorKeys;
exports.getUidsOfCommentKeys = getUidsOfCommentKeys;
exports.getUserTokens = getUserTokens;
exports.sendChatMessages = sendChatMessages;
exports.getPayloads = getPayloads;
exports.getUnsubscribedUids = getUnsubscribedUids;
exports.getSubscribedUids = getSubscribedUids;
exports.sendPushNotifications = sendPushNotifications;


