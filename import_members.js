const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB49RQeCyXWVTkX4nHtku5taKtrZZFtb7o",
  authDomain: "collectif-ecole-km.firebaseapp.com",
  projectId: "collectif-ecole-km",
  storageBucket: "collectif-ecole-km.firebasestorage.app",
  messagingSenderId: "1006373112548",
  appId: "1:1006373112548:web:fe34fca6b0a96dd3003af1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'ecole-db');

const csvData = `DAGORNE,Maiwenn,maiwenn_d2@hotmail.com,0672132768,Oui,Oui
LE GALL,Anne,marmouz77@orange.fr,0628284327,Oui,Oui
MARTIN,Brigitte,bm_gaia@proton.me,0674402002,Oui,Oui
THOMAS,Brice,Bricethomas.adrfaso@gmail.com,0695553702,Oui,Oui
COL,Sabrina,sabrina.corziani@gmail.com,0674355879,Oui,Oui
LE CAM,Nathalie,nathalielecam22@gmail.com ,0679893571,Oui,Oui
LE MEUR-DIVAN,Émilie,emilie.lmo@hotmail.fr,0684185995,Oui,Oui
BONNISSEAU,Axelle,axbguv@gmail.com,0667762280,Oui,Oui
VANDAME,Guilhem,axbguv@gmail.com,0659238295,Oui,Oui
BLANCHET,Sandrine,as.blanchet22@gmail.com,0659960490,Oui,Oui
BLANCHET,Arnaud,as.blanchet22@gmail.com,0633764859,Oui,Oui
PERROT,Murielle,murielle22110@gmail.com,0671805705,Oui,Oui
PANNEREC,Julie,juliepannerec@gmail.com,0683471668,Oui,Oui
L'HÉGARAT - MOREL,Léo,,0686075795,Oui,Oui
GROUX,Maëlle,maellegroux@hotmail.fr,0666696890,Oui,Oui
TRUBUILT,Pascaline,pascaline.trubuilt@hotmail.fr,0682040801,Oui,Oui
BLIN-CONNAN,Jeannie,jeannie.blin@gmail.com,0674410848,Oui,Oui
LE CAM,Roland,roland.le-cam@wanadoo.fr,0602371885,Oui,Oui
LE CORRE,Hélène,goliathbouba1@yahoo.fr,0617893534,Oui,Oui
POIRÉ,Audrey,izaude22@GMAIL.COM,0631233452,Oui,Oui
BERNARD,Yan,BINOUZCAUREL@GMAIL.COM,0672498459,Oui,Oui
QUÉMÉNER,Gladys,gladys.quemener@gmail.com,0679323967,Oui,Oui
TANGUY,Fanfan,fanfantanguy22@gmail.com,0630241446,Oui,Oui
CHASSELOUPE,Gladys,gladys.chasseloup@gmail.com,0633030753,Oui,Oui
POISSON,Julie,juliepoisson@laposte.net,0685645105,Oui,Oui
BUCKULCIK,Adriane,buckulcikadriane@gmail.com,0624124938,Oui,Oui
LÉRAUD,Inès,ines.leraud.ext@proton.me,0619838822,Oui,Oui
DAVALAN,Morgan,morgandavalan@ecomail.bzh,0607813659,Oui,Oui
CORBEL,Anna,annacorbel.ortho@yahoo.fr,0637311569,Oui,Oui
MESTRIC,Antonin,antonin.mestric@gmail.com,0637311569,Oui,Oui
TEINTURIER,Christine,ch.teinturier@gmail.com,0647040480,Oui,Oui
TEINTURIER,Didier,didier.teinturier@gmail.com,0647040480,Oui,Oui
"Philippe   ",Christine,legrandfaut@orange.fr,,Oui,Oui
 Bourges,Anne Marie,annemariebourges@outlook.com,,Oui,Oui
Alix bricet,,Alix.b@live.com,,Oui,Oui
anne ,,annesojean@wanadoo.fr,,Oui,Oui
jean,,annesojean@wanadoo.fr,,Oui,Oui
Gentien,iwen,agone85@gmail.com,,Oui,Oui
 le bozec  ,aurelie,ebozecaurelie@gmail.com,,Oui,Oui
gilbert,baptiste,baptiste.gilbert@hotmail.fr,,Oui,Oui
Pérennes,Daniel,daniel.perennes@orange.fr,,Oui,Oui
Pérennes,Michèle,daniel.perennes@orange.fr,,Oui,Oui
Lullier,Michel,blacknails91@yahoo.fr,,Oui,Oui
munier22,gerard,gerard.munier22@gmail.com ,,Oui,Oui
Herbstreith,jeffrey,Jeffrieju@gmail.com,,Oui,Oui
Mordeles,Pauline,Mordeles.pauline@gmail.com,,Oui,Oui
W,adrien,w.adrien@outlook.fr ,,Oui,Oui
herbstreith,Andreas ,Andreas.herbstreith@gmail.com,,Oui,Oui
herbstreith,Béatrice,Andreas.herbstreith@gmail.com,,Oui,Oui
 Coail,Nolwenn,nolwenncoail@gmail.com,,Oui,Oui
Le Runigo,Christine , clerun61@gmail.com,,Oui,Oui
Stephanie,,stephanielebris@wanadoo.fr,,Oui,Oui
Fred,,fdvos@me.com,,Oui,Oui
Adrien Col,,adrien.col@laposte.net,,Oui,Oui
Tudal Saunier ,,tudal@free.fr,,Oui,Oui
François Canziani ,,francoisczi@orange.fr,,Oui,Oui
Mireille Canziani ,,mireilleczi@orange.fr,,Oui,Oui
lecam,malo,lecam.malo@gmail.com,,Oui,Oui
crombez,Camala,crombezcamala1@gmail.com,,Oui,Oui
Rémi,Rémi,remi_onweb@yahoo.fr,,Oui,Oui
STEPHAN,Koulm,kowoulm@hotmail.fr,0686785089,Non,Oui
MANDARD,Léandre,leandre.mandard@sciencespo.fr,,Non,Oui
TANGUY,Yvette,,0677219282,Non,Oui`;

