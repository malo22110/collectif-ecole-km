import * as admin from "firebase-admin";
admin.initializeApp();
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as nodemailer from "nodemailer";
import * as logger from "firebase-functions/logger";
import { getEmailFooter, getBaseHtmlTemplate } from "./emailTemplates";

setGlobalOptions({ region: "europe-west9" });

export const envoyerMailBienvenue = onDocumentUpdated({ document: "membres/{membreId}" }, async (event) => {
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

    const prenom = membreApres.prenom;

    const textContent = `Bonjour ${prenom},

Bonne nouvelle : votre adhésion au collectif « Un nid tout neuf pour nos écureuils » a été validée ! Vous faites désormais officiellement partie de notre dynamique citoyenne pour l'avenir de l'école.

Les échéances clés en cours :
- Presse locale : notre communiqué a été transmis aux rédactions locales pour faire entendre notre voix constructive.
- Pétition citoyenne : nous préparons sa diffusion large pour appuyer la demande de révision budgétaire du projet.
- Conseil municipal du 13 octobre : notre demande officielle de création d’une commission extra-municipale est transmise aux élus.

Nous vous tiendrons régulièrement informé(e) des avancées par mail. Si vous souhaitez participer plus activement aux groupes de travail ou faire part de compétences particulières, répondez simplement à ce message.

Encore merci pour votre soutien et bienvenue parmi nous !
${getEmailFooter(false)}`;

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

    const htmlContent = getBaseHtmlTemplate(htmlBodyContent);

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
    } catch (error) {
      logger.error("Erreur lors de l'envoi de l'email :", error);
    }
  }
});


export const envoyerMagicLink = onDocumentCreated({ document: "magicLinks/{linkId}" }, async (event) => {
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

    const textContent = `Bonjour,

Voici votre lien de connexion magique pour accéder à l'espace débat du Collectif. Cliquez sur le lien ci-dessous pour vous connecter instantanément et sans mot de passe :
${signinLink}

Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet e-mail en toute sécurité.

À très vite sur l'espace du collectif !`;

    const htmlBodyContent = `
      <h2 style="color: #059669; font-size: 20px; text-align: center;">Connexion à l'espace débat</h2>
      
      <p style="text-align: center;">Bonjour,</p>
      <p style="text-align: center;">Vous avez demandé à vous connecter à l'espace d'échange du collectif. Cliquez sur le bouton ci-dessous pour accéder automatiquement à votre compte, sans avoir besoin de mot de passe :</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${signinLink}" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Me connecter au collectif</a>
      </div>

      <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 20px;">
        <em>Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :</em><br/>
        <a href="${signinLink}" style="color: #059669; word-break: break-all;">${signinLink}</a>
      </p>
      <p style="font-size: 13px; color: #6b7280; text-align: center;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
    `;

    const htmlContent = getBaseHtmlTemplate(htmlBodyContent);

    const mailOptions = {
      from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
      to: email,
      subject: "Votre lien magique de connexion 🪄",
      text: textContent,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Magic link envoyé à ${email}`);
    
    await event.data?.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
    
  } catch (error) {
    logger.error("Erreur lors de l'envoi du Magic Link :", error);
    await event.data?.ref.update({ status: 'error', error: String(error) });
  }
});


async function processSpreadMail(docSnap: FirebaseFirestore.DocumentSnapshot) {
  const data = docSnap.data();
  if (!data || data.status !== 'pending') return;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "collectif.ecole.km@gmail.com",
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const subject = data.subject || "Nouvelle communication du collectif";
    const bodyContent = data.html || "<p>Message vide.</p>";
    const isTest = data.testMode === true;
    
    let recipients: string[] = [];
    
    if (isTest) {
      recipients = ["lecam.malo@gmail.com"];
    } else {
      const snapshot = await admin.firestore().collection('membres').where('status', '==', 'validated').get();
      snapshot.forEach(doc => {
        const email = doc.data().email;
        if (email) recipients.push(email);
      });
      recipients = [...new Set(recipients)];
    }

    if (recipients.length === 0) {
      logger.info("Aucun destinataire trouvé pour ce mail.");
      await docSnap.ref.update({ status: 'error', error: 'No recipients found.' });
      return;
    }

    const htmlContent = getBaseHtmlTemplate(bodyContent);
    let sentCount = 0;
    
    for (const email of recipients) {
      const mailOptions = {
        from: '"Collectif Kergrist-Moëlou" <collectif.ecole.km@gmail.com>',
        to: email,
        subject: subject,
        html: htmlContent
      };
      try {
        await transporter.sendMail(mailOptions);
        sentCount++;
      } catch (err) {
        logger.error(`Erreur d'envoi à ${email}:`, err);
      }
    }

    logger.info(`SpreadMail envoyé à ${sentCount} destinataires.`);
    await docSnap.ref.update({ 
      status: 'sent', 
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentCount: sentCount 
    });
  } catch (error) {
    logger.error("Erreur lors de l'envoi du SpreadMail :", error);
    await docSnap.ref.update({ status: 'error', error: String(error) });
  }
}

export const envoyerSpreadMail = onDocumentCreated({ document: "mailOutbox/{mailId}" }, async (event) => {
  const data = event.data?.data();
  if (!data || data.status !== 'pending') return;

  // Si le mail est programmé dans le futur, on ne fait rien.
  // C'est le Cron Job qui s'en chargera.
  if (data.scheduledAt && data.scheduledAt.toDate() > new Date()) {
    logger.info(`Mail ${event.params.mailId} programmé pour plus tard. On ignore.`);
    return;
  }

  // Sinon, on envoie immédiatement.
  if (event.data) {
    await processSpreadMail(event.data);
  }
});

export const checkScheduledMails = onSchedule("every 5 minutes", async (event) => {
  const now = new Date();
  
  // Cherche les mails en attente dont la date de programmation est passée
  const snapshot = await admin.firestore().collection("mailOutbox")
    .where("status", "==", "pending")
    .where("scheduledAt", "<=", admin.firestore.Timestamp.fromDate(now))
    .get();

  if (snapshot.empty) {
    logger.info("Aucun mail programmé en attente.");
    return;
  }

  logger.info(`Trouvé ${snapshot.size} mail(s) programmé(s) à envoyer.`);
  
  for (const doc of snapshot.docs) {
    await processSpreadMail(doc);
  }
});



// --- PÉTITION ---
export const onSignatureCreated = onDocumentCreated({ document: "signatures/{sigId}" }, async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const statsRef = admin.firestore().collection('stats').doc('petition');
  
  try {
    await admin.firestore().runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      const prenom = data.prenom || "Anonyme";
      const nom = data.nom || "";
      const qualite = data.qualite ? ` (${data.qualite})` : "";
      const initiale = nom ? nom.charAt(0).toUpperCase() + "." : "";
      const displayName = `${prenom} ${initiale}${qualite}`.trim();

      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          count: 1,
          recent: [displayName]
        });
      } else {
        const currentData = statsDoc.data();
        const currentCount = currentData?.count || 0;
        let currentRecent = currentData?.recent || [];
        
        currentRecent.unshift(displayName);
        if (currentRecent.length > 10) {
          currentRecent = currentRecent.slice(0, 10);
        }

        transaction.update(statsRef, {
          count: currentCount + 1,
          recent: currentRecent
        });
      }
    });
    logger.info(`Nouvelle signature comptabilisée : ${data.prenom}`);
  } catch (error) {
    logger.error("Erreur lors de la mise à jour des stats de la pétition :", error);
  }
});
