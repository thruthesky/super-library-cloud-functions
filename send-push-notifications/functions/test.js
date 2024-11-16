const admin = require("firebase-admin");
const {
  getChatRoomUsers,
  getUserTokens,
  getPayloads,
  getUnsubscribedUids,
  sendPushNotifications,
  getAncestorKeys,
  getUidsOfCommentKeys,
} = require(".");
const { describe, test, it } = require("node:test");
const assert = require("assert");


const tokens = {
  // 'S6lXfLJErXQLQUvXcmu9d8wbJ6D3': [
  //     'dV9IpnMaik5nrShSu7pNis:APA91bGOPjbh8gD6EmLs-1FwiM-1gTaPR3h014bFkjP-q1PDYgtssnk-zjsPj-w98Cy0CK2O3MBGMHZgrFtQoX8E9TZRrKJ0hGAaQIT8iT8r8_4HYLfk-O3O32zyQvVPC2chDR3MB9Rt',
  //     '--wrong-token--',
  // ],
  // cvA9UISJHkavljsyxfa_81:APA91bHhuCUPJqp24d2vIO84-K-TtI_mi0f23oxxyDj9MbNQsD8nyG1r7ices7_IpcSA-y1uwucY3eodLOP_jaSYcjwTcR7teTMq0rO3dMjoeXM_8Pcb2znjFNratoFDOqFRR5j3o2RR

  // 'S6lXfLJErXQLQUvXcmu9d8wbJ6D3': [
  //     'cvA9UISJHkavljsyxfa_81:APA91bHhuCUPJqp24d2vIO84-K-TtI_mi0f23oxxyDj9MbNQsD8nyG1r7ices7_IpcSA-y1uwucY3eodLOP_jaSYcjwTcR7teTMq0rO3dMjoeXM_8Pcb2znjFNratoFDOqFRR5j3o2RR',
  //     '--wrong-token--',
  // ],
  // fRrREMldj0MEiUhmHrerJD:APA91bGbkinE5WeDQIXPBRO-8npBTl-DDihfzrd_u0OkKQy3yLb1vaOG1-QkdGhXQBBij9EQ4SFGRjEqhrQa01ci_0zQUNJHFemkVESnXxM-s1prColC0ptnXHmBYg1W4FWwZYuTrygW
  "IBEJHhvXStXSh68O7QjtPluLVSu2": [
    "eyVx20AdSPqc_TkZET6Pza:APA91bGt5iCZcB9NBtYiYQ6QZUk1IWOZbcyuLgOadOEe3TQ30_Wq5cISsk6V7dIbOSjC28Bu8N81m3UB5MDfqjW84NKhAF4PYnS7Yl_eo3EcdhCMveDcCJyn7_Di0hd_JikhZ3E-HKQU",
  ],
  "j76oLdb3OPgKdNydIklBDoZgIiQ2": [
    "errQJyxrO0lgtiBpIVLHoc:APA91bHYEDPdSOk9H5oZ6ywy3kXzCioLWTuU277e41eizKfG7abhfnG61dfFj5IpH2jNhthDI8EDuuebosIz5R7k9O4F1_9ysDUlm7TMNVvXPER05XQIKOonypmxcRhw7TtKfPtp7oJR",
    "--wrong-token--",
  ],
  // eyVx20AdSPqc_TkZET6Pza:APA91bGt5iCZcB9NBtYiYQ6QZUk1IWOZbcyuLgOadOEe3TQ30_Wq5cISsk6V7dIbOSjC28Bu8N81m3UB5MDfqjW84NKhAF4PYnS7Yl_eo3EcdhCMveDcCJyn7_Di0hd_JikhZ3E-HKQU

  "user-A": [
    "--wrong-token--1--",
    "--wrong-token--2--",
  ],
  "user-B": [
    "--wrong-token--3--",
    "--wrong-token--4--",
    "--wrong-token--B-5--",
  ],
};

const extraTokens = {
  "user-C": [
    "--wrong-token--5--",
    "--wrong-token--6--",
  ],
  "user-D": [
    "--wrong-token--7--",
    "--wrong-token--8--",
  ],
};


if (admin.apps.length === 0) {
  admin.initializeApp({
    databaseURL: "http://127.0.0.1:9000/?ns=withcenter-test-4-default-rtdb",
    projectId: "withcenter-test-4",
  });
}

