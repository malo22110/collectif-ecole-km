"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMailBienvenue = void 0;
const functions = require("firebase-functions");
const params_1 = require("firebase-functions/params");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");
const emailPassword = (0, params_1.defineSecret)("GMAIL_PASSWORD");
exports.envoyerMailBienvenue = functions
    .runWith({ secrets: [emailPassword] })
    .firestore.document("membres/{membreId}")
    .onCreate(async (snap, context) => {
    const membre = snap.data();
    if (!membre || !membre.email) {
        logger.error("Pas d'email trouvé pour le membre", context.params.membreId);
        return;
    }
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "collectif.ecole.km@gmail.com",
            pass: emailPassword.value(),
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