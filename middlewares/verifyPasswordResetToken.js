const PasswordResetToken = require('../models/passwordResetToken')

//creating our middleware function
exports.isValidPassResetToken = async (req,res,next) => {
    const {token, userID} = req.body

    //checking if there is any token or not for that user
    const resetToken = await PasswordResetToken.findOne({ownerID: userID})
    //if there is not
    if(!resetToken) {return res.status(404).json({error: 'Generate new token.'})}

    //if there is
    const matched = await resetToken.compareToken(token) //we defined compareToken function in models/passwordResetToken.js

    //if the token doesnt match
    if(!matched) {return res.status(401).json({error: 'Invalid access!'})}

    //if token is valid and matched
    req.resetToken = resetToken 
    next()
}