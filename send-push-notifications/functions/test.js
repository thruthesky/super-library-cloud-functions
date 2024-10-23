


const admin = require("firebase-admin");
const { sendChatMessages, getChatRoomUsers, getUserTokens, getPayloads, sendPushNotifications } = require(".");
const { describe, test, after } = require("node:test");
const assert = require("assert");



const tokens = {
    // 'S6lXfLJErXQLQUvXcmu9d8wbJ6D3': [
    //     'dV9IpnMaik5nrShSu7pNis:APA91bGOPjbh8gD6EmLs-1FwiM-1gTaPR3h014bFkjP-q1PDYgtssnk-zjsPj-w98Cy0CK2O3MBGMHZgrFtQoX8E9TZRrKJ0hGAaQIT8iT8r8_4HYLfk-O3O32zyQvVPC2chDR3MB9Rt',
    //     '--wrong-token--',
    // ],
    // cvA9UISJHkavljsyxfa_81:APA91bHhuCUPJqp24d2vIO84-K-TtI_mi0f23oxxyDj9MbNQsD8nyG1r7ices7_IpcSA-y1uwucY3eodLOP_jaSYcjwTcR7teTMq0rO3dMjoeXM_8Pcb2znjFNratoFDOqFRR5j3o2RR

    'S6lXfLJErXQLQUvXcmu9d8wbJ6D3': [
        'cvA9UISJHkavljsyxfa_81:APA91bHhuCUPJqp24d2vIO84-K-TtI_mi0f23oxxyDj9MbNQsD8nyG1r7ices7_IpcSA-y1uwucY3eodLOP_jaSYcjwTcR7teTMq0rO3dMjoeXM_8Pcb2znjFNratoFDOqFRR5j3o2RR',
        '--wrong-token--',
    ],
    'user-A': [
        '--wrong-token--1--',
        '--wrong-token--2--',
    ],
    'user-B': [
        '--wrong-token--3--',
        '--wrong-token--4--',
        '--wrong-token--B-5--',
    ],
};

const extraTokens = {
    'user-C': [
        '--wrong-token--5--',
        '--wrong-token--6--',
    ],
    'user-D': [
        '--wrong-token--7--',
        '--wrong-token--8--',
    ],
};


if (admin.apps.length === 0) {
    admin.initializeApp({
        databaseURL: 'http://127.0.0.1:9000/?ns=withcenter-test-4-default-rtdb',
    });
}


describe("sendChatMessages", () => {


    test("should send messages", async () => {
        // Prepare: Add users into the chat room.
        const roomId = "group-chat" + (new Date).getTime();
        const messageId = "message-1";
        Object.keys(tokens).forEach(async (uid) => {
            await admin.database().ref("chat/rooms").child(roomId).child('users').child(uid).set(true);
        });
        Object.keys(extraTokens).forEach(async (uid) => {
            await admin.database().ref("chat/rooms").child('room-Extra').child('users').child(uid).set(true);
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
        const aTokens = await getUserTokens('user-A');
        assert.deepStrictEqual(aTokens, [
            '--wrong-token--1--',
            '--wrong-token--2--',
        ]);
        const bTokens = await getUserTokens('user-B');
        assert.deepStrictEqual(bTokens, [
            '--wrong-token--3--',
            '--wrong-token--4--',
            '--wrong-token--B-5--',
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


        const messageBatches = getPayloads(allTokensValues, 'title', 'body', 'imageUrl', 'sound', 'parameterData', 'initialPageName');
        assert(messageBatches.length == 3);


        await sendPushNotifications(messageBatches, '/chat/rooms/' + roomId + '/messages/' + messageId);



        // const data = {
        //     senderUid: 'abc',
        //     text: "Hello, world! - 34",
        // };
        // await sendChatMessages(roomId, messageId, data);
    });
});


















