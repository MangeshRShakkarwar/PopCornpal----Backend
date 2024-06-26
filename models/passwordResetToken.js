const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const passwordResetTokenSchema = mongoose.Schema({
    ownerID : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },
    token : {
        type: String,
        required:true,
    },
    expiryDate : {
        type: Date,
        expires: 3600, //minutes
        default: Date.now(),
    }
})

//the OTP needs to be hashed
passwordResetTokenSchema.pre("save", async function(next){
    if(this.isModified("token")){
        this.token = await bcrypt.hash(this.token, 5)
    }

    next()
})

passwordResetTokenSchema.methods.compareToken = async function (token) {
    const result = await bcrypt.compare(token, this.token)
    return result
}

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema)
