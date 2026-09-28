"use client";

import React, { useState } from "react";
import { collection, query, where, getDocs, addDoc, setDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ImportMembers() {
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleImport = async () => {
    if (!confirm("Voulez-vous vraiment importer la liste des membres ?")) return;
    
    setImporting(true);
    setLogs(["Démarrage de l'importation..."]);
    
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

    const lines = csvData.split('\n');
    const membersRef = collection(db, "membres");
    
    let addedCount = 0;

    for (const line of lines) {
      if (!line.trim() || line.startsWith(',')) continue; 
      
      let [nom, prenom, email, tel, adherent, informe] = line.split(',');
      
      nom = nom ? nom.replace(/"/g, '').trim() : "";
      prenom = prenom ? prenom.replace(/"/g, '').trim() : "";
      email = email ? email.trim().toLowerCase() : "";
      tel = tel ? tel.trim() : "";
      
      const isAdherent = adherent === 'Oui';
      const isInforme = informe === 'Oui';
      
      const status = isAdherent ? 'validated' : 'newsletter';

      if (email) {
        const q = query(membersRef, where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLogs(prev => [...prev, `[SKIPPED] ${email} existe déjà.`]);
          continue;
        }
      } else {
        setLogs(prev => [...prev, `[SKIPPED] Membre sans email: ${prenom} ${nom}`]);
        continue;
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
        const emailId = email.trim().toLowerCase();
        await setDoc(doc(db, "membres", emailId), docData);
        setLogs(prev => [...prev, `[AJOUTÉ] ${prenom} ${nom} (${email})`]);
        addedCount++;
      } catch (e: any) {
        setLogs(prev => [...prev, `[ERREUR] ${email}: ${e.message}`]);
      }
    }
    
    setLogs(prev => [...prev, `Terminé ! ${addedCount} membres ajoutés.`]);
    setImporting(false);
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
      <h3 className="font-bold text-stone-900 mb-4">Outils de Migration</h3>
      <p className="text-sm text-stone-600 mb-4">
        Permet d'importer la liste initiale des membres à partir du fichier Excel.
        (Les doublons basés sur l'email seront ignorés).
      </p>
      <button 
        onClick={handleImport}
        disabled={importing}
        className="px-4 py-2 bg-stone-800 text-white rounded-lg font-medium hover:bg-stone-900 disabled:opacity-50"
      >
        {importing ? "Importation en cours..." : "Lancer l'importation"}
      </button>

      {logs.length > 0 && (
        <div className="mt-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-600 max-h-48 overflow-y-auto font-mono">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
