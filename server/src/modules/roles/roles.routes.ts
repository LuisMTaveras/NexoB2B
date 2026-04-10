import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import * as Controller from './roles.controller';
import { createRoleSchema, updateRoleSchema } from './roles.schemas';

const router = Router();

router.use(authenticate);

router.get('/permissions', requirePermission('role:manage'), Controller.listPermissions);
router.get('/', requirePermission('team:view'), Controller.listRoles);
router.post('/', requirePermission('role:manage'), validate(createRoleSchema), Controller.createRole);
router.patch('/:id', requirePermission('role:manage'), validate(updateRoleSchema), Controller.updateRole);
router.delete('/:id', requirePermission('role:manage'), Controller.deleteRole);

export default router;
