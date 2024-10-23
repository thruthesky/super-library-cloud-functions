/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");

exports.createEmailPasswordAccount = onCall(async (request) => {

    console.log(request);

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
 * If there is an error, it returns the error string. It does not throw an Exception.
 */
exports.createUser = async (data) => {


    // Data from client call.
    const email = data.email || "";
    const password = data.password || "";

    // Checking email.
    if (!(typeof email === "string") || email.length === 0) {
        return 'email-is-empty: The function must be called with "email" containing the user\'s email address.';
    }
    // Checking password.
    if (!(typeof password === "string") || email.length < 6) {
        return 'The function must be called with "password" containing the user\'s password longer than 5 characters.';
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
        return error.code + ': ' + error.message;
    }

}
