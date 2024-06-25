const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createUser, getUserByUsername, getPublicRoutinesByUser, getAllRoutinesByUser, getUser, getAllUsers } = require('../db');
const { requireUser } = require('./utils');
const { JWT_SECRET = 'neverTell' } = process.env;

// POST /api/users/login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    return next({
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password'
    });
  }

  try {
    const user = await getUser({ username, password });
    if (!user) {
      return next({
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect',
      });
    } else {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1w' });
      res.send({ user, message: "you're logged in!", token });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/users/register
router.post('/register', async (req, res, next) => {
  console.log('Request body:', req.body); // Debug statement

  const { username, password } = req.body;

  if (!username || !password) {
    return next({
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password'
    });
  }

  if (password.length < 8) {
    return next({
      name: 'PasswordLengthError',
      message: 'Password Too Short!'
    });
  }

  try {
    const queriedUser = await getUserByUsername(username);
    if (queriedUser) {
      res.status(401);
      return next({
        name: 'UserExistsError',
        message: 'A user by that username already exists'
      });
    }

    const user = await createUser({
      username,
      password
    });
    if (!user) {
      return next({
        name: 'UserCreationError',
        message: 'There was a problem registering you. Please try again.',
      });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1w' });
    res.send({ user, message: "you're signed up!", token });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/me
router.get('/me', requireUser, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:username/routines
router.get('/:username/routines', async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await getUserByUsername(username);
    if (!user) {
      return next({
        name: 'NoUser',
        message: `Error looking up user ${username}`
      });
    } else if (req.user && user.id === req.user.id) {
      const routines = await getAllRoutinesByUser({ username: username });
      res.send(routines);
    } else {
      const routines = await getPublicRoutinesByUser({ username: username });
      res.send(routines);
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

