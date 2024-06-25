const express = require('express');
const router = express.Router();
const { updateRoutineActivity, canEditRoutineActivity, destroyRoutineActivity, getRoutineActivityById, getRoutineActivitiesByRoutine } = require('../db');
const client = require('../db/client');
const { requireUser, requiredNotSent } = require('./utils')

// GET /api/routines/:routineId/activities
router.get('/:routineId/activities', async (req, res, next) => {
  try {
    const { routineId } = req.params;
    const routineActivities = await getRoutineActivitiesByRoutine({ id: routineId });
    if (!routineActivities) {
      next({
        name: 'NotFound',
        message: `No activities found for routine ID ${routineId}`
      });
    } else {
      res.send(routineActivities);
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/routine_activities/:routineActivityId
router.patch('/:routineActivityId', requireUser, requiredNotSent({ requiredParams: ['count', 'duration'], atLeastOne: true }), async (req, res, next) => {
  try {
    const { routineActivityId } = req.params;
    const { count, duration } = req.body;

    console.log('Routine Activity ID:', routineActivityId); // Debug statement
    console.log('User ID:', req.user.id); // Debug statement

    // Check if the user can edit this routine activity
    const canEdit = await canEditRoutineActivity(routineActivityId, req.user.id);
    console.log('Can Edit:', canEdit); // Debug statement
    
    if (!canEdit) {
      res.status(403);
      return next({
        name: 'Unauthorized',
        message: 'You cannot edit this routine_activity!'
      });
    }

    // Update the routine activity
    const updatedRoutineActivity = await updateRoutineActivity({ id: routineActivityId, count, duration });
    res.send(updatedRoutineActivity);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/routine_activities/:routineActivityId
router.delete('/:routineActivityId', requireUser, async (req, res, next) => {
  try {
    const { routineActivityId } = req.params;
    console.log('Routine Activity ID:', routineActivityId); // Debug statement
    console.log('User ID:', req.user.id); // Debug statement

    // Check if the user can delete this routine activity
    const canEdit = await canEditRoutineActivity(routineActivityId, req.user.id);
    console.log('Can Edit:', canEdit); // Debug statement
    
    if (!canEdit) {
      res.status(403);
      return next({
        name: 'Unauthorized',
        message: 'You cannot delete this routine_activity!'
      });
    }

    // Delete the routine activity
    const deletedRoutineActivity = await destroyRoutineActivity(routineActivityId);
    res.send({ success: true, ...deletedRoutineActivity });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
