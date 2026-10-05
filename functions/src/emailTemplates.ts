export const getEmailFooter = (html: boolean = true) => {
  const siteUrl = "https://collectif-ecole-km.web.app/";
  const logoUrl = "https://collectif-ecole-km.web.app/images/logo.png";

  if (!html) {
    return `
Bien amicalement,
Axelle & Malo
Pour le collectif citoyen « Un nid tout neuf pour nos écureuils »
🌐 ${siteUrl}

---
Ce message vous a été envoyé car vous avez rejoint le collectif citoyen. Si c'est une erreur, vous pouvez l'ignorer.`;
  }

  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #ecfdf5;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="60" style="padding-right: 15px; vertical-align: middle;">
            <img src="${logoUrl}" alt="Logo Collectif" width="60" height="60" style="border-radius: 50%; display: block; border: 1px solid #e5e7eb;">
          </td>
          <td style="vertical-align: middle;">
            <p style="margin: 0 0 4px 0; font-weight: bold; color: #059669; font-size: 15px;">Axelle & Malo</p>
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #4b5563;">Pour le collectif citoyen « Un nid tout neuf pour nos écureuils »</p>
            <a href="${siteUrl}" style="color: #059669; text-decoration: none; font-size: 13px; font-weight: bold;">🌐 collectif-ecole-km.web.app</a>
          </td>
        </tr>
      </table>
    </div>
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="font-size: 11px; color: #9ca3af; margin: 0;">Ce message vous a été envoyé car vous avez rejoint le collectif citoyen.</p>
    </div>
  `;
};

export const getBaseHtmlTemplate = (content: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      ${content}
      ${getEmailFooter(true)}
    </body>
    </html>
  `;
};
