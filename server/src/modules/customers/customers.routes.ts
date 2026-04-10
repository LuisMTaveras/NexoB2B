import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as CustomerController from './customers.controller';

const router = Router();

// Protected management routes
router.get('/', authenticate, CustomerController.listCustomers);
router.get('/me/team', authenticate, CustomerController.listMyTeam); // Get own team (Portal)
router.get('/export', authenticate, CustomerController.exportCustomers);
router.get('/:id', authenticate, CustomerController.getCustomerDetails);
router.patch('/:id', authenticate, CustomerController.updateCustomer); // Update customer (Admin)
router.post('/:customerId/invite', authenticate, CustomerController.inviteCustomerUser);
router.patch('/users/:userId/status', authenticate, CustomerController.updateCustomerUserStatus); // NEW: Manage user status

export default router;
