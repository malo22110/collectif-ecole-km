import * as nodemailer from "nodemailer";
import { defineSecret } from "firebase-functions/params";

export const smtpPassword = defineSecret("SMTP_PASSWORD");

const smtpUser = process.env.SMTP_USER || "contact@collectif-ecole-km.fr";
const smtpHost = process.env.SMTP_HOST || "mail.infomaniak.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);

if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
  throw new Error("SMTP_PORT doit être un port valide.");
}

export const mailFrom = {
  name: process.env.MAIL_FROM_NAME || "Collectif Kergrist-Moëlou",
  address: process.env.MAIL_FROM_ADDRESS || smtpUser
};

export function createMailTransport() {
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword.value()
    }
  });
}