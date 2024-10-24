const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

exports.createEmailPasswordAccount = onCall(async (request) => {
    return await this.createUser(request.data);
});

exports.createFlutterFlowEmailPasswordAccount = onCall(async (request) => {
    if (request.auth === undefined || request.auth.uid === undefined) {
        return {
            error: 'unauthorized',
            message: 'The function must be called while the user is authenticated.'
        };
    }
    const re = await this.createUser(request.data);
    if (re.error) {
        return re;
    }
    return await this.createUserDocument({
        uid: re.uid,
        email: re.email,
        myUid: request.auth.uid,
    });
});


/**
 * Creates a user account
 * 
 * @param {*} data data that contains email and password.
 * @returns {*} returns the email and uid of the user.
 * If there is an error, it returns an object that has error code and message.
 */
exports.createUser = async (data) => {
    // Data from client call.
    const email = data.email || "";
    const password = data.password || "";

    // Checking email.
    if (!(typeof email === "string") || email.length === 0) {
        return {
            error: 'invalid-email',
            message: 'The function must be called with "email" containing the user\'s email address.'

        };
    }
    // Checking password.
    if (!(typeof password === "string") || email.length < 6) {
        return {
            error: 'invalid-password',
            message: 'The function must be called with "password" containing the user\'s password longer than 5 characters.'
        };
    }

    try {
        const userRecord = await getAuth()
            .createUser({
                email: email,
                emailVerified: false,
                password: password,
                disabled: false,
            });

        // returning result.
        return {
            'email': email,
            'uid': userRecord.uid,
        };
    } catch (error) {
        return { error: error.code, message: error.message };
    }
}


/**
 * Creates a user document in Firestore.
 * 
 * @param {*} data data that contains uid and email.
 * @returns {*} returns the email and uid of the user.
 * If there is an error, it returns an object that has error code and message.
 */
exports.createUserDocument = async (params) => {
    try {
        const uid = params.uid;
        const data = {
            email: params.email,
            display_name: '',
            photo_url: '',
            uid: uid,
            created_time: new Date(),
            type: 'student',
            guardians: [
                getFirestore().doc(`users/${params.myUid}`),
            ],
        };
        console.log('uid: ', JSON.stringify(uid));
        console.log('data: ', JSON.stringify(data));
        await getFirestore()
            .collection('users')
            .doc(uid)
            .set(data);

        await getFirestore()
            .collection('users')
            .doc(params.myUid)
            .set({
                type: 'guardian',
            }, { merge: true });



        // returning result.
        return params;
    } catch (error) {
        return { error: error.code, message: error.message };
    }
}
