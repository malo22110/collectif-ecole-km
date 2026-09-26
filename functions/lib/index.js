"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMailBienvenue = void 0;
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");
// Très important : on force la région de la fonction à Paris, comme la base de données !
(0, v2_1.setGlobalOptions)({ region: "europe-west9" });
exports.envoyerMailBienvenue = (0, firestore_1.onDocumentCreated)("membres/{membreId}", async (event) => {
    const membre = event.data?.data();
    if (!membre || !membre.email) {
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
        to: membre.email,
        subject: "Bienvenue dans le collectif Un nid tout neuf pour nos écureuils",
        html: `
      <h2>Bonjour ${membre.prenom},</h2>
      <p>Merci beaucoup d'avoir rejoint le collectif !</p>
      <p>Votre soutien est précieux pour relancer le projet de l'école.</p>
      <p>Nous reviendrons vers vous très vite avec les prochaines actions.</p>
      <br/>
      <p><i>Malo & Axelle - Le Collectif</i></p>
    `,
    };
    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Email envoyé avec succès à ${membre.email}`);
    }
    catch (error) {
        logger.error("Erreur lors de l'envoi de l'email :", error);
    }
});
//# sourceMappingURL=index.js.map