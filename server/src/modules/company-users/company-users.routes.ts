import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import * as Controller from './company-users.controller';
import { inviteUserSchema, updateUserSchema } from './company-users.schemas';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('team:view'), Controller.listCompanyUsers);
router.post('/invite', requirePermission('team:manage'), validate(inviteUserSchema), Controller.inviteUser);
router.patch('/:id', requirePermission('team:manage'), validate(updateUserSchema), Controller.updateUser);
router.delete('/:id', requirePermission('team:manage'), Controller.removeUser);

export default router;
