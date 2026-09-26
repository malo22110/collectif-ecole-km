import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";

// On force Firebase à déployer la fonction v2 EXACTEMENT là où est la base de données (Paris).
setGlobalOptions({ region: "europe-west9" });

export const envoyerMailBienvenue = onDocumentUpdated({ document: "membres/{membreId}", database: "ecole-db" }, async (event) => {
  const membreAvant = event.data?.before.data();
  const membreApres = event.data?.after.data();
  
  if (!membreAvant || !membreApres) return;

  // Le mail part UNIQUEMENT quand le statut passe de 'pending' à 'validated'
  if (membreAvant.status === "pending" && membreApres.status === "validated") {
    
    if (!membreApres.email) {
      logger.error("Pas d'email trouvé pour le membre", event.params.membreId);
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "collectif.ecole.km@gmail.com",
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
      to: membreApres.email,
      subject: "Candidature validée - Bienvenue dans le collectif !",
      html: `
        <h2>Bonjour ${membreApres.prenom},</h2>
        <p>Bonne nouvelle, votre candidature a été <b>validée</b> par l'équipe !</p>
        <p>Merci beaucoup d'avoir rejoint le collectif. Votre soutien est précieux pour relancer le projet de l'école de Kergrist-Moëlou.</p>
        <p>Nous reviendrons vers vous très vite avec les prochaines actions.</p>
        <br/>
        <p><i>Malo & Axelle - Le Collectif</i></p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email envoyé avec succès à ${membreApres.email}`);
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email :", error);
    }
  }
});
