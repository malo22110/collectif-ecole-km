import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
admin.initializeApp();
import { setGlobalOptions } from "firebase-functions/v2";
import {
  onDocumentUpdated,
  onDocumentCreated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { getEmailFooter, getBaseHtmlTemplate } from "./emailTemplates";
import { formatPublicRecentSigner } from "./petitionPublicNames";
import { createMailTransport, mailFrom, smtpPassword } from "./mailTransport";
import { syncInfomaniakInbox } from "./mailInboxSync";
import { getMailMessageIndexId } from "./mailInboxUtils";
import { isMailDueForDelivery } from "./mailQueue";
import { MAGIC_LINK_ACTION_CODE_SETTINGS } from "./magicLinkConfig";

setGlobalOptions({ region: "europe-west9" });

export const envoyerMailBienvenue = onDocumentUpdated(
  {
    document: "membres/{membreId}",
    database: "ecole-db",
    secrets: [smtpPassword],
  },
  async (event) => {
    const membreAvant = event.data?.before.data();
    const membreApres = event.data?.after.data();

    if (!membreAvant || !membreApres) return;

    if (membreAvant.status === "pending" && membreApres.status === "validated") {
      if (!membreApres.email) {
        logger.error("Pas d'email trouvé pour le membre", event.params.membreId);
        return;
      }

      const transporter = createMailTransport();

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
        from: mailFrom,
        replyTo: mailFrom.address,
        to: membreApres.email,
        subject: "Bienvenue au sein du collectif « Un nid tout neuf pour nos écureuils » ! 🐿️",
        text: textContent,
        html: htmlContent,
        headers: {
          "X-Entity-Ref-ID": event.params.membreId,
        },
      };

      try {
        await transporter.sendMail(mailOptions);
        logger.info(`Email envoyé avec succès à ${membreApres.email}`);
      } catch (error) {
        logger.error("Erreur lors de l'envoi de l'email :", error);
      }
    }
  },
);

export const envoyerMagicLink = onDocumentCreated(
  {
    document: "magicLinks/{linkId}",
    database: "ecole-db",
    secrets: [smtpPassword],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data || !data.email || data.status !== "pending") return;

    const email = data.email;

    try {
      // Génération du lien de connexion sécurisé
      const signinLink = await admin
        .auth()
        .generateSignInWithEmailLink(email, MAGIC_LINK_ACTION_CODE_SETTINGS);

      const transporter = createMailTransport();

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
        from: mailFrom,
        replyTo: mailFrom.address,
        to: email,
        subject: "Votre lien magique de connexion 🪄",
        text: textContent,
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Magic link envoyé à ${email}`);

      await event.data?.ref.update({
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error("Erreur lors de l'envoi du Magic Link :", error);
      await event.data?.ref.update({ status: "error", error: String(error) });
    }
  },
);

async function processSpreadMail(docSnap: FirebaseFirestore.DocumentSnapshot) {
  const data = await docSnap.ref.firestore.runTransaction(async (transaction) => {
    const current = await transaction.get(docSnap.ref);
    if (!current.exists || current.get("status") !== "pending") return null;
    transaction.update(docSnap.ref, {
      status: "sending",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return current.data();
  });
  if (!data) return;

  try {
    const transporter = createMailTransport();

    const subject = data.subject || "Nouvelle communication du collectif";
    const bodyContent = data.html || "<p>Message vide.</p>";
    const isTest = data.testMode === true;
    const deliverySnapshot = await docSnap.ref
      .collection("recipients")
      .where("status", "==", "pending")
      .limit(1000)
      .get();
    const deliveries = deliverySnapshot.docs.filter(
      (delivery) => typeof delivery.get("email") === "string",
    );

    if (deliveries.length === 0) {
      logger.info("Aucun destinataire trouvé pour ce mail.");
      await docSnap.ref.update({
        status: "error",
        error: "Aucun destinataire éligible.",
      });
      return;
    }

    const htmlContent = getBaseHtmlTemplate(bodyContent);
    let sentCount = 0;
    let failedCount = 0;
    const firestore = getFirestore("ecole-db");
    for (const deliveryRef of deliveries) {
      const recipient = deliveryRef.data();
      const email = String(recipient.email).trim().toLowerCase();
      const mailOptions = {
        from: mailFrom,
        replyTo: mailFrom.address,
        to: email,
        subject: subject,
        html: htmlContent,
        headers: { "X-Collectif-Campaign-ID": docSnap.id },
      };
      try {
        const result = await transporter.sendMail(mailOptions);
        sentCount++;
        await deliveryRef.ref.update({
          status: "sent",
          messageId: result.messageId,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const indexId = getMailMessageIndexId(result.messageId);
        if (indexId) {
          await firestore
            .collection("mailMessageIndex")
            .doc(indexId)
            .set({ threadId: docSnap.id, campaignId: docSnap.id })
            .catch((error) =>
              logger.error("Impossible d’indexer le Message-ID de campagne.", error),
            );
        }
        await docSnap.ref.update({
          sentCount: admin.firestore.FieldValue.increment(1),
          pendingCount: admin.firestore.FieldValue.increment(-1),
          status: "sending",
        });
      } catch (err) {
        logger.error(`Erreur d'envoi à ${email}:`, err);
        failedCount++;
        await deliveryRef.ref.update({
          status: "error",
          error: "Échec de livraison SMTP.",
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await docSnap.ref.update({
          failedCount: admin.firestore.FieldValue.increment(1),
          pendingCount: admin.firestore.FieldValue.increment(-1),
          status: "sending",
        });
      }
    }

    logger.info("Campagne traitée.", {
      sentCount,
      failedCount,
      testMode: isTest,
    });
    await docSnap.ref.update({
      status: failedCount === 0 ? "sent" : sentCount > 0 ? "partial" : "error",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentCount,
      failedCount,
      error: failedCount
        ? "Une ou plusieurs livraisons ont échoué."
        : admin.firestore.FieldValue.delete(),
    });
  } catch (error) {
    logger.error("Erreur lors de l'envoi du SpreadMail :", error);
    await docSnap.ref.update({ status: "error", error: String(error) });
  }
}

