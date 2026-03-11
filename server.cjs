const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const ANTHROPIC_KEY = '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';
const TRIPADVISOR_KEY = '933FD617F7084CB7BE1F27E8D4B69FDA';
const YELP_API_KEY = 'eDbgUAuTD5lwx1RiypE0HRTSfJ4XIISfdlnlmD7YujLLA6mFpQzdEl2gxofBYB5ycOsgV8uIHVQV2-9a5Nv7TpUXCfGDCemsBkYb7MiqyZmvjl2lGBXanV_01XWxaXYx';
const SUPABASE_URL = 'https://vwuekpxqswohphcnqyzl.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dWVrcHhxc3dvaHBoY25xeXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwOTAzODcsImV4cCI6MjA4ODY2NjM4N30.VhS3kaGBlj58CRs_te30vVcNz5gXiPf0qduUhOAdNx8';
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
};

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 300, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await response.json();
    res.json({ text: data.content[0].text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tripadvisor/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await fetch(
      'https://api.content.tripadvisor.com/api/v1/location/search?searchQuery=' + encodeURIComponent(query) + '&category=restaurants&language=fr&key=' + TRIPADVISOR_KEY,
      { headers: { 'accept': 'application/json' } }
    );
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tripadvisor/reviews/:locationId', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.content.tripadvisor.com/api/v1/location/' + req.params.locationId + '/reviews?language=fr&key=' + TRIPADVISOR_KEY,
      { headers: { 'accept': 'application/json' } }
    );
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function syncRestaurantTripAdvisor(restaurantId, locationId) {
  try {
    const taData = await (await fetch('https://api.content.tripadvisor.com/api/v1/location/' + locationId + '/reviews?language=fr&key=' + TRIPADVISOR_KEY, { headers: { 'accept': 'application/json' } })).json();
    const existingAvis = await (await fetch(SUPABASE_URL + '/avis?restaurant_id=eq.' + restaurantId + '&plateforme=eq.tripadvisor', { headers: SB_HEADERS })).json();
    const existingTexts = new Set(existingAvis.map(function(a) { return a.texte; }));
    let newCount = 0;
    for (const rev of (taData.data || [])) {
      const texte = rev.text || rev.title || '';
      if (existingTexts.has(texte)) continue;
      await fetch(SUPABASE_URL + '/avis', { method: 'POST', headers: Object.assign({}, SB_HEADERS, { 'Prefer': 'return=minimal' }), body: JSON.stringify({ restaurant_id: restaurantId, plateforme: 'tripadvisor', auteur: rev.user && rev.user.username ? rev.user.username : 'Anonyme', note: rev.rating || 3, texte: texte, date_avis: rev.published_date || new Date().toISOString(), repondu: false, reponse: null }) });
      newCount++;
    }
    if (newCount > 0) console.log('[TA-sync] ' + newCount + ' nouveaux avis pour ' + restaurantId);
  } catch (e) { console.error('[TA-sync] Erreur:', e.message); }
}

app.post('/api/tripadvisor/sync', async (req, res) => {
  const { restaurantId, locationId } = req.body;
  try {
    await fetch(SUPABASE_URL + '/restaurants?id=eq.' + restaurantId, { method: 'PATCH', headers: Object.assign({}, SB_HEADERS, { 'Prefer': 'return=minimal' }), body: JSON.stringify({ tripadvisor_location_id: locationId }) });
    await syncRestaurantTripAdvisor(restaurantId, locationId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/yelp/search', async (req, res) => {
  const { query } = req.query;
  try {
    const response = await fetch(
      'https://api.yelp.com/v3/businesses/search?term=' + encodeURIComponent(query) + '&location=Montreal&limit=5&locale=fr_CA',
      { headers: { 'Authorization': 'Bearer ' + YELP_API_KEY } }
    );
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/yelp/reviews/:businessId', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.yelp.com/v3/businesses/' + req.params.businessId + '/reviews?limit=20&locale=fr_CA',
      { headers: { 'Authorization': 'Bearer ' + YELP_API_KEY } }
    );
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

async function syncRestaurantYelp(restaurantId, yelpBusinessId) {
  try {
    const data = await (await fetch('https://api.yelp.com/v3/businesses/' + yelpBusinessId + '/reviews?limit=20&locale=fr_CA', { headers: { 'Authorization': 'Bearer ' + YELP_API_KEY } })).json();
    const existingAvis = await (await fetch(SUPABASE_URL + '/avis?restaurant_id=eq.' + restaurantId + '&plateforme=eq.yelp', { headers: SB_HEADERS })).json();
    const existingTexts = new Set(existingAvis.map(function(a) { return a.texte; }));
    let newCount = 0;
    for (const rev of (data.reviews || [])) {
      const texte = rev.text || '';
      if (existingTexts.has(texte)) continue;
      await fetch(SUPABASE_URL + '/avis', { method: 'POST', headers: Object.assign({}, SB_HEADERS, { 'Prefer': 'return=minimal' }), body: JSON.stringify({ restaurant_id: restaurantId, plateforme: 'yelp', auteur: rev.user && rev.user.name ? rev.user.name : 'Anonyme', note: rev.rating || 3, texte: rev.text || '', date_avis: rev.time_created || new Date().toISOString(), repondu: false, reponse: null }) });
      newCount++;
    }
    if (newCount > 0) console.log('[Yelp-sync] ' + newCount + ' nouveaux avis pour ' + restaurantId);
  } catch (e) { console.error('[Yelp-sync] Erreur:', e.message); }
}

app.post('/api/yelp/sync', async (req, res) => {
  const { restaurantId, businessId } = req.body;
  try {
    await fetch(SUPABASE_URL + '/restaurants?id=eq.' + restaurantId, { method: 'PATCH', headers: Object.assign({}, SB_HEADERS, { 'Prefer': 'return=minimal' }), body: JSON.stringify({ yelp_business_id: businessId }) });
    await syncRestaurantYelp(restaurantId, businessId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

setInterval(syncRestaurantTripAdvisor, 60 * 60 * 1000);
setInterval(syncRestaurantYelp, 60 * 60 * 1000);
console.log('[Auto-sync] Actif - TripAdvisor + Yelp toutes les heures');

app.listen(3001, () => console.log('Serveur IA sur http://localhost:3001'));