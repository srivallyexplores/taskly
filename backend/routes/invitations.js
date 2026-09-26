import express from 'express';
import { auth } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import {
  sendInvitation,
  getUserInvitations,
  getTeamInvitations,
  acceptInvitation,
  denyInvitation,
  cancelInvitation,
  getInvitation
} from '../controllers/invitationController.js';
import { badRequestResponse } from '../utils/response.js';

const router = express.Router();

// Validation middleware
const validateSendInvitation = [
  body('userId').isMongoId().withMessage('Valid user ID is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
  body('message').optional().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequestResponse(res, 'Validation failed', errors.array());
  }
  next();
};

// GET /api/invitations/user - Get user's invitations
router.get('/user', auth, getUserInvitations);

// GET /api/invitations/:invitationId - Get specific invitation
router.get('/:invitationId', auth, getInvitation);

// POST /api/invitations/:invitationId/accept - Accept invitation
router.post('/:invitationId/accept', auth, acceptInvitation);

// POST /api/invitations/:invitationId/deny - Deny invitation
router.post('/:invitationId/deny', auth, denyInvitation);

// DELETE /api/invitations/:invitationId - Cancel invitation
router.delete('/:invitationId', auth, cancelInvitation);

export default router;