export const envoyerSpreadMail = onDocumentWritten(
  {
    document: "mailOutbox/{mailId}",
    database: "ecole-db",
    secrets: [smtpPassword],
    timeoutSeconds: 540,
    retry: true,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (
      !event.data?.after.exists ||
      !after ||
      after.status !== "pending" ||
      before?.status === "pending"
    )
      return;

    // Si le mail est programmé dans le futur, on ne fait rien.
    // C'est le Cron Job qui s'en chargera.
    if (!isMailDueForDelivery(after.scheduledAt, new Date())) {
      logger.info(`Mail ${event.params.mailId} programmé pour plus tard. On ignore.`);
      return;
    }

    // Sinon, on envoie immédiatement.
    await processSpreadMail(event.data.after);
  },
);

export const checkScheduledMails = onSchedule(
  { schedule: "every 5 minutes", secrets: [smtpPassword], timeoutSeconds: 540 },
  async (event) => {
    const now = new Date();

    // [SPEC-MAIL-03] Reprendre aussi les envois immédiats si leur événement Firestore a été manqué.
    const snapshot = await getFirestore("ecole-db")
      .collection("mailOutbox")
      .where("status", "==", "pending")
      .limit(1000)
      .get();
    const dueMails = snapshot.docs.filter((doc) =>
      isMailDueForDelivery(doc.get("scheduledAt"), now),
    );

    if (dueMails.length === 0) {
      logger.info("Aucun mail arrivé à échéance dans la file d’attente.");
      return;
    }

    logger.info(`Trouvé ${dueMails.length} mail(s) arrivé(s) à échéance.`);

    for (const mail of dueMails) {
      await processSpreadMail(mail);
    }
  },
);

// [SPEC-MAIL-02] Synchronize the private Infomaniak inbox into the staff-only site mailbox.
export const syncMailInbox = onSchedule(
  { schedule: "every 5 minutes", secrets: [smtpPassword] },
  async () => {
    await syncInfomaniakInbox();
  },
);

