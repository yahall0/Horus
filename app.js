if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config()
}


const express = require("express")
const ejsmate = require("ejs-mate")
const path = require("path")
const mongoose = require("mongoose")
const sessions = require("express-session")
const MongoStore = require("connect-mongo")
const passport = require("passport")
const User = require("./models/user")
const flash = require("connect-flash")
const methodOverride = require("method-override")
require("./utils/passportGoogle")
const { isLoggedIn } = require("./utils/middleware")
const Complaint = require("./models/complaint")
// const Volunteer = require("./models/volunteer")
const swearDetect = require("swearjar")
const badWords = require("bad-words")


app = express()
app.set("view engine", 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"))
app.set("views", path.join(__dirname, 'views'))
app.engine('ejs', ejsmate)
app.use(express.static(path.join(__dirname, 'public')))

//connect to mongodb
mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to mongodb")
    })
    .catch(() => {
        console.log("Connection to mongodb could not be established")
    })

//Sessions and sessions store stuff

const sessionsStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'sadasd12ee21e32asda1d'
    }
})

const sessionConfig = {
    store: sessionsStore,
    secret: 'kjbuinjbsiuni313!@121',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,// expires after 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: false
    }
}
app.use(sessions(sessionConfig))
app.use(flash())

//passport Stuff

app.use(passport.initialize())
app.use(passport.session())

//setting up currentUser variable for ejs

app.use(async (req, res, next) => {
    res.locals.currentUser = null
    if (req.user) {
        const user = await User.findOne({ googleID: req.user.id })
        res.locals.currentUser = user// Session info of the user from passport
    }
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
})

app.get("/google/login", passport.authenticate('google', { scope: ['profile', 'email'] }), (req, res, next) => {
    req.session.save()
})

app.get("/oauth2/redirect/google", passport.authenticate('google', { keepSessionInfo: true }),
    (req, res) => {
        req.flash("success", "Welcome!")
        res.redirect('/')
    }
)

app.get("/google/logout", (req, res, next) => {
    req.logout(err => {
        if (err) {
            return next(err)
        }
        req.flash("success", "Logged out successfully")
        res.redirect("/")
    })
})

//homepage    
const mapboxToken = process.env.MAPBOX_TOKEN
app.get("/", async (req, res) => {
    const complaints = await Complaint.find({}).populate('author')
    let info = ""
    /*if(req.user != null)
    {
        info = "Note: Red Markers are your requests:p"
    }*/
    console.log(complaints)
    res.render("home.ejs", { mapboxToken, complaints, info })
})

//complaint page
app.get("/complaints/:complaintId", async (req, res) => {
    const id = req.params.complaintId.trim()
    const complaint = await Complaint.findById(id).populate('author');
    res.render("complaint.ejs", { mapboxToken, complaint})
})

//Add a complaint
app.get("/new", isLoggedIn, (req, res) => {
    res.render("new.ejs", { mapboxToken })
})

//receive complaint
app.post("/new", isLoggedIn, async (req, res) => {
    const author = await User.findOne({ googleID: req.user.id })
    const newComplaint = new Complaint({
        title: req.body.complaint.title,
        longitude: req.body.complaint.longitude,
        latitude: req.body.complaint.latitude,
        date: req.body.complaint.date,
        description: req.body.complaint.description,
        author: author._id
    })
    if (swearDetect.profane(newComplaint.title + " " + newComplaint.description)) {
        const error = "Profanity or explicit text in the title and/or description will not be accepted";
        return res.render("new.ejs", {mapboxToken, error});
    }
    await newComplaint.save()
    res.redirect("/")
 
})

//delete a complaint
app.delete("/:complaintId/delete", isLoggedIn, async (req, res) => {
    const complaint = await Complaint.findById(req.params.complaintId).populate('author')
    if (req.user.id == complaint.author.googleID) {
        await Complaint.deleteOne({ _id: req.params.complaintId })
        res.redirect("/")
    }
    else {
        res.send("Unauthorised Delete Attempt")
    }
})

//FAQ Page
app.get("/faq", (req, res) => {
    res.render("faq.ejs")
})

//report a complaint
// app.put("/:complaintId/report", isLoggedIn, async (req, res) => {
//     const id = req.params.complaintId.trim()
//     const complaint = await Complaint.findById(id).populate('author').populate(
//         {
//             path: "volunteers",
//             populate: {
//                 path: 'UserID',
//                 model: 'User'
//             }
//         }
//     );
//     const user = await User.findOne({ googleID: req.user.id })
//     request.reports.push(user)
//     if(request.reports.length >= 6)
//     {
//         Complaint.deleteOne(id)
//         res.redirect("/")
//     }
//     request.save()
//     res.redirect(`/requests/${req.params.requestId}`)
// })

//If page not found
/*app.all("*", (req, res, next) => {
    next(new ExpressErrors("NOT FOUND", 404))
})*/

app.listen(6942, () => {
    console.log("Listening on port 6942")
})

module.exports = app