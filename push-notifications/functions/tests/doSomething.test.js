
const admin = require("firebase-admin");
const func = require('../index');


admin.initializeApp({
    databaseURL: "https://withcenter-test-4-default-rtdb.firebaseio.com"
});

func.doSomething('uid-from-node', { name: 'name-from-node' }).then(() => {
    console.log('done');
}).catch((err) => {
    console.error(err);
});


// TEST Producdure
// (1) Write 'mirrorFcmTokens' - to sync the user's push tokens to the /mirrored-fcm-tokens/push-tokens/{uid}

// Prepare the test environment
// (2) Send messages based on the list of uids.
