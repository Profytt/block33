const express = require('express');
const router = express.Router();
const { getAllActivities, getActivityById, getActivityByName, createActivity, updateActivity, getPublicRoutinesByActivity } = require('../db');
const { requireUser, requiredNotSent } = require('./utils')

router.get('/:activityId', async (req, res, next) => {
  console.log('Request received at /activities/:activityId');
  console.log('Activity ID:', req.params.activityId); // Debug statement

  try {
    const { activityId } = req.params;
    const activity = await getActivityById(activityId);

    if (!activity) {
      console.log(`No activity found with ID ${activityId}`); // Debug statement
      return next({
        name: 'NotFound',
        message: `No activity found with ID ${activityId}`
      });
    }

    res.send(activity);
  } catch (error) {
    next(error);
  }
});

// GET /api/activities
router.get('/', async (req, res, next) => {
  try {
    const activities = await getAllActivities();
    res.send(activities);
  } catch (error) {
    next(error)
  }
})

// POST /api/activities
router.post('/', requireUser, requiredNotSent({requiredParams: ['name', 'description']}), async (req, res, next) => {
  try {
    const {name, description} = req.body;
    const existingActivity = await getActivityByName(name);
    if(existingActivity) {
      next({
        name: 'NotFound',
        message: `An activity with name ${name} already exists`
      });
    } else {
      const createdActivity = await createActivity({name, description});
      if(createdActivity) {
        res.send(createdActivity);
      } else {
        next({
          name: 'FailedToCreate',
          message: 'There was an error creating your activity'
        })
      }
    }
  } catch (error) {
    next(error);
  }
});

// PATCH /api/activities/:activityId
router.patch('/:activityId', requireUser, requiredNotSent({requiredParams: ['name', 'description'], atLeastOne: true}), async (req, res, next) => {
  try {
    const {activityId} = req.params;
    const existingActivity = await getActivityById(activityId);
    if(!existingActivity) {
      next({
        name: 'NotFound',
        message: `No activity by ID ${activityId}`
      });
    } else {
      const {name, description} = req.body;
      const updatedActivity = await updateActivity({id: activityId, name, description})
      if(updatedActivity) {
        res.send(updatedActivity);
      } else {
        next({
          name: 'FailedToUpdate',
          message: 'There was an error updating your activity'
        })
      }
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
