export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', service: 'solve-apollo-webhook' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;
    const person = payload?.person || payload;
    const email = (person?.email || '').toLowerCase();
    const phoneNumbers = person?.phone_numbers || [];
    const phone = phoneNumbers.length > 0
      ? phoneNumbers[0]?.sanitized_number || phoneNumbers[0]?.raw_number || ''
      : '';

    if (!phone) {
      return res.status(200).json({ received: true, phone_found: false });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(200).json({ received: true, stored: false, reason: 'no_credentials' });
    }

    const updateResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/contact_master?email=eq.${encodeURIComponent(email)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ phone: phone })
      }
    );

    const updated = await updateResponse.json();

    return res.status(200).json({
      received: true,
      phone_found: true,
      phone: phone,
      email: email,
      rows_updated: updated.length || 0
    });

  } catch (err) {
    return res.status(200).json({ received: true, error: err.message });
  }
}
