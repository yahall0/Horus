const mongoose = require("mongoose")

const volunteerSchema = new mongoose.Schema({
    UserID : {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestId: {
        type: mongoose.Types.ObjectId,
        ref: 'Request',
        required: true
    }
})

const Volunteer = new mongoose.model("Volunteer", volunteerSchema)

module.exports = Volunteer