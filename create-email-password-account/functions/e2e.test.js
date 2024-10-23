
const admin = require("firebase-admin");
const functionTest = require('firebase-functions-test')();
// after firebase-functions-test has been initialized
const indexjs = require('.'); // relative path to functions code

const { describe, test } = require("node:test");

admin.initializeApp();

describe('Create account test', () => {
    test('Success test: input data test', async () => {

        const wrapped = functionTest.wrap(indexjs.createEmailPasswordAccount);

        const re = await wrapped({
            data: {
                email: 'e2e-test@email.com',
                password: '12,*W45a',
            },
        });

        console.log(re);


    });

});
