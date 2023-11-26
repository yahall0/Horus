const mongoose = require("mongoose")

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reports: [{
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }],
    // image: [{
    //     url: String,
    //     fileName: String
    // }],
    image: {
        url: String,
        fileName: String
    }
}) 

complaintSchema.virtual("properties.popUpMarker").get(function() {
    this.populate("author")
    return `${this.title}  ${this.date} ${this.author.username}`
})

const Complaint = mongoose.model("Complaint", complaintSchema)



module.exports = Complaint