"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMailBienvenue = void 0;
const v2_1 = require("firebase-functions/v2");
const firestore_1 = require("firebase-functions/v2/firestore");
const nodemailer = require("nodemailer");
const logger = require("firebase-functions/logger");
const emailTemplates_1 = require("./emailTemplates");
(0, v2_1.setGlobalOptions)({ region: "europe-west9" });
exports.envoyerMailBienvenue = (0, firestore_1.onDocumentUpdated)({ document: "membres/{membreId}", database: "ecole-db" }, async (event) => {
    const membreAvant = event.data?.before.data();
    const membreApres = event.data?.after.data();
    if (!membreAvant || !membreApres)
        return;
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
        const prenom = membreApres.prenom;
        const textContent = `Bonjour ${prenom},

Bonne nouvelle : votre adhésion au collectif « Un nid tout neuf pour nos écureuils » a été validée ! Vous faites désormais officiellement partie de notre dynamique citoyenne pour l'avenir de l'école.

Les échéances clés en cours :
- Presse locale : notre communiqué a été transmis aux rédactions locales pour faire entendre notre voix constructive.
- Pétition citoyenne : nous préparons sa diffusion large pour appuyer la demande de révision budgétaire du projet.
- Conseil municipal du 13 octobre : notre demande officielle de création d’une commission extra-municipale est transmise aux élus.

Nous vous tiendrons régulièrement informé(e) des avancées par mail. Si vous souhaitez participer plus activement aux groupes de travail ou faire part de compétences particulières, répondez simplement à ce message.

Encore merci pour votre soutien et bienvenue parmi nous !
${(0, emailTemplates_1.getEmailFooter)(false)}`;
        const htmlBodyContent = `
      <h2 style="color: #059669; font-size: 20px;">Bonjour ${prenom},</h2>
      
      <p>Bonne nouvelle : votre adhésion au collectif « Un nid tout neuf pour nos écureuils » a été <b>validée</b> ! Vous faites désormais officiellement partie de notre dynamique citoyenne pour l'avenir de l'école.</p>
      
      <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">Les échéances clés en cours :</h3>
      <ul style="padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;"><b>Presse locale :</b> notre communiqué a été transmis aux rédactions locales pour faire entendre notre voix constructive.</li>
        <li style="margin-bottom: 8px;"><b>Pétition citoyenne :</b> nous préparons sa diffusion large pour appuyer la demande de révision budgétaire du projet.</li>
        <li style="margin-bottom: 8px;"><b>Conseil municipal du 13 octobre :</b> notre demande officielle de création d’une commission extra-municipale est transmise aux élus.</li>
      </ul>

      <p>Nous vous tiendrons régulièrement informé(e) des avancées par mail. Si vous souhaitez participer plus activement aux groupes de travail ou faire part de compétences particulières, <b>répondez simplement à ce message</b>.</p>

      <p>Encore merci pour votre soutien et bienvenue parmi nous !</p>
    `;
        const htmlContent = (0, emailTemplates_1.getBaseHtmlTemplate)(htmlBodyContent);
        const mailOptions = {
            from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
            replyTo: 'collectif.ecole.km@gmail.com',
            to: membreApres.email,
            subject: "Bienvenue au sein du collectif « Un nid tout neuf pour nos écureuils » ! 🐿️",
            text: textContent,
            html: htmlContent,
            headers: {
                'X-Entity-Ref-ID': event.params.membreId
            }
        };
        try {
            await transporter.sendMail(mailOptions);
            logger.info(`Email envoyé avec succès à ${membreApres.email}`);
        }
        catch (error) {
            logger.error("Erreur lors de l'envoi de l'email :", error);
        }
    }
});
//# sourceMappingURL=index.js.map