const fs = require('fs');
const path = 'app/components/Comments.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add new auth imports
code = code.replace(
  'signInWithEmailAndPassword, createUserWithEmailAndPassword',
  'sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink'
);

// 2. Add linkSent state
code = code.replace(
  'const [authError, setAuthError] = useState("");',
  'const [authError, setAuthError] = useState("");\n  const [linkSent, setLinkSent] = useState(false);'
);

// 3. Add Magic Link verification useEffect
const magicLinkEffect = `
  // Vérifier si l'utilisateur revient avec un Magic Link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let savedEmail = window.localStorage.getItem('emailForSignIn');
      if (!savedEmail) {
        savedEmail = window.prompt("Veuillez confirmer votre adresse email pour finaliser la connexion.");
      }
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then((result) => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Erreur Magic Link", err);
            setAuthError("Le lien de connexion est invalide ou a expiré.");
          });
      }
    }
  }, []);
`;

code = code.replace('// Écouter l\'authentification', magicLinkEffect + '\n  // Écouter l\'authentification');

// 4. Replace handleEmailAuth
const handleEmailAuthStart = code.indexOf('const handleEmailAuth = async');
const handlePostCommentStart = code.indexOf('const handlePostComment = async');

const newHandleEmailAuth = `
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setAuthError("");
    setLinkSent(true);
    
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
  };

  `;
  
code = code.substring(0, handleEmailAuthStart) + newHandleEmailAuth + code.substring(handlePostCommentStart);

// 5. Replace Auth Form UI
const formStart = code.indexOf('<form onSubmit={handleEmailAuth}');
const formEnd = code.indexOf('</form>') + '</form>'.length;

const newForm = `
            <form onSubmit={handleSendMagicLink} className="max-w-sm mx-auto text-left">
              <h4 className="font-bold text-stone-900 mb-4 text-center">
                Connexion sécurisée par email
              </h4>
              {authError && <p className="text-red-500 text-sm mb-3 text-center">{authError}</p>}
              
              {linkSent ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                  <p className="text-emerald-800 font-medium mb-2">Lien envoyé !</p>
                  <p className="text-sm text-emerald-700">Consultez votre boîte mail <strong>{email}</strong> et cliquez sur le lien magique pour vous connecter automatiquement.</p>
                  <button type="button" onClick={() => setLinkSent(false)} className="text-xs text-emerald-600 underline mt-4">Je n'ai rien reçu, recommencer</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-stone-600 mb-4 text-center">Entrez l'email utilisé lors de votre adhésion. Nous vous enverrons un lien de connexion magique (sans mot de passe).</p>
                  <input 
                    type="email" 
                    placeholder="Votre adresse email" 
                    required 
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg mb-4 focus:outline-none focus:border-emerald-500 bg-white text-stone-900"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setAuthMode("idle")} className="w-1/3 px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors">Retour</button>
                    <button type="submit" className="w-2/3 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      Recevoir le lien
                    </button>
                  </div>
                </>
              )}
            </form>
`;

code = code.substring(0, formStart) + newForm + code.substring(formEnd);

fs.writeFileSync(path, code);
console.log("Magic link implemented.");
