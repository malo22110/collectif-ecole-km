import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";

setGlobalOptions({ region: "europe-west9" });

export const envoyerMailBienvenue = onDocumentUpdated({ document: "membres/{membreId}", database: "ecole-db" }, async (event) => {
  const membreAvant = event.data?.before.data();
  const membreApres = event.data?.after.data();
  
  if (!membreAvant || !membreApres) return;

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

    const textContent = `Bonjour ${membreApres.prenom},

Bonne nouvelle, votre candidature a été validée par l'équipe !

Merci beaucoup d'avoir rejoint le collectif. Votre soutien est précieux pour relancer le projet de l'école de Kergrist-Moëlou.

Nous reviendrons vers vous très vite avec les prochaines actions.

Malo & Axelle - Le Collectif

---
Ce message est envoyé automatiquement. Si vous n'avez pas fait cette demande, veuillez l'ignorer.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #059669;">Bonjour ${membreApres.prenom},</h2>
        <p>Bonne nouvelle, votre candidature a été <b>validée</b> par l'équipe !</p>
        <p>Merci beaucoup d'avoir rejoint le collectif. Votre soutien est précieux pour relancer le projet de l'école de Kergrist-Moëlou.</p>
        <p>Nous reviendrons vers vous très vite avec les prochaines actions.</p>
        <br/>
        <p><i>Malo & Axelle - Le Collectif</i></p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 30px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: #6b7280;">Ce message vous a été envoyé car vous avez rejoint le collectif. Si c'est une erreur, vous pouvez ignorer cet e-mail.</p>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
      replyTo: 'collectif.ecole.km@gmail.com',
      to: membreApres.email,
      subject: "Candidature validée - Bienvenue dans le collectif !",
      text: textContent,
      html: htmlContent,
      headers: {
        'X-Entity-Ref-ID': event.params.membreId
      }
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Email envoyé avec succès à ${membreApres.email}`);
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email :", error);
    }
  }
});
