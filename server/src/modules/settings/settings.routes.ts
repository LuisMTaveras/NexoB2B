import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as SettingsController from './settings.controller';

const router = Router();

router.get('/email', authenticate, SettingsController.getEmailConfig);
router.post('/email', authenticate, SettingsController.saveEmailConfig);
router.post('/email/test', authenticate, SettingsController.testEmailConfig);

export default router;