async function run() {
  const lines = csvData.split('\n');
  const membersRef = collection(db, "membres");
  
  let addedCount = 0;

  for (const line of lines) {
    if (!line.trim() || line.startsWith(',')) continue; // skip empty or completely blank lines
    
    // Some lines have quotes like "Philippe   ",Christine
    // We'll do a simple split by comma since there are no commas in the data themselves
    let [nom, prenom, email, tel, adherent, informe] = line.split(',');
    
    // Clean up quotes and whitespace
    nom = nom ? nom.replace(/"/g, '').trim() : "";
    prenom = prenom ? prenom.replace(/"/g, '').trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    tel = tel ? tel.trim() : "";
    
    const isAdherent = adherent === 'Oui';
    const isInforme = informe === 'Oui';
    
    // Si la personne n'adhère pas mais veut être informée, on met 'newsletter', sinon 'validated' pour les membres.
    const status = isAdherent ? 'validated' : 'newsletter';

    // Before adding, check if email exists to avoid duplicates (optional, but good practice)
    if (email) {
      const q = query(membersRef, where("email", "==", email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        console.log(`Skipping duplicate email: ${email}`);
        continue;
      }
    } else {
      console.log(`Warning: skipping member with no email: ${prenom} ${nom}`);
      continue; // Firebase Auth / Google Auth won't work without an email
    }
    
    const docData = {
      nom,
      prenom,
      email,
      telephone: tel,
      status,
      dateInscription: new Date().toISOString(),
      adherent: isAdherent,
      informe: isInforme
    };
    
    try {
      await addDoc(membersRef, docData);
      console.log(`Added: ${prenom} ${nom} (${email})`);
      addedCount++;
    } catch (e) {
      console.error(`Error adding ${email}: `, e);
    }
  }
  
  console.log(`Finished adding ${addedCount} members.`);
  process.exit(0);
}

run().catch(console.error);
