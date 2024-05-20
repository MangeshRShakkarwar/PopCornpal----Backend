const mongoose = require('mongoose')

const reviewSchema = mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentMovie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    rating: {
        type: Number,
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    upvotes:{
        type: Number,
        default: 0
    },
    downvotes:{
        type: Number,
        default: 0
    },
    reviewTag:{
        type:String,
        default:"Neutral"
    }
})

module.exports = mongoose.model("Review", reviewSchema)