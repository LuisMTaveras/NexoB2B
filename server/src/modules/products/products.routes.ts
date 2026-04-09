import { Router } from 'express';
import { authenticate, requireInternalUser } from '../../middleware/auth';
import * as ProductsController from './products.controller';

const router = Router();

// Only internal admin users manage the master catalog via this endpoint
router.get('/', authenticate, requireInternalUser, ProductsController.getProducts);
router.patch('/:id/visibility', authenticate, requireInternalUser, ProductsController.updateProductVisibility);

export default router;
