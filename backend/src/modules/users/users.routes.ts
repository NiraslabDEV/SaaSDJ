import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { updateUserSchema } from './users.schemas';
import * as ctrl from './users.controller';

const router = Router();

router.get('/me', authenticate, ctrl.getMe);
router.patch('/me', authenticate, validate(updateUserSchema), ctrl.updateMe);
router.get('/artists', authenticate, ctrl.listArtists);
router.get('/artists/:id', authenticate, ctrl.getArtist);

export default router;
