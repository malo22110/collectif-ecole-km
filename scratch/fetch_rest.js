const fs = require('fs');
const https = require('https');
const os = require('os');

const configPath = `${os.homedir()}/.config/configstore/firebase-tools.json`;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens.access_token;

const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: '/v1/projects/collectif-ecole-km/databases/ecole-db/documents/membres',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.documents) {
      const members = json.documents.map(d => ({
        id: d.name.split('/').pop(),
        email: d.fields.email ? d.fields.email.stringValue : null,
        prenom: d.fields.prenom ? d.fields.prenom.stringValue : null,
        nom: d.fields.nom ? d.fields.nom.stringValue : null,
      }));
      console.log(JSON.stringify(members, null, 2));
      fs.writeFileSync('membres.json', JSON.stringify(members, null, 2));
    } else {
      console.log("No documents or error:", data);
    }
  });
});
req.end();
