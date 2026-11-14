from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import requests

BOT_TOKEN = "ВСТАВЬ_СЮДА_ТОКЕН_БОТА"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/invoice")
async def create_invoice(request: Request):
    data = await request.json()
    stars = int(data.get("stars", 50))
    tier = data.get("tier", "start")
    titles = {
        "start": "VIP Старт (+100 000 $AERO)",
        "magnat": "VIP Магнат (+500 000 $AERO)",
        "oligarch": "VIP Олигарх (+2 000 000 $AERO)"
    }

    url = f"https://telegram.org{BOT_TOKEN}/createInvoiceLink"
    payload = {
        "title": titles.get(tier, "VIP AeroEmpire"),
        "description": "Множитель дохода и приоритет на листинг 1 декабря",
        "payload": f"vip_{tier}_{stars}",
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": "VIP Доступ", "amount": stars}]
    }

    res = requests.post(url, json=payload).json()
    return {"invoice_link": res.get("result")}
