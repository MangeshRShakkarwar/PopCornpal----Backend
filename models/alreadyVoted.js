const mongoose = require('mongoose')

const alreadyVotedSchema = mongoose.Schema({
    votedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    votedOn: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
        required: true
    }
})

module.exports = mongoose.model("Alreadyvoted", alreadyVotedSchema)