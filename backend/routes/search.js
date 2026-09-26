import express from 'express';
import { auth } from '../middleware/auth.js';
import { searchUsers, globalSearch } from '../controllers/searchController.js';

const router = express.Router();

// GET /api/search/users - Search users globally
router.get('/users', auth, searchUsers);

// GET /api/search/global - Global search across all content
router.get('/global', auth, globalSearch);

export default router;
