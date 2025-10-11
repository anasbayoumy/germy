import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authenticateToken, requireCompanyAdminOrHigher } from '../middleware/auth.middleware';
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
  teamController.getTeams
);

router.get(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  teamController.getTeamById
);

router.post(
  '/',
  validateRequest(teamSchemas.createTeam),
  requireCompanyAdminOrHigher,
  teamController.createTeam
);

router.put(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.updateTeam),
  requireCompanyAdminOrHigher,
  teamController.updateTeam
);

router.delete(
  '/:id',
  validateParams(teamSchemas.teamIdParams),
  requireCompanyAdminOrHigher,
  teamController.deleteTeam
);

// Team member management routes
router.get(
  '/:id/members',
  validateParams(teamSchemas.teamIdParams),
  teamController.getTeamMembers
);

router.post(
  '/:id/members',
  validateParams(teamSchemas.teamIdParams),
  validateRequest(teamSchemas.addTeamMember),
  requireCompanyAdminOrHigher,
  teamController.addTeamMember
);

router.delete(
  '/:id/members/:userId',
  validateParams(teamSchemas.removeTeamMemberParams),
  requireCompanyAdminOrHigher,
  teamController.removeTeamMember
);

export default router;