// [SPEC-MAIL-02] Replies from the staff inbox are sent through the configured domain SMTP.
export const envoyerReponseBoiteMail = onDocumentCreated(
  {
    document: "mailInbox/{messageId}/replies/{replyId}",
    database: "ecole-db",
    secrets: [smtpPassword],
  },
  async (event) => {
    const replyRef = event.data?.ref;
    if (!replyRef) return;

    const firestore = getFirestore("ecole-db");
    const replyData = await firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(replyRef);
      if (!snapshot.exists || snapshot.get("status") !== "pending") return null;
      transaction.update(replyRef, {
        status: "sending",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return snapshot.data();
    });
    if (!replyData) return;

    try {
      const recipient = typeof replyData.to === "string" ? replyData.to : "";
      const subject =
        typeof replyData.subject === "string"
          ? replyData.subject.slice(0, 500)
          : "Re: Votre message";
      const text = typeof replyData.text === "string" ? replyData.text.slice(0, 12000) : "";
      if (!recipient || !text) throw new Error("Réponse sans destinataire ou contenu.");

      const originalMessageId =
        typeof replyData.originalMessageId === "string" ? replyData.originalMessageId.trim() : "";
      const references = Array.isArray(replyData.originalReferences)
        ? replyData.originalReferences
            .filter((value: unknown): value is string => typeof value === "string")
            .slice(-10)
        : [];
      if (originalMessageId && !references.includes(originalMessageId))
        references.push(originalMessageId);

      const result = await createMailTransport().sendMail({
        from: mailFrom,
        replyTo: mailFrom.address,
        to: recipient,
        subject,
        text,
        headers: {
          ...(originalMessageId ? { "In-Reply-To": originalMessageId } : {}),
          ...(references.length ? { References: references.join(" ") } : {}),
        },
      });
      const originalMessage = await replyRef.parent.parent?.get();
      const threadId =
        typeof originalMessage?.get("threadId") === "string"
          ? originalMessage.get("threadId")
          : replyRef.parent.parent?.id;
      const messageIndexId = getMailMessageIndexId(result.messageId);
      if (messageIndexId && threadId) {
        await firestore
          .collection("mailMessageIndex")
          .doc(messageIndexId)
          .set({ threadId, inboxMessageId: replyRef.parent.parent?.id });
      }
      await replyRef.update({
        status: "sent",
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        smtpMessageId: result.messageId,
      });
      await replyRef.parent.parent?.update({
        latestReplyAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error("Erreur lors de l’envoi d’une réponse depuis la boîte de réception.", error);
      await replyRef.update({
        status: "error",
        error: "L’envoi a échoué. Réessayez depuis le message.",
      });
    }
  },
);

// --- PÉTITION ---
export const updatePetitionStats = onDocumentWritten(
  { document: "signatures/{sigId}", database: "ecole-db" },
  async (event) => {
    try {
      const snapshot = await getFirestore("ecole-db").collection("signatures").get();

      let validSignatures: any[] = [];
      let habitantsKergrist = 0;
      let parentsEleves = 0;
      let communesVoisines = 0;
      let autres = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        validSignatures.push(data);

        const q = (data.qualite || "").toLowerCase();
        const v = (data.ville || "").toLowerCase();

        if (q.includes("habitant(e) de kergrist") || v.includes("kergrist")) {
          habitantsKergrist++;
        } else if (q.includes("parent")) {
          parentsEleves++;
        } else if (q.includes("voisine") || (v && !v.includes("kergrist"))) {
          communesVoisines++;
        } else {
          autres++;
        }
      });

      validSignatures.sort((a, b) => {
        const timeA = a.createdAt
          ? typeof a.createdAt.toMillis === "function"
            ? a.createdAt.toMillis()
            : 0
          : 0;
        const timeB = b.createdAt
          ? typeof b.createdAt.toMillis === "function"
            ? b.createdAt.toMillis()
            : 0
          : 0;
        return timeB - timeA;
      });

      const recentNames = validSignatures.slice(0, 10).map(formatPublicRecentSigner);

      // On déduplique la liste des noms récents pour l'affichage propre
      const dedupedRecent = [...new Set(recentNames)];

      await getFirestore("ecole-db")
        .collection("stats")
        .doc("petition")
        .set(
          {
            count: validSignatures.length,
            recent: dedupedRecent.slice(0, 10),
            breakdown: {
              habitantsKergrist,
              parentsEleves,
              communesVoisines,
              autres,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

      logger.info("Statistiques de la pétition recalculées avec succès.");
    } catch (error) {
      logger.error("Erreur lors du recalcul des stats de la pétition :", error);
    }
  },
);

export const updateMemberStats = onDocumentWritten(
  { document: "membres/{membreId}", database: "ecole-db" },
  async (event) => {
    try {
      const snapshot = await getFirestore("ecole-db")
        .collection("membres")
        .where("status", "==", "validated")
        .get();
      const count = snapshot.size;
      await getFirestore("ecole-db")
        .collection("stats")
        .doc("membres")
        .set(
          {
            count: Math.max(count, 51),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (err) {
      logger.error("Erreur lors de la mise à jour des stats membres:", err);
    }
  },
);
