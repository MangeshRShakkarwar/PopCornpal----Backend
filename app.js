const express = require("express")
require('dotenv').config()
require('express-async-errors')
require('./db')
const userRouter = require("./routes/user")
const movieRouter = require("./routes/movie")
const reviewRouter = require("./routes/review")

const { errorHandler } = require("./middlewares/errorHandler")
const cors = require('cors')


const app = express()

//the data coming from frontend will be in chunk, we need to convert it into JSON
app.use(express.json())

//cors is used to solve the cross origin issue during get post from frontend
app.use(cors())

//app.get(routes, controller)
app.use('/api/user', userRouter)
app.use('/api/movie', movieRouter)
app.use('/api/review', reviewRouter)

//for error handling
app.use(errorHandler)

//.listen will listen when the connection of the backend to the port 8000 is made
app.listen(process.env.PORT || 8000, () => {
    console.log("Listening on port ", process.env.PORT);
});


