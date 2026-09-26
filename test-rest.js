const https = require('https');

const data = JSON.stringify({
  fields: {
    prenom: { stringValue: "Test" },
    nom: { stringValue: "Rest" },
    email: { stringValue: "test@test.com" },
    status: { stringValue: "pending" },
    dateInscription: { stringValue: new Date().toISOString() }
  }
});

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: '/v1/projects/collectif-ecole-km/databases/(default)/documents/membres',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
