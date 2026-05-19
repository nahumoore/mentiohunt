interface MentiohuntEmailTemplateProps {
  subject: string
  body: string
  previewText?: string
  footerReason?: string
  unsubscribeUrl?: string
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function mentiohuntTemplate({
  subject,
  body,
  previewText = "",
  footerReason = "You received this email because you signed up for Mentiohunt.",
  unsubscribeUrl,
}: MentiohuntEmailTemplateProps): { subject: string; html: string } {
  const escapedSubject = escapeHtml(subject)
  const escapedPreviewText = escapeHtml(previewText)
  const escapedFooterReason = escapeHtml(footerReason)
  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#8A8178; text-decoration:underline;">Unsubscribe</a><span>&nbsp;&middot;&nbsp;</span>`
    : ""

  const html = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapedSubject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #F6F2ED; }
    table { border-collapse: collapse; border-spacing: 0; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    a { color: #CF4820; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#F6F2ED; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; mso-hide:all;">
    ${escapedPreviewText}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F6F2ED;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:14px; overflow:hidden; border:1px solid #EEE2D8;">
          <tr>
            <td height="5" style="height:5px; background-color:#CF4820; font-size:0; line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding:34px 48px 28px; border-bottom:1px solid #EFE6DD;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="34" height="34" align="center" valign="middle" style="width:34px; height:34px; border-radius:10px; background-color:#CF4820; color:#FFFFFF; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:18px; font-weight:700; line-height:34px;">
                    M
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <span style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:17px; font-weight:700; color:#1A1614; letter-spacing:-0.2px;">Mentiohunt</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding:42px 48px 40px;">
              ${body}
              <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#4A413B; margin:36px 0 0; line-height:1.7;">
                Cheers,<br>
                Nico<br>
                Founder, Mentiohunt
              </p>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding:24px 48px; border-top:1px solid #EFE6DD; background-color:#FBF8F5;">
              <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; color:#8A8178; margin:0 0 8px; line-height:1.6;">
                ${escapedFooterReason}
              </p>
              <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; color:#8A8178; margin:0; line-height:1.6;">
                ${unsubscribeLink}<a href="https://mentiohunt.com/privacy" style="color:#8A8178; text-decoration:underline;">Privacy Policy</a><span>&nbsp;&middot;&nbsp;</span><a href="https://mentiohunt.com" style="color:#8A8178; text-decoration:underline;">mentiohunt.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
