//error handling is done by using the package named "express-async-errors"
//we define the errorHandler middleware here
//it is imported and used in app.js
//How does it work:
//Whenever there is any error in our controllers, async await, that error will be caught by the package (just like using try and catch)
//that error is then sent to the app.js file, actually the package uses "next()" which sends the error to app.js
//now the app.js has this error and our middleware "errorHandler" used in app.js gets its parameters and performs its duty.
//if still not clear watch the video number 43

exports.errorHandler = (err, req, res, next)=>{
    res.status(500).json({error: err.message || err})
}