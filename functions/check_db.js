const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // wait, they might not have a service account key

// If we run `firebase database:get` ? No, it's firestore. 
