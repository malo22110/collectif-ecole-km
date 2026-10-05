"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMemberStats = exports.updatePetitionStats = exports.envoyerReponseBoiteMail = exports.syncMailInbox = exports.checkScheduledMails = exports.envoyerSpreadMail = exports.envoyerMagicLink = exports.envoyerMailBienvenue = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const v2_1 = require("firebase-functions/v2");
const firestore_2 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const emailTemplates_1 = require("./emailTemplates");
const petitionPublicNames_1 = require("./petitionPublicNames");
const mailTransport_1 = require("./mailTransport");
const mailInboxSync_1 = require("./mailInboxSync");
const mailInboxUtils_1 = require("./mailInboxUtils");
(0, v2_1.setGlobalOptions)({ region: "europe-west9" });
exports.envoyerMailBienvenue = (0, firestore_2.onDocumentUpdated)({ document: "membres/{membreId}", database: "ecole-db", secrets: [mailTransport_1.smtpPassword] }, async (event) => {
    const membreAvant = event.data?.before.data();
    const membreApres = event.data?.after.data();
    if (!membreAvant || !membreApres)
        return;
    if (membreAvant.status === "pending" && membreApres.status === "validated") {
        if (!membreApres.email) {
            logger.error("Pas d'email trouvé pour le membre", event.params.membreId);
            return;
        }
        const transporter = (0, mailTransport_1.createMailTransport)();
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
            from: mailTransport_1.mailFrom,
            replyTo: mailTransport_1.mailFrom.address,
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
exports.envoyerMagicLink = (0, firestore_2.onDocumentCreated)({ document: "magicLinks/{linkId}", database: "ecole-db", secrets: [mailTransport_1.smtpPassword] }, async (event) => {
    const data = event.data?.data();
    if (!data || !data.email || data.status !== 'pending')
        return;
    const email = data.email;
    const redirectUrl = data.url || 'https://collectif-ecole-km.web.app/';
    try {
        const actionCodeSettings = {
            url: redirectUrl,
            handleCodeInApp: true,
        };
        // Génération du lien de connexion sécurisé
        const signinLink = await admin.auth().generateSignInWithEmailLink(email, actionCodeSettings);
        const transporter = (0, mailTransport_1.createMailTransport)();
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
        const htmlContent = (0, emailTemplates_1.getBaseHtmlTemplate)(htmlBodyContent);
        const mailOptions = {
            from: mailTransport_1.mailFrom,
            replyTo: mailTransport_1.mailFrom.address,
            to: email,
            subject: "Votre lien magique de connexion 🪄",
            text: textContent,
            html: htmlContent
        };
        await transporter.sendMail(mailOptions);
        logger.info(`Magic link envoyé à ${email}`);
        await event.data?.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    catch (error) {
        logger.error("Erreur lors de l'envoi du Magic Link :", error);
        await event.data?.ref.update({ status: 'error', error: String(error) });
    }
});
async function processSpreadMail(docSnap) {
    const data = await docSnap.ref.firestore.runTransaction(async (transaction) => {
        const current = await transaction.get(docSnap.ref);
        if (!current.exists || current.get("status") !== "pending")
            return null;
        transaction.update(docSnap.ref, {
            status: "sending",
            startedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return current.data();
    });
    if (!data)
        return;
    try {
        const transporter = (0, mailTransport_1.createMailTransport)();
        const subject = data.subject || "Nouvelle communication du collectif";
        const bodyContent = data.html || "<p>Message vide.</p>";
        const isTest = data.testMode === true;
        const deliverySnapshot = await docSnap.ref.collection("recipients").where("status", "==", "pending").limit(1000).get();
        const deliveries = deliverySnapshot.docs.filter(delivery => typeof delivery.get("email") === "string");
        if (deliveries.length === 0) {
            logger.info("Aucun destinataire trouvé pour ce mail.");
            await docSnap.ref.update({ status: "error", error: "Aucun destinataire éligible." });
            return;
        }
        const htmlContent = (0, emailTemplates_1.getBaseHtmlTemplate)(bodyContent);
        let sentCount = 0;
        let failedCount = 0;
        const firestore = (0, firestore_1.getFirestore)("ecole-db");
        for (const deliveryRef of deliveries) {
            const recipient = deliveryRef.data();
            const email = String(recipient.email).trim().toLowerCase();
            const mailOptions = {
                from: mailTransport_1.mailFrom,
                replyTo: mailTransport_1.mailFrom.address,
                to: email,
                subject: subject,
                html: htmlContent,
                headers: { "X-Collectif-Campaign-ID": docSnap.id }
            };
            try {
                const result = await transporter.sendMail(mailOptions);
                sentCount++;
                await deliveryRef.ref.update({ status: "sent", messageId: result.messageId, sentAt: admin.firestore.FieldValue.serverTimestamp() });
                const indexId = (0, mailInboxUtils_1.getMailMessageIndexId)(result.messageId);
                if (indexId) {
                    await firestore.collection("mailMessageIndex").doc(indexId).set({ threadId: docSnap.id, campaignId: docSnap.id })
                        .catch(error => logger.error("Impossible d’indexer le Message-ID de campagne.", error));
                }
                await docSnap.ref.update({
                    sentCount: admin.firestore.FieldValue.increment(1),
                    pendingCount: admin.firestore.FieldValue.increment(-1),
                    status: "sending"
                });
            }
            catch (err) {
                logger.error(`Erreur d'envoi à ${email}:`, err);
                failedCount++;
                await deliveryRef.ref.update({ status: "error", error: "Échec de livraison SMTP.", failedAt: admin.firestore.FieldValue.serverTimestamp() });
                await docSnap.ref.update({
                    failedCount: admin.firestore.FieldValue.increment(1),
                    pendingCount: admin.firestore.FieldValue.increment(-1),
                    status: "sending"
                });
            }
        }
        logger.info("Campagne traitée.", { sentCount, failedCount, testMode: isTest });
        await docSnap.ref.update({
            status: failedCount === 0 ? "sent" : sentCount > 0 ? "partial" : "error",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            sentCount,
            failedCount,
            error: failedCount ? "Une ou plusieurs livraisons ont échoué." : admin.firestore.FieldValue.delete()
        });
    }
    catch (error) {
        logger.error("Erreur lors de l'envoi du SpreadMail :", error);
        await docSnap.ref.update({ status: 'error', error: String(error) });
    }
}
exports.envoyerSpreadMail = (0, firestore_2.onDocumentWritten)({ document: "mailOutbox/{mailId}", database: "ecole-db", secrets: [mailTransport_1.smtpPassword] }, async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!event.data?.after.exists || !after || after.status !== "pending" || before?.status === "pending")
        return;
    // Si le mail est programmé dans le futur, on ne fait rien.
    // C'est le Cron Job qui s'en chargera.
    if (after.scheduledAt && after.scheduledAt.toDate() > new Date()) {
        logger.info(`Mail ${event.params.mailId} programmé pour plus tard. On ignore.`);
        return;
    }
    // Sinon, on envoie immédiatement.
    await processSpreadMail(event.data.after);
});
exports.checkScheduledMails = (0, scheduler_1.onSchedule)({ schedule: "every 5 minutes", secrets: [mailTransport_1.smtpPassword] }, async (event) => {
    const now = new Date();
    // Cherche les mails en attente dont la date de programmation est passée
    const snapshot = await (0, firestore_1.getFirestore)("ecole-db").collection("mailOutbox")
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
// [SPEC-MAIL-02] Synchronize the private Infomaniak inbox into the staff-only site mailbox.
exports.syncMailInbox = (0, scheduler_1.onSchedule)({ schedule: "every 5 minutes", secrets: [mailTransport_1.smtpPassword] }, async () => {
    await (0, mailInboxSync_1.syncInfomaniakInbox)();
});
// [SPEC-MAIL-02] Replies from the staff inbox are sent through the configured domain SMTP.
exports.envoyerReponseBoiteMail = (0, firestore_2.onDocumentCreated)({
    document: "mailInbox/{messageId}/replies/{replyId}",
    database: "ecole-db",
    secrets: [mailTransport_1.smtpPassword]
}, async (event) => {
    const replyRef = event.data?.ref;
    if (!replyRef)
        return;
    const firestore = (0, firestore_1.getFirestore)("ecole-db");
    const replyData = await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(replyRef);
        if (!snapshot.exists || snapshot.get("status") !== "pending")
            return null;
        transaction.update(replyRef, { status: "sending", startedAt: admin.firestore.FieldValue.serverTimestamp() });
        return snapshot.data();
    });
    if (!replyData)
        return;
    try {
        const recipient = typeof replyData.to === "string" ? replyData.to : "";
        const subject = typeof replyData.subject === "string" ? replyData.subject.slice(0, 500) : "Re: Votre message";
        const text = typeof replyData.text === "string" ? replyData.text.slice(0, 12000) : "";
        if (!recipient || !text)
            throw new Error("Réponse sans destinataire ou contenu.");
        const originalMessageId = typeof replyData.originalMessageId === "string" ? replyData.originalMessageId.trim() : "";
        const references = Array.isArray(replyData.originalReferences)
            ? replyData.originalReferences.filter((value) => typeof value === "string").slice(-10)
            : [];
        if (originalMessageId && !references.includes(originalMessageId))
            references.push(originalMessageId);
        const result = await (0, mailTransport_1.createMailTransport)().sendMail({
            from: mailTransport_1.mailFrom,
            replyTo: mailTransport_1.mailFrom.address,
            to: recipient,
            subject,
            text,
            headers: {
                ...(originalMessageId ? { "In-Reply-To": originalMessageId } : {}),
                ...(references.length ? { References: references.join(" ") } : {})
            }
        });
        const originalMessage = await replyRef.parent.parent?.get();
        const threadId = typeof originalMessage?.get("threadId") === "string"
            ? originalMessage.get("threadId")
            : replyRef.parent.parent?.id;
        const messageIndexId = (0, mailInboxUtils_1.getMailMessageIndexId)(result.messageId);
        if (messageIndexId && threadId) {
            await firestore.collection("mailMessageIndex").doc(messageIndexId).set({ threadId, inboxMessageId: replyRef.parent.parent?.id });
        }
        await replyRef.update({
            status: "sent",
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            smtpMessageId: result.messageId
        });
        await replyRef.parent.parent?.update({ latestReplyAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    catch (error) {
        logger.error("Erreur lors de l’envoi d’une réponse depuis la boîte de réception.", error);
        await replyRef.update({ status: "error", error: "L’envoi a échoué. Réessayez depuis le message." });
    }
});
// --- PÉTITION ---
exports.updatePetitionStats = (0, firestore_2.onDocumentWritten)({ document: "signatures/{sigId}", database: "ecole-db" }, async (event) => {
    try {
        const snapshot = await (0, firestore_1.getFirestore)("ecole-db").collection('signatures').get();
        let validSignatures = [];
        let habitantsKergrist = 0;
        let parentsEleves = 0;
        let communesVoisines = 0;
        let autres = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            validSignatures.push(data);
            const q = (data.qualite || "").toLowerCase();
            const v = (data.ville || "").toLowerCase();
            if (q.includes("habitant(e) de kergrist") || v.includes("kergrist")) {
                habitantsKergrist++;
            }
            else if (q.includes("parent")) {
                parentsEleves++;
            }
            else if (q.includes("voisine") || (v && !v.includes("kergrist"))) {
                communesVoisines++;
            }
            else {
                autres++;
            }
        });
        validSignatures.sort((a, b) => {
            const timeA = a.createdAt ? (typeof a.createdAt.toMillis === 'function' ? a.createdAt.toMillis() : 0) : 0;
            const timeB = b.createdAt ? (typeof b.createdAt.toMillis === 'function' ? b.createdAt.toMillis() : 0) : 0;
            return timeB - timeA;
        });
        const recentNames = validSignatures.slice(0, 10).map(petitionPublicNames_1.formatPublicRecentSigner);
        // On déduplique la liste des noms récents pour l'affichage propre
        const dedupedRecent = [...new Set(recentNames)];
        await (0, firestore_1.getFirestore)("ecole-db").collection('stats').doc('petition').set({
            count: validSignatures.length,
            recent: dedupedRecent.slice(0, 10),
            breakdown: {
                habitantsKergrist,
                parentsEleves,
                communesVoisines,
                autres
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        logger.info("Statistiques de la pétition recalculées avec succès.");
    }
    catch (error) {
        logger.error("Erreur lors du recalcul des stats de la pétition :", error);
    }
});
exports.updateMemberStats = (0, firestore_2.onDocumentWritten)({ document: "membres/{membreId}", database: "ecole-db" }, async (event) => {
    try {
        const snapshot = await (0, firestore_1.getFirestore)("ecole-db").collection('membres').where('status', '==', 'validated').get();
        const count = snapshot.size;
        await (0, firestore_1.getFirestore)("ecole-db").collection('stats').doc('membres').set({
            count: Math.max(count, 51),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }
    catch (err) {
        logger.error("Erreur lors de la mise à jour des stats membres:", err);
    }
});
//# sourceMappingURL=index.js.map