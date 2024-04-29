const express = require('express')

const { validate, userValidator, passwordValidator, signInValidator } = require("../middlewares/validator")
const { } = require("../middlewares/validator")

const { create, verifyEmail, forgetPassword, resetPassword, userSignIn, chat } = require("../controllers/user")

const { isValidPassResetToken } = require("../middlewares/verifyPasswordResetToken")
const { isAuth } = require('../middlewares/auth')

const router = express.Router()

router.post('/chat', chat)

router.post('/verify-email', verifyEmail) //route to email verification (token comparison actually)

router.post('/create', userValidator, validate, create) //create is the actual route handler/controller that will be executed if the request passes through the previous middlewares without errors.

router.post('/forget-password', forgetPassword)

router.post('/verify-pass-reset-token', isValidPassResetToken, (req, res) => {
    res.status(201).json({ valid: true })
})

router.post('/reset-password', isValidPassResetToken, passwordValidator, validate, resetPassword)
//isValidPassResetToken, passwordValidator, validate are middlewares; and resetPassword is the controller 

router.post('/sign-in', signInValidator, validate, userSignIn)

router.get('/is-auth', isAuth, (req, res) => {
    const { user } = req
    res.status(201).json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })
})


module.exports = router