// backend/routes/healthExtended.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/health-extended', async (req, res) => {
  const results = {};

  // TomTom
  try {
    const tomtomResp = await axios.get('https://api.tomtom.com/traffic/services/5/incidentDetails?key=' + process.env.TOMTOM_API_KEY + '&bbox=-1.8,54.8,-1.4,55.1&fields=basicPoint');
    results.tomtom = tomtomResp.status === 200 ? '✅ Working' : '⚠️ Unexpected status ' + tomtomResp.status;
  } catch (err) {
    results.tomtom = '❌ ' + (err.response?.status || 'Error');
  }

  // HERE
  try {
    const hereResp = await axios.get('https://traffic.ls.hereapi.com/traffic/6.3/incidents.json?bbox=54.8,-1.8;55.1,-1.4&apiKey=' + process.env.HERE_API_KEY);
    results.here = hereResp.status === 200 ? '✅ Working' : '❌ ' + (err.response?.data?.error_description || err.response?.status || 'Error');
  } catch (err) {
    results.here = '❌ ' + (err.response?.data?.error_description || err.response?.status || 'Error');
  }

  // MapQuest
  try {
    const mapQuestResp = await axios.get('https://www.mapquestapi.com/traffic/v2/incidents?key=' + process.env.MAPQUEST_API_KEY + '&boundingBox=55.05,-2.10,54.75,-1.35');
    results.mapquest = mapQuestResp.status === 200 ? '✅ Working' : '⚠️ Unexpected status ' + mapQuestResp.status;
  } catch (err) {
    results.mapquest = '❌ ' + (err.response?.status || 'Error');
  }

  // National Highways
  try {
    const nhResp = await axios.get(process.env.NATIONAL_HIGHWAYS_API_URL, {
      headers: { 'Ocp-Apim-Subscription-Key': process.env.NATIONAL_HIGHWAYS_API_KEY }
    });
    results.nationalHighways = nhResp.status === 200 ? '✅ Working' : '⚠️ Unexpected status ' + nhResp.status;
  } catch (err) {
    results.nationalHighways = '❌ ' + (err.response?.data?.message || err.response?.status || 'Error');
  }

  res.json({
    status: 'Extended Health Check',
    results
  });
});

export default router;