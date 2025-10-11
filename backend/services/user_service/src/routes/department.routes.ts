import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import { authenticateToken, requireCompanyAdminOrHigher } from '../middleware/auth.middleware';
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
  departmentController.getDepartments
);

router.get(
  '/hierarchy',
  departmentController.getDepartmentHierarchy
);

router.get(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  departmentController.getDepartmentById
);

router.post(
  '/',
  validateRequest(departmentSchemas.createDepartment),
  requireCompanyAdminOrHigher,
  departmentController.createDepartment
);

router.put(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  validateRequest(departmentSchemas.updateDepartment),
  requireCompanyAdminOrHigher,
  departmentController.updateDepartment
);

router.delete(
  '/:id',
  validateParams(departmentSchemas.departmentIdParams),
  requireCompanyAdminOrHigher,
  departmentController.deleteDepartment
);

// Department user management routes
router.get(
  '/:id/users',
  validateParams(departmentSchemas.departmentIdParams),
  departmentController.getDepartmentUsers
);

router.post(
  '/:id/users',
  validateParams(departmentSchemas.departmentIdParams),
  validateRequest(departmentSchemas.addDepartmentUser),
  requireCompanyAdminOrHigher,
  departmentController.addDepartmentUser
);

router.delete(
  '/:id/users/:userId',
  validateParams(departmentSchemas.removeDepartmentUserParams),
  requireCompanyAdminOrHigher,
  departmentController.removeDepartmentUser
);

export default router;