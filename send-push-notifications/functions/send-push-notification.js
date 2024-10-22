
const admin = require("firebase-admin");
const { getPayloads, sendPushNotifications } = require(".");
admin.initializeApp({
    databaseURL: 'https://withcenter-test-4-default-rtdb.firebaseio.com',
});

// console.log(admin.apps);



// console.log(admin.database().refFromURL());


const messageBatches = getPayloads([
    'dV9IpnMaik5nrShSu7pNis:APA91bGOPjbh8gD6EmLs-1FwiM-1gTaPR3h014bFkjP-q1PDYgtssnk-zjsPj-w98Cy0CK2O3MBGMHZgrFtQoX8E9TZRrKJ0hGAaQIT8iT8r8_4HYLfk-O3O32zyQvVPC2chDR3MB9Rt',
], 'title', 'body', 'imageUrl', 'sound', 'parameterData', 'initialPageName');

console.log(messageBatches);

sendPushNotifications(messageBatches, 'test');