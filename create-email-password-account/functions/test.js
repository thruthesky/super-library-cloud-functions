
const admin = require("firebase-admin");
const { createUser, createUserDocument } = require(".");
const { describe, test } = require("node:test");
const assert = require("assert");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();
const password = '12W45a,*u';

describe('Create account test', () => {
    test('Failure test: input data test', async () => {
        const re = await createUser({ email: '', password });
        assert(re.error === 'invalid-email');
    });
    test('Success test: create account', async () => {
        const re = await createUser(
            { email: 'test-email' + (new Date).getTime() + '@test.com', password }
        );
        console.log(JSON.stringify(re));
        assert(re.uid);
    });
    test('Failure test: create account that is already exists.', async () => {
        const email = 'test-exist-' + (new Date).getTime() + '@test.com';
        const re = await createUser({ email, password });
        assert(re.uid);

        const e = await createUser({ email, password });
        console.log(JSON.stringify(e));
        assert(e.error === 'auth/email-already-exists');
    });
});

describe('Create flutterflow account test', () => {
    test('Success test: create account and firestore document', async () => {
        const re = await createUser(
            { email: 'test-email' + (new Date).getTime() + '@test.com', password }
        );

        console.log(JSON.stringify(re));
        const re2 = await createUserDocument(re);
        console.log(JSON.stringify(re2));
        assert(re2.uid === re.uid);

        const snapshot = await getFirestore()
            .collection('users')
            .doc(re.uid)
            .get();

        console.log(JSON.stringify(snapshot.data()));
        assert(snapshot.data().email === re.email);
    });
});
