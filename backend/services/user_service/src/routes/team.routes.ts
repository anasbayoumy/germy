import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { 
  authenticateToken, 
  requireCompanyAdminOrHigher,
  requireCompanyAdminOrSuperAdmin
} from '../middleware/auth.middleware';
import { validateRequest, validateQuery, validateParams } from '../middleware/validation.middleware';
import { teamSchemas } from '../schemas/team.schemas';

const router = Router();
const teamController = new TeamController();

// Apply authentication to all routes
router.use(authenticateToken);

// Team management routes
router.get(
  '/',
  validateQuery(teamSchemas.getTeamsQuery),
  requireCompanyAdminOrSuperAdmin, // Only admins can view teams
  teamController.getTeams.bind(teamController)
);

router.get(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can view team details
  teamController.getTeamById.bind(teamController)
);

router.post(
  '/',
  validateRequest(teamSchemas.createTeam),
  requireCompanyAdminOrSuperAdmin, // Only admins can create teams
  teamController.createTeam.bind(teamController)
);

router.put(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.updateTeam),
  requireCompanyAdminOrSuperAdmin, // Only admins can update teams
  teamController.updateTeam.bind(teamController)
);

router.delete(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can delete teams
  teamController.deleteTeam.bind(teamController)
);

// Team member management routes
router.get(
  '/:id/members',
  validateParams(teamSchemas.teamIdParams),
  validateQuery(teamSchemas.getTeamMembersQuery),
  requireCompanyAdminOrSuperAdmin, // Only admins can view team members
  teamController.getTeamMembers.bind(teamController)
);

router.post(
  '/:id/members',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.addTeamMember),
  requireCompanyAdminOrSuperAdmin, // Only admins can add team members
  teamController.addTeamMember.bind(teamController)
);

router.put(
  '/:id/members/:userId',
  validateParams(teamSchemas.updateTeamMember),
  validateRequest(teamSchemas.updateTeamMember),
  requireCompanyAdminOrSuperAdmin, // Only admins can update team members
  teamController.updateTeamMember.bind(teamController)
);

router.delete(
  '/:id/members/:userId',
  validateParams(teamSchemas.removeTeamMemberParams),
  requireCompanyAdminOrSuperAdmin, // Only admins can remove team members
  teamController.removeTeamMember.bind(teamController)
);

// Bulk team member operations
router.post(
  '/:id/members/bulk',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.bulkAddTeamMembers),
  requireCompanyAdminOrSuperAdmin, // Only admins can add multiple members
  teamController.bulkAddTeamMembers.bind(teamController)
);

router.delete(
  '/:id/members/bulk',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.bulkRemoveTeamMembers),
  requireCompanyAdminOrSuperAdmin, // Only admins can remove multiple members
  teamController.bulkRemoveTeamMembers.bind(teamController)
);

// Team analytics and export
router.get(
  '/:id/analytics',
  validateParams(teamSchemas.teamIdParams),
  validateQuery(teamSchemas.getTeamAnalytics),
  requireCompanyAdminOrSuperAdmin, // Only admins can view team analytics
  teamController.getTeamAnalytics.bind(teamController)
);

router.get(
  '/:id/export',
  validateParams(teamSchemas.teamIdParams),
  validateQuery(teamSchemas.exportTeamMembers),
  requireCompanyAdminOrSuperAdmin, // Only admins can export team data
  teamController.exportTeamMembers.bind(teamController)
);

export default router;