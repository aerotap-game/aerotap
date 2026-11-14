from http.server import BaseHTTPRequestHandler
import json
import requests

BOT_TOKEN = "ВСТАВЬ_СЮДА_ТОКЕН_БОТА"

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        data = json.loads(post_body)

        stars = int(data.get('stars', 50))
        tier = data.get('tier', 'start')
        titles = {
            'start': 'VIP Старт (+100 000 $AERO)',
            'magnat': 'VIP Магнат (+500 000 $AERO)',
            'oligarch': 'VIP Олигарх (+2 000 000 $AERO)'
        }

        url = f"https://telegram.org{BOT_TOKEN}/createInvoiceLink"
        payload = {
            "title": titles.get(tier, "VIP AeroEmpire"),
            "description": "Множитель дохода и приоритет на листинг 1 декабря",
            "payload": f"vip_{tier}_{stars}",
            "provider_token": "",
            "currency": "XTR",
            "prices": [{"label": "VIP Статус", "amount": stars}]
        }

        res = requests.post(url, json=payload).json()
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"invoice_link": res.get("result")}).encode())
