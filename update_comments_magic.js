const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace handleSendMagicLink logic
const oldFunc = `
    const actionCodeSettings = {
      // Redirige vers la page courante
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      console.error(err);
      setAuthError("Erreur lors de l'envoi du lien de connexion.");
      setLinkSent(false);
    }
`;

const newFunc = `
    try {
      // On demande au serveur d'envoyer le mail joli via Firestore
      await addDoc(collection(db, "magicLinks"), {
        email: email,
        url: window.location.href,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      window.localStorage.setItem('emailForSignIn', email);
    } catch (err: any) {
      console.error(err);
      setAuthError("Erreur lors de l'envoi du lien de connexion.");
      setLinkSent(false);
    }
`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync(path, code);
console.log('Comments updated for magicLinks collection');
