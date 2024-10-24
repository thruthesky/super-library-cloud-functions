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
const assert = require("assert");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

describe('Create account test', () => {
    test('Success test: create account', async () => {
        const wrapped = functionTest.wrap(indexjs.createEmailPasswordAccount);
        const re = await wrapped({
            data: {
                email: 'e2e-test' + (new Date).getTime() + '@email.com',
                password: '12,*W45a',
            },
        });
        assert(re.uid !== undefined);
    });

    test('Failure test: create an account that is alredy exists', async () => {
        const email = 'exist-e2e-test' + (new Date).getTime() + '@email.com';
        const wrapped = functionTest.wrap(indexjs.createEmailPasswordAccount);
        const re = await wrapped({
            data: {
                email,
                password: '12,*W45a',
            },
        });
        assert(re.uid !== undefined);

        const err = await wrapped({
            data: {
                email,
                password: '12,*W45a',
            },
        });
        assert(err.uid === undefined);
        assert(err.error === 'auth/email-already-exists');
    });
});



describe('FlutterFlow create account test', () => {

    test('Success test: create account', async () => {
        const email = 'flutterflow-e2e-test' + (new Date).getTime() + '@email.com';
        const wrapped = functionTest.wrap(indexjs.createFlutterFlowEmailPasswordAccount);
        const re = await wrapped({
            auth: {
                uid: 'my-uid',
            },
            data: {
                email,
                password: '12,*W45a',
            },
        });
        console.log(JSON.stringify(re));
        assert(re.error === undefined);
        assert(re.uid !== undefined);

        const snapshot = await getFirestore()
            .collection('users')
            .doc(re.uid)
            .get();

        const data = snapshot.data();
        console.log(JSON.stringify(data));
        assert(data.email === re.email);
        assert(data.uid === re.uid);
        assert(data.type === 'student');
        assert(data.guardians[0].path === getFirestore().collection('users').doc('my-uid').path);

        const snapshot2 = await getFirestore()
            .collection('users')
            .doc('my-uid')
            .get();

        const data2 = snapshot2.data();
        console.log(JSON.stringify(data2));
        assert(data2.type === 'guardian');


    });
});
