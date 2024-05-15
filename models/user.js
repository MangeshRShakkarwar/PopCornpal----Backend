const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true, //trim removes extra whitespaces--> " abhi" is made "abhi"
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    role:{
        type:String,
        required:true,
        default:"user",
        enum:["admin", "user"]
    },
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie"}]
})

//to hash the password
userSchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 5)
    }

    next()
})

//to compare old and new password
userSchema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password)
    return result
}


//to export this  schema
// module.exports = userSchema --> this wont work
module.exports = mongoose.model("User", userSchema)