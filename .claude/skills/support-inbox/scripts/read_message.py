#!/usr/bin/env python3
"""Fetch and print the full body + headers of one message by UID.

Usage:
    python read_message.py <uid> [--folder INBOX]
"""
import argparse
import email
import imaplib
import os
from email.header import decode_header

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


def decode(value):
    if not value:
        return ""
    parts = decode_header(value)
    out = []
    for text, enc in parts:
        if isinstance(text, bytes):
            out.append(text.decode(enc or "utf-8", errors="replace"))
        else:
            out.append(text)
    return "".join(out)


def body_text(msg):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain" and not part.get_filename():
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        for part in msg.walk():
            if part.get_content_type() == "text/html" and not part.get_filename():
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                return payload.decode(charset, errors="replace")
        return ""
    payload = msg.get_payload(decode=True) or b""
    charset = msg.get_content_charset() or "utf-8"
    return payload.decode(charset, errors="replace")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("uid")
    parser.add_argument("--folder", default="INBOX")
    args = parser.parse_args()

    creds = load_creds()
    conn = imaplib.IMAP4_SSL(creds["IMAP_HOST"], int(creds["IMAP_PORT"]))
    conn.login(creds["SUPPORT_EMAIL"], creds["SUPPORT_PASSWORD"])
    conn.select(args.folder)

    status, msg_data = conn.fetch(args.uid.encode(), "(RFC822)")
    if status != "OK" or not msg_data or msg_data[0] is None:
        raise SystemExit(f"Could not fetch uid {args.uid}")

    msg = email.message_from_bytes(msg_data[0][1])
    print(f"From: {decode(msg.get('From'))}")
    print(f"To: {decode(msg.get('To'))}")
    print(f"Subject: {decode(msg.get('Subject'))}")
    print(f"Date: {msg.get('Date')}")
    print(f"Message-ID: {msg.get('Message-ID')}")
    print("---")
    print(body_text(msg))

    conn.close()
    conn.logout()


if __name__ == "__main__":
    main()
