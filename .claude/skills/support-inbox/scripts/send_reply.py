#!/usr/bin/env python3
"""Send a reply from the support inbox (SMTP, Zoho Mail).

Usage:
    python send_reply.py --to someone@example.com --subject "Re: ..." \
        --body-file /path/to/body.txt [--in-reply-to "<msgid>"] [--cc extra@example.com]

Body is read from a file so multi-line/quoted content doesn't fight shell quoting.
Always dry-run first with --dry-run to print the message instead of sending.
"""
import argparse
import os
import smtplib
from email.message import EmailMessage

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDS_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), "credentials.env")


def load_creds():
    creds = {}
    with open(CREDS_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            creds[k.strip()] = v.strip()
    return creds


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--to", required=True)
    parser.add_argument("--subject", required=True)
    parser.add_argument("--body-file", required=True)
    parser.add_argument("--cc", default=None)
    parser.add_argument("--in-reply-to", default=None, help="Message-ID being replied to, for threading")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    creds = load_creds()
    with open(args.body_file) as f:
        body = f.read()

    msg = EmailMessage()
    msg["From"] = creds["SUPPORT_EMAIL"]
    msg["To"] = args.to
    if args.cc:
        msg["Cc"] = args.cc
    msg["Subject"] = args.subject
    if args.in_reply_to:
        msg["In-Reply-To"] = args.in_reply_to
        msg["References"] = args.in_reply_to
    msg.set_content(body)

    if args.dry_run:
        print(msg.as_string())
        return

    with smtplib.SMTP_SSL(creds["SMTP_HOST"], int(creds["SMTP_PORT"])) as smtp:
        smtp.login(creds["SUPPORT_EMAIL"], creds["SUPPORT_PASSWORD"])
        smtp.send_message(msg)

    print(f"Sent to {args.to}")


if __name__ == "__main__":
    main()
