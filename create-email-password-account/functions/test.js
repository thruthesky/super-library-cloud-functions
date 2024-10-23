
const admin = require("firebase-admin");
const { createUser } = require(".");
const { describe, test } = require("node:test");
const assert = require("assert");

admin.initializeApp();
const password = '12W45a,*u';

describe('Create account test', () => {
    test('Failure test: input data test', async () => {

        const re = await createUser({ email: '', password });
        assert(re.indexOf('email-is-empty') >= 0);

    });
    test('Success test: create account', async () => {
        const re = await createUser(
            { email: 'test-email' + (new Date).getTime() + '@test.com', password }
        );
        console.log(re);
        assert(re.uid);
    });
    test('Failure test: create account that is already exists.', async () => {
        const email = 'test-exist-' + (new Date).getTime() + '@test.com';
        const re = await createUser({ email, password });
        assert(re.uid);


        const e = await createUser({ email, password });
        console.log(e);
        assert(e.indexOf('email-already-exists') >= 0);
    });
});
