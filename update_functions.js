const fs = require('fs');
const path = 'functions/src/index.ts';
let code = fs.readFileSync(path, 'utf8');

// Add imports if necessary
if (!code.includes('import * as admin')) {
  code = 'import * as admin from "firebase-admin";\nadmin.initializeApp();\n' + code;
}
if (!code.includes('onDocumentCreated')) {
  code = code.replace(
    'import { onDocumentUpdated } from "firebase-functions/v2/firestore";',
    'import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";'
  );
}

const newFunction = `

export const envoyerMagicLink = onDocumentCreated({ document: "magicLinks/{linkId}", database: "ecole-db" }, async (event) => {
  const data = event.data?.data();
  if (!data || !data.email || data.status !== 'pending') return;

  const email = data.email;
  const redirectUrl = data.url || 'https://collectif-ecole-km.fr/';

  try {
    const actionCodeSettings = {
      url: redirectUrl,
      handleCodeInApp: true,
    };
    
    // Génération du lien de connexion sécurisé
    const signinLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "collectif.ecole.km@gmail.com",
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const textContent = \`Bonjour,

Voici votre lien de connexion magique pour accéder à l'espace débat du Collectif. Cliquez sur le lien ci-dessous pour vous connecter instantanément et sans mot de passe :
\${signinLink}

Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet e-mail en toute sécurité.

À très vite sur l'espace du collectif !\`;

    const htmlBodyContent = \`
      <h2 style="color: #059669; font-size: 20px; text-align: center;">Connexion à l'espace débat</h2>
      
      <p style="text-align: center;">Bonjour,</p>
      <p style="text-align: center;">Vous avez demandé à vous connecter à l'espace d'échange du collectif. Cliquez sur le bouton ci-dessous pour accéder automatiquement à votre compte, sans avoir besoin de mot de passe :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="\${signinLink}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Me connecter au collectif</a>
      </div>

      <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
        <em>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</em><br/>
        <a href="\${signinLink}" style="color: #059669; word-break: break-all;">\${signinLink}</a>
      </p>
      <p style="font-size: 13px; color: #6b7280; text-align: center;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
    \`;

    const htmlContent = getBaseHtmlTemplate(htmlBodyContent);

    const mailOptions = {
      from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
      to: email,
      subject: "Votre lien magique de connexion 🪄",
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    logger.info(\`Magic link envoyé à \${email}\`);
    
    await event.data?.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
    
  } catch (error) {
    logger.error("Erreur lors de l'envoi du Magic Link :", error);
    await event.data?.ref.update({ status: 'error', error: error.toString() });
  }
});
`;

code += newFunction;
fs.writeFileSync(path, code);
console.log('Function added');
