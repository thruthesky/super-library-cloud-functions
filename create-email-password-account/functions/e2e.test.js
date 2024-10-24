/**
 * To run this test
 * 
 * - Save the `GOOGLE_APPLICATION_CREDENTIALS` environment variable.
 * - Run the emulator with Functions (without Authentication & Firestore)
 * - Run this script using `node --test e2e.test.js`
 * 
 * Note that,
 * - The account will be created in the remote Firebase project since there is no Authentication emulator.
 */
const admin = require("firebase-admin");
const functionTest = require('firebase-functions-test')();
// after firebase-functions-test has been initialized
const indexjs = require('.'); // relative path to functions code

const { describe, test } = require("node:test");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

describe('Create account test', () => {
    test('Success test: input data test', async () => {
        const wrapped = functionTest.wrap(indexjs.createEmailPasswordAccount);
        try {
            const re = await wrapped({
                data: {
                    email: 'e2e-test@email.com',
                    password: '12,*W45a',
                },
            });
            console.log(re);
        } catch (error) {
            console.log(error);
        }
    });
});
