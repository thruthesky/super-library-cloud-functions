

const admin = require("firebase-admin");
const {
  getChatRoomUsers,
  getUserTokens,
  getPayloads,
  getUnsubscribedUids,
  sendPushNotifications,
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
    assert(messageBatches.length == 3);


    await sendPushNotifications(messageBatches, "/chat/rooms/" + roomId + "/messages/" + messageId);


    // const data = {
    //     senderUid: 'abc',
    //     text: "Hello, world! - 34",
    // };
    // await sendChatMessages(roomId, messageId, data);
  });
});


