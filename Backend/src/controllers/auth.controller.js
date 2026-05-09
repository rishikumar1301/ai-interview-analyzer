const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenBlacklistModel = require('../models/blacklist.model');


/**
 * @route POST /api/auth/register
 * @desc Register a new user, expects username, email and password
 * @access Public   
 */
async function registerUserController(req, res) {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const isUserExist = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    });
    if (isUserExist) {
        return res.status(400).json({
            message: 'Username or email already exists'
        });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
        username,
        email,
        password: hash
    })
    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
    )

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 24 * 60 * 60 * 1000
    })

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })






}

/**
 * @route POST /api/auth/login
 * @desc Login a user, expects email and password
 * @access Public
 */

async function loginUserController(req, res) {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(400).json({
            message: 'Invalid email or password'
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            message: 'Invalid email or password'
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
    )

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge: 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: 'User loggedIn successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })

}

/**
 * @route POST /api/auth/logout
 * @desc clear the token from user's cookie and add the token in blacklist
 * @access Public 
 */

async function logoutUserController(req, res) {
    const token = req.cookies.token;
    if (token) {
        await tokenBlacklistModel.create({ token });

    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
    })
    res.status(200).json({
        message: 'User logged out successfully'
    })

}

/**
 * @route GET /api/auth/get-me
 * @desc Get the current logged in user's details
 * @access Private
 */

async function getmeController(req, res) {
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: 'User details fetched successfully',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getmeController,
}