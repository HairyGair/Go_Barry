import express from 'express';
import emailGroupsAPI from './emailGroupsAPI.js';
import roadworkAlertsAPI from './roadworkAlertsAPI.js';
import microsoftAPI from './microsoftAPI.js';
import sharePointAPI from './sharePointAPI.js';

const router = express.Router();

// Mount sub-routers
router.use('/email-groups', emailGroupsAPI);
router.use('/roadwork-alerts', roadworkAlertsAPI);
router.use('/microsoft', microsoftAPI);
router.use('/sharepoint', sharePointAPI);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'communications',
    endpoints: [
      '/email-groups',
      '/roadwork-alerts',
      '/microsoft',
      '/sharepoint'
    ]
  });
});

export default router;
