const fs = require('fs');
const https = require('https');
const os = require('os');

const configPath = `${os.homedir()}/.config/configstore/firebase-tools.json`;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens.access_token;

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: '/v1/projects/collectif-ecole-km/databases/ecole-db/documents/mailOutbox',
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});
req.end();
