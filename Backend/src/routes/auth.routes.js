const{ Router } = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authRouter = Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */

authRouter.post('/register', authController.registerUserController);
/**
 * @route POST /api/auth/login
 * @desc Login a user with email and password
 * @access Public
 */
authRouter.post('/login', authController.loginUserController);

/**
 * @route POST /api/auth/logout
 * @desc clear the token from user's cookie and add the token in blacklist
 * @access Public
 */

authRouter.get('/logout', authController.logoutUserController);


/**
 * @route GET /api/auth/get-me
 * @desc Get the current logged in user's details
 * @access Private
 */

authRouter.get('/get-me', authMiddleware.authUser, authController.getmeController);

module.exports = authRouter;