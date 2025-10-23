import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { 
  authenticateToken, 
  requireCompanyAdminOrHigher,
  requireCompanyAdminOrSuperAdmin
} from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { departmentSchemas } from '../schemas/department.schemas';

const router = Router();
const departmentController = new DepartmentController();

// Apply authentication to all routes
router.use(authenticateToken);

// Department management routes
router.get(
  '/',
  validateQuery(departmentSchemas.getDepartmentsQuery),
  requireCompanyAdminOrSuperAdmin, // Only admins can view departments
  departmentController.getDepartments.bind(departmentController)
);

router.get(
  '/hierarchy',
  requireCompanyAdminOrSuperAdmin, // Only admins can view department hierarchy
  departmentController.getDepartmentHierarchy.bind(departmentController)
);

router.get(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can view department details
  departmentController.getDepartmentById.bind(departmentController)
);

router.post(
  '/',
  validateRequest(departmentSchemas.createDepartment),
  requireCompanyAdminOrSuperAdmin, // Only admins can create departments
  departmentController.createDepartment.bind(departmentController)
);

router.put(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  validateRequest(departmentSchemas.updateDepartment),
  requireCompanyAdminOrSuperAdmin, // Only admins can update departments
  departmentController.updateDepartment.bind(departmentController)
);

router.delete(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can delete departments
  departmentController.deleteDepartment.bind(departmentController)
);

// Department user management routes
router.get(
  '/:id/users',
  validateParams(departmentSchemas.departmentIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can view department users
  departmentController.getDepartmentUsers.bind(departmentController)
);

router.post(
  '/:id/users',
  validateParams(departmentSchemas.departmentIdParams),
  validateRequest(departmentSchemas.addDepartmentUser),
  requireCompanyAdminOrSuperAdmin, // Only admins can add users to departments
  departmentController.addDepartmentUser.bind(departmentController)
);

router.delete(
  '/:id/users/:userId',
  validateParams(departmentSchemas.removeDepartmentUserParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can remove users from departments
  departmentController.removeDepartmentUser.bind(departmentController)
);

export default router;