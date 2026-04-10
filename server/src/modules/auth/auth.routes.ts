import { Router } from 'express';
import { register, login, logout, me, updateProfile, changePassword, verifyInvitation, setupAccount } from './auth.controller';
import { validate } from '../../middleware/validator';
import { authenticate } from '../../middleware/auth';
import { registerSchema, loginSchema, updateProfileSchema, updatePasswordSchema } from './auth.schemas';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.put('/password', authenticate, validate(updatePasswordSchema), changePassword);

router.get('/invitation/verify/:token', verifyInvitation);
router.post('/invitation/setup', setupAccount);

export default router;
