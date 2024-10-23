const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");

exports.createEmailPasswordAccount = onCall(async (request) => {
    const result = await this.createUser(request.data);
    if (typeof result === "object" && result.uid) {
        return result;
    } else {
        throw new HttpsError("internal", result);
    }
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
        return { code: 'invalid-email', message: 'The function must be called with "email" containing the user\'s email address.' };
    }
    // Checking password.
    if (!(typeof password === "string") || email.length < 6) {
        return { code: 'invalid-password', message: 'The function must be called with "password" containing the user\'s password longer than 5 characters.' };
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
        return { code: error.code, message: error.message };
    }
}
