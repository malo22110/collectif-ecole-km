const fs = require('fs');
const https = require('https');
const os = require('os');

const configPath = `${os.homedir()}/.config/configstore/firebase-tools.json`;
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const token = config.tokens.access_token;

let allMembers = [];

function fetchPage(pageToken) {
  let path = '/v1/projects/collectif-ecole-km/databases/ecole-db/documents/membres?pageSize=300';
  if (pageToken) path += `&pageToken=${encodeURIComponent(pageToken)}`;

  const options = {
    hostname: 'firestore.googleapis.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };

  const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      if (json.documents) {
        allMembers = allMembers.concat(json.documents.map(d => ({
          id: d.name.split('/').pop(),
          email: d.fields.email ? d.fields.email.stringValue : null,
          prenom: d.fields.prenom ? d.fields.prenom.stringValue : null,
          nom: d.fields.nom ? d.fields.nom.stringValue : null,
        })));
      }
      if (json.nextPageToken) {
        fetchPage(json.nextPageToken);
      } else {
        fs.writeFileSync('membres_all.json', JSON.stringify(allMembers, null, 2));
        console.log(`Total members: ${allMembers.length}`);
        
        const badIds = allMembers.filter(x => x.id !== x.email);
        console.log("Bad IDs:", badIds);
      }
    });
  });
  req.end();
}

fetchPage();
