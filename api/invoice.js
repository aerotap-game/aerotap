export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const BOT_TOKEN = 'ВСТАВЬ_СЮДА_ТОКЕН_БОТА';
    const { stars = 50, tier = 'start' } = req.body || {};

    const titles = {
        start: 'VIP Старт (+100 000 $AERO)',
        magnat: 'VIP Магнат (+500 000 $AERO)',
        oligarch: 'VIP Олигарх (+2 000 000 $AERO)'
    };

    const tgRes = await fetch(`https://telegram.org{BOT_TOKEN}/createInvoiceLink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: titles[tier] || 'VIP AeroEmpire',
            description: 'Множитель дохода и приоритет на листинг 1 декабря',
            payload: `vip_${tier}_${stars}`,
            provider_token: '',
            currency: 'XTR',
            prices: [{ label: 'VIP Доступ', amount: Number(stars) }]
        })
    });

    const data = await tgRes.json();
    return res.status(200).json({ invoice_link: data.result });
}
