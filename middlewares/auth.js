const jwt = require('jsonwebtoken')
const User = require('../models/user')

exports.isAuth = async (req, res, next) => {
    const token = req.headers?.authorization
    const jwtToken = token.split('Bearer ')[1]
    if (!jwtToken) return res.status(404).json({ error: "Invalid Token" })

    //verify the token
    try {
        const decode = jwt.verify(jwtToken, process.env.SECRET_KEY)
        const { userID } = decode
        const user = await User.findById(userID)
        if (!user) return res.status(404).json({ error: "User Not Found" })

        req.user = user
        next()
    } catch (error) {
        console.log("Cant verify...", error)
    }
}

exports.isAdmin = async (req, res, next) => {

    const { user } = req;
    if (user.role !== 'admin') return res.status(500).json({ error: "Unauthorized Access!" })
    next()
}