// Utility function to wait for a specified number of milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function generateRandomFourDigitNumber() {
  const randomNum = Math.floor(Math.random() * 10000); // Generates a number from 0 to 9999
  return randomNum.toString().padStart(4, '0'); // Pads the number to ensure it's 4 digits
}


describe("sendChatMessages", () => {
  it("Should get chat room unnsubscribed users", async () => {
    const roomId = "group-chat" + (new Date).getTime();
    const unsubscribedUids = await getUnsubscribedUids(roomId);
    assert.deepStrictEqual(unsubscribedUids, []);
  });


  it("Should get chat room unnsubscribed users", async () => {
    // Prepare subscription
    const roomId = "group-chat" + (new Date).getTime();

    const uid1 = "user-A";
    const uid2 = "user-B";

    await admin.database().ref("fcm-subscriptions").child(roomId).child(uid1).set(true);
    await admin.database().ref("fcm-subscriptions").child(roomId).child(uid2).set(true);


    const unsubscribedUids = await getUnsubscribedUids(roomId);
    assert.deepStrictEqual(unsubscribedUids.sort(), [uid1, uid2].sort());
  });


  it("test filtering", async () => {
    // Prepare subscription
    const roomId = "group-chat" + (new Date).getTime();

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    // await admin.database().ref("fcm-subscriptions").child(roomId).child(uid1).set(true);
    // await admin.database().ref("fcm-subscriptions").child(roomId).child(uid2).set(true);
    await admin.database().ref("fcm-subscriptions").child(roomId).child(uid3).set(true);
    await admin.database().ref("fcm-subscriptions").child(roomId).child(uid4).set(true);

    const roomMembers = [uid1, uid2, uid3, uid4];

    const unsubscribedUids = await getUnsubscribedUids(roomId);

    const subscribedUids = roomMembers.filter((item) => !unsubscribedUids.includes(item));

    assert.deepStrictEqual(subscribedUids.sort(), [uid1, uid2].sort());
  });

  test("getting ancestorKeys 1", async () => {
    const ancestorKeys = await getAncestorKeys("comment-1");
    assert.deepStrictEqual(ancestorKeys, ["comment-1"]);
  });

  test("getting ancestorKeys 1", async () => {
    // Prepare

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const rootKey = "root-key";
    const comment1Key = "comment-1";
    const comment1_1Key = "comment-1-1";
    const comment1_1_1Key = "comment-1-1-1";
    const comment1_1_2Key = "comment-1-1-2";
    const comment1_1_3Key = "comment-1-1-3";
    const comment1_1_4Key = "comment-1-1-4";
    const comment1_1_4_1Key = "comment-1-1-4-1";
    const comment1_1_4_2Key = "comment-1-1-4-2";
    const comment1_1_5Key = "comment-1-1-5";
    const comment1_2Key = "comment-1-2";
    const comment2Key = "comment-2";
    const comment3Key = "comment-3";
    const comment4Key = "comment-4";
    const comment5Key = "comment-5";
    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });
    await admin.database().ref("comments").child(comment1Key).set({ rootKey });
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_4_1Key).set({ parentKey: comment1_1_4Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_4_2Key).set({ parentKey: comment1_1_4Key, rootKey });
    await admin.database().ref("comments").child(comment1_1_5Key).set({ parentKey: comment1_1Key, rootKey });
    await admin.database().ref("comments").child(comment1_2Key).set({ parentKey: comment1Key, rootKey });
    await admin.database().ref("comments").child(comment2Key).set({ rootKey });
    await admin.database().ref("comments").child(comment3Key).set({ rootKey });
    await admin.database().ref("comments").child(comment4Key).set({ rootKey });
    await admin.database().ref("comments").child(comment5Key).set({ rootKey });


    const ancestorKeys = await getAncestorKeys(comment1_1Key);
    assert.deepStrictEqual(ancestorKeys.sort(), [comment1_1Key, comment1Key].sort());

    const ancestorKeys2 = await getAncestorKeys(comment1_1_4Key);
    assert.deepStrictEqual(ancestorKeys2.sort(), [comment1_1_4Key, comment1_1Key, comment1Key].sort());

    // means no parent
    const ancestorKeys3 = await getAncestorKeys(null);
    assert.deepStrictEqual(ancestorKeys3, []);
  });

  it("getUidsOfCommentKeys", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    // Prepare
    const rootKey = "root-key";
    const comment1Key = "comment-1";
    const comment1_1Key = "comment-1-1";
    const comment1_1_1Key = "comment-1-1-1";
    const comment1_1_2Key = "comment-1-1-2";
    const comment1_1_3Key = "comment-1-1-3";
    const comment1_1_4Key = "comment-1-1-4";
    const comment1_1_4_1Key = "comment-1-1-4-1";
    const comment1_1_4_2Key = "comment-1-1-4-2";
    const comment1_1_5Key = "comment-1-1-5";
    const comment1_2Key = "comment-1-2";
    const comment2Key = "comment-2";
    const comment3Key = "comment-3";
    const comment4Key = "comment-4";
    const comment5Key = "comment-5";
    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey, uid: uid3 });
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey, uid: uid4 });
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey, uid: uid2 });
    await admin.database().ref("comments").child(comment1_1_4_1Key).set({ parentKey: comment1_1_4Key, rootKey, uid: uid3 });
    await admin.database().ref("comments").child(comment1_1_4_2Key).set({ parentKey: comment1_1_4Key, rootKey, uid: uid4 });
    await admin.database().ref("comments").child(comment1_1_5Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });
    await admin.database().ref("comments").child(comment1_2Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });
    await admin.database().ref("comments").child(comment2Key).set({ rootKey, uid: uid3 });
    await admin.database().ref("comments").child(comment3Key).set({ rootKey, uid: uid4 });
    await admin.database().ref("comments").child(comment4Key).set({ rootKey, uid: uid1 });
    await admin.database().ref("comments").child(comment5Key).set({ rootKey, uid: uid2 });


    const uids = await getUidsOfCommentKeys([comment1Key, comment1_1Key, comment1_1_1Key]);
    assert.deepStrictEqual(uids.sort(), [uid1, uid2, uid3].sort());


    const uids2 = await getUidsOfCommentKeys([comment1Key, comment1_1_3Key, comment1_1_5Key]);
    assert.deepStrictEqual(uids2.sort(), [uid1].sort());
  });

  test("should send messages", async () => {
    // Prepare: Add users into the chat room.
    const roomId = "group-chat" + (new Date).getTime();
    const messageId = "message-1";
    Object.keys(tokens).forEach(async (uid) => {
      await admin.database().ref("chat/rooms").child(roomId).child("users").child(uid).set(true);
    });
    Object.keys(extraTokens).forEach(async (uid) => {
      await admin.database().ref("chat/rooms").child("room-Extra").child("users").child(uid).set(true);
    });

    // Prepare: Add FCM tokens for the users in [tokens, extraTokens]
    Object.keys(tokens).forEach(async (uid) => {
      const userTokens = tokens[uid];
      userTokens.forEach(async (token) => {
        await admin.database().ref("mirrored-fcm-tokens").child(token).set(uid);
      });
    });
    Object.keys(extraTokens).forEach(async (uid) => {
      const userTokens = extraTokens[uid];
      userTokens.forEach(async (token) => {
        await admin.database().ref("mirrored-fcm-tokens").child(token).set(uid);
      });
    });


    // Test parts: get users of the chat room
    const uids = await getChatRoomUsers(roomId);
    assert.deepStrictEqual(uids, Object.keys(tokens));


    // Test parts: ge the tokens of the users
    const aTokens = await getUserTokens("user-A");
    assert.deepStrictEqual(aTokens, [
      "--wrong-token--1--",
      "--wrong-token--2--",
    ]);
    const bTokens = await getUserTokens("user-B");
    assert.deepStrictEqual(bTokens, [
      "--wrong-token--3--",
      "--wrong-token--4--",
      "--wrong-token--B-5--",
    ]);

    // Get all the tokens of the users in the chat room.
    const allTokens = await getUserTokens(uids);
    // Get all the values of the keys in the tokens into an array
    const allTokensValues = [];
    Object.keys(tokens).forEach((uid) => {
      allTokensValues.push(...tokens[uid]);
    });

    // Test allTokens and allTokensValues. Both of the are arrays. Test if they have the same values.
    assert.deepStrictEqual(allTokens.sort(), allTokensValues.sort());


    // TODO: do the `getPayloads` message tests;
    // `const messageBatches = getPayloads(tokens, title, body, imageUrl, sound, parameterData, initialPageName);`


    const messageBatches = getPayloads(allTokensValues, "title", "body", "imageUrl", "sound", "parameterData", "initialPageName");

    // Check the batch count in index if failing
    assert(messageBatches.length == 1);


    await sendPushNotifications(messageBatches, "/chat/rooms/" + roomId + "/messages/" + messageId);


    // const data = {
    //     senderUid: 'abc',
    //     text: "Hello, world! - 34",
    // };
    // await sendChatMessages(roomId, messageId, data);
  });

  it("comment test No Push Notification for myself", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";

    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });


    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });

    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(3000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1Key).get();

    console.log("RESUUUULT!", result.val());
    // No notification since I own both Data and Comment
    assert.equal(Object.keys(result.val() || {}).length, 0);

  });
  it("comment test Push Notification on commenter", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";

    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });


    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid3 });

    await admin.database().ref("comments").child(comment1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });

    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(8000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1_1Key).get();

    console.log("RESUUUULT!", result.val());

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Must send notification to uid-A as data owner (2 tokens), and uid-C (2 tokens), not including uid-B (3 tokens)
    assert.equal(numFailed + numSent, 4);

  });


  it("comment test Data Owner must be notified", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";

    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });


    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid2 });


    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(8000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1Key).get();

    console.log("RESUUUULT!", result.val());

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Must send notification to uid-A (2 tokens), not including uid-B (3 tokens)
    assert.equal(numFailed + numSent, 2);

  });


  it("comment test 3", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";
    const comment1_1_1Key = randomNum + "comment-1-1-1";
    const comment1_1_2Key = randomNum + "comment-1-1-2";
    const comment1_1_3Key = randomNum + "comment-1-1-3";
    const comment1_1_4Key = randomNum + "comment-1-1-4";

    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });

    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });

    await admin.database().ref("comments").child(comment1_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey, uid: uid3 });

    await admin.database().ref("comments").child(comment1_1_2Key).remove();
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey, uid: uid4 });

    await admin.database().ref("comments").child(comment1_1_3Key).remove();
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1_4Key).remove();
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey, uid: uid2 });

    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(3000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1_1_2Key).get();

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Should notify uid-A (2 tokens) and uid-B (3 tokens), not including uid-D (2 tokens)
    // Total expected is 5 tokens
    assert.equal(numFailed + numSent, 5);
  });


  it("comment test 4", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";
    const comment1_1_1Key = randomNum + "comment-1-1-1";
    const comment1_1_2Key = randomNum + "comment-1-1-2";
    const comment1_1_3Key = randomNum + "comment-1-1-3";
    const comment1_1_4Key = randomNum + "comment-1-1-4";
    const comment1_1_2_1Key = randomNum + "comment-1-1-2-1";

    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });

    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });

    await admin.database().ref("comments").child(comment1_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey, uid: uid3 });

    await admin.database().ref("comments").child(comment1_1_2Key).remove();
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey, uid: uid4 });

    await admin.database().ref("comments").child(comment1_1_3Key).remove();
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1_4Key).remove();
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey, uid: uid2 });


    await admin.database().ref("comments").child(comment1_1_2_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1Key).set({ parentKey: comment1_1_2Key, rootKey, uid: uid3 });



    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(3000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1_1_2_1Key).get();

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Should notify uid-A (2 tokens), uid-B (3 tokens), and uid-D (2 tokens), not including uid-C (2-tokens)
    // Total expected is 7 tokens
    assert.equal(numFailed + numSent, 7);
  });


  it("comment test 5", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";
    const comment1_1_1Key = randomNum + "comment-1-1-1";
    const comment1_1_2Key = randomNum + "comment-1-1-2";
    const comment1_1_3Key = randomNum + "comment-1-1-3";
    const comment1_1_4Key = randomNum + "comment-1-1-4";
    const comment1_1_2_1Key = randomNum + "comment-1-1-2-1";
    const comment1_1_2_1_1Key = randomNum + "comment-1-1-2-1-1";


    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });

    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });

    await admin.database().ref("comments").child(comment1_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey, uid: uid3 });

    await admin.database().ref("comments").child(comment1_1_2Key).remove();
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey, uid: uid4 });

    await admin.database().ref("comments").child(comment1_1_3Key).remove();
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1_4Key).remove();
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey, uid: uid2 });


    await admin.database().ref("comments").child(comment1_1_2_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1Key).set({ parentKey: comment1_1_2Key, rootKey, uid: uid3 });


    await admin.database().ref("comments").child(comment1_1_2_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1_1Key).set({ parentKey: comment1_1_2_1Key, rootKey, uid: uid2 });



    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(3000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1_1_2_1_1Key).get();

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Should notify uid-A (2 tokens), uid-C (2 tokens), and uid-D (2 tokens), not including uid-B (3-tokens)
    // Total expected is 6 tokens
    assert.equal(numFailed + numSent, 6);
  });


  it("comment test 6", async () => {

    const uid1 = "user-A";
    const uid2 = "user-B";
    const uid3 = "user-C";
    const uid4 = "user-D";

    const randomNum = generateRandomFourDigitNumber();


    // Prepare
    const rootKey = randomNum + "root-key_12";
    const comment1Key = randomNum + "comment-1";
    const comment1_1Key = randomNum + "comment-1-1";
    const comment1_1_1Key = randomNum + "comment-1-1-1";
    const comment1_1_2Key = randomNum + "comment-1-1-2";
    const comment1_1_3Key = randomNum + "comment-1-1-3";
    const comment1_1_4Key = randomNum + "comment-1-1-4";
    const comment1_1_2_1Key = randomNum + "comment-1-1-2-1";
    const comment1_1_2_1_1Key = randomNum + "comment-1-1-2-1-1";
    const comment1_1_2_1_1_1Key = randomNum + "comment-1-1-2-1-1-1";




    await admin.database().ref("data").child(rootKey).set({
      content: "test", uid: uid1, category: "test"
    });

    await admin.database().ref("comments").child(comment1Key).remove();
    await admin.database().ref("comments").child(comment1Key).set({ rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1Key).set({ parentKey: comment1Key, rootKey, uid: uid2 });

    await admin.database().ref("comments").child(comment1_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_1Key).set({ parentKey: comment1_1Key, rootKey, uid: uid3 });

    await admin.database().ref("comments").child(comment1_1_2Key).remove();
    await admin.database().ref("comments").child(comment1_1_2Key).set({ parentKey: comment1_1Key, rootKey, uid: uid4 });

    await admin.database().ref("comments").child(comment1_1_3Key).remove();
    await admin.database().ref("comments").child(comment1_1_3Key).set({ parentKey: comment1_1Key, rootKey, uid: uid1 });

    await admin.database().ref("comments").child(comment1_1_4Key).remove();
    await admin.database().ref("comments").child(comment1_1_4Key).set({ parentKey: comment1_1Key, rootKey, uid: uid2 });


    await admin.database().ref("comments").child(comment1_1_2_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1Key).set({ parentKey: comment1_1_2Key, rootKey, uid: uid3 });


    await admin.database().ref("comments").child(comment1_1_2_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1_1Key).set({ parentKey: comment1_1_2_1Key, rootKey, uid: uid2 });


    await admin.database().ref("comments").child(comment1_1_2_1_1_1Key).remove();
    await admin.database().ref("comments").child(comment1_1_2_1_1_1Key).set({ parentKey: comment1_1_2_1_1Key, rootKey, uid: uid1 });

    // check if there is a push notification sent

    // Wait for 3 seconds
    await wait(3000);

    const result = await admin.database().ref("fcm-results").orderByChild("id").equalTo("/comments/" + comment1_1_2_1_1_1Key).get();

    // Access the first object in the data (since there's only one key)
    const firstResult = Object.values(result.val())[0];

    // Access the num_failed property of the first object
    const numFailed = firstResult.num_failed;
    const numSent = firstResult.num_sent;

    // Should notify uid-B (3-tokens), uid-C (2 tokens), and uid-D (2 tokens), not including uid-A (2 tokens)
    // Total expected is 7 tokens
    assert.equal(numFailed + numSent, 7);
  });
});


