import { Router } from 'express';
import { getDashboardStats, getOnlineUsers } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, getDashboardStats);
router.get('/online', authenticate, getOnlineUsers);

export default router;
