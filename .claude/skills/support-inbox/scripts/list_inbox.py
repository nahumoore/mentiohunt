#!/usr/bin/env python3
"""List recent messages in the support inbox (IMAP, Zoho Mail).

Usage:
    python list_inbox.py [--folder INBOX] [--limit 20] [--unseen-only]

Prints one JSON object per line to stdout: {uid, from, subject, date, seen, snippet}
Credentials are read from credentials.env next to this script.
"""
import argparse
import email
import imaplib
import json
import os
from email.header import decode_header
from email.utils import parsedate_to_datetime

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


def snippet(msg, max_len=300):
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain" and not part.get_filename():
                payload = part.get_payload(decode=True) or b""
                charset = part.get_content_charset() or "utf-8"
                text = payload.decode(charset, errors="replace")
                return text.strip()[:max_len]
        return ""
    payload = msg.get_payload(decode=True) or b""
    charset = msg.get_content_charset() or "utf-8"
    return payload.decode(charset, errors="replace").strip()[:max_len]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", default="INBOX")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--unseen-only", action="store_true")
    args = parser.parse_args()

    creds = load_creds()
    conn = imaplib.IMAP4_SSL(creds["IMAP_HOST"], int(creds["IMAP_PORT"]))
    conn.login(creds["SUPPORT_EMAIL"], creds["SUPPORT_PASSWORD"])
    conn.select(args.folder)

    criteria = "UNSEEN" if args.unseen_only else "ALL"
    status, data = conn.search(None, criteria)
    if status != "OK":
        raise SystemExit(f"IMAP search failed: {status}")

    uids = data[0].split()
    uids = uids[-args.limit:]

    for uid in reversed(uids):
        status, msg_data = conn.fetch(uid, "(RFC822 FLAGS)")
        if status != "OK":
            continue
        raw = msg_data[0][1]
        flags_raw = str(msg_data[0][0])
        msg = email.message_from_bytes(raw)
        date_str = msg.get("Date")
        try:
            date_iso = parsedate_to_datetime(date_str).isoformat() if date_str else None
        except Exception:
            date_iso = date_str
        print(json.dumps({
            "uid": uid.decode(),
            "from": decode(msg.get("From")),
            "subject": decode(msg.get("Subject")),
            "date": date_iso,
            "seen": "\\Seen" in flags_raw,
            "snippet": snippet(msg),
        }))

    conn.close()
    conn.logout()


if __name__ == "__main__":
    main()
