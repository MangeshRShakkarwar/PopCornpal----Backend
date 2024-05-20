const { check, validationResult } = require('express-validator')
const { isValidObjectId } = require('mongoose')
//The check function is used to specify validation and sanitation rules for incoming data.
//The validationResult function is used to extract the validation errors generated by the check function.


//defining the checks to be done
exports.userValidator = [
    check("username").trim().not().isEmpty().withMessage("Username cannot be empty"),
    check("email").trim().normalizeEmail().isEmail().withMessage("Invalid Email"),
    check("password").trim().not().isEmpty().withMessage("Password cannot be empty").isLength({ min: 8, max: 20 }).withMessage("Password must be 8 to 20 characters long")
]

exports.validateMovie = [
    check("title").trim().not().isEmpty().withMessage("Movie Title Missing"),
    check("storyline").trim().not().isEmpty().withMessage("storyline Missing"),
    check("language").trim().not().isEmpty().withMessage("language Missing"),
    check("type").trim().not().isEmpty().withMessage("Movie Type Missing"),
    check("storyline").isDate().withMessage("Release Date Missing"),
    check("genres").isArray().withMessage("Genres must be an array of strings").custom((value) => {
        for (let g of value) {
            if (!genres.includes(g)) throw Error("Invalid Genres")
        }
        return true
    }),
    check("tags").isArray({ min: 1 }).withMessage('Tags must be array of strings').custom((tag) => {
        for (let t of tag) {
            if (typeof tag !== "string") throw Error("Invalid Tag")
        }
        return true
    }),
    check("cast").isArray().withMessage('Cast must be array of objects').custom((cast) => {
        for (let c of cast) {
            if (!c.artistName?.trim()) throw Error("Artist Name is Missing")
            if (!c.roleAs?.trim()) throw Error("Role of a Cast is Missing")
            if (typeof c.leadActor !== "boolean") throw Error("Only Boolean value for leadActor is Valid")
        }
        return true
    }),
    check("trailer").isObject().withMessage("trailer must be object with public id and url").custom(({ secure_url, public_id }) => {
        try {
            const result = new URL(secure_url)
            if (!result.protocol.includes('http')) throw Error("Invalid Trailer URL")
            const arr = url.split('/')
            const publicID = arr[arr.length - 1].split('/')[0] // to get the "udiqv2lpoeedvcqeboxi" from the https://res.cloudinary.com/duxvkrrpm/video/upload/v1709113275/udiqv2lpoeedvcqeboxi.mp4
            if (public_id !== publicID) throw Error('Trailer Public ID mismatch')

            return true
        } catch (error) {
            throw Error("Invalid Trailer URL")
        }
    }),
    check("poster").custom((_, { req }) => {
        if (!req.file) throw Error("Missing Poster")
        return true
    }),
]

exports.validateRatings = check('rating', "Rating must be a number between 1 and 10").isFloat({ min: 1, max: 10 })

//passing the request for the checking/validation
exports.validate = (req, res, next) => {
    const error = validationResult(req).array() //.array() to get the list of errors
    if (error.length) {
        console.log("Error in Validation...")
        return res.json({ error: error[0].msg })
    }

    //and if there is no error then move to next task
    next()
}
/*What is happening here?
1. We used express-validator to check for the values entered by user
2. To do so we have two functions in express-validator: check() and validationResult
3. The check function is used to specify validation and sanitation rules for incoming data.
4. The validationResult function is used to extract the validation errors generated by the check function.
5. userValidator contains validation rules for the incoming request body, we are passing this during POST on /create route
6. validate is a middleware that is presumably responsible for running the validation and collecting any errors.
7. Inside validate function: 
    a. We store the result of validationResult in form of array, 
    b. We check if the array is not empty, i.e. if errors exists
    c. error array looks like this: 
    [
  {
    type: 'field',
    value: '@',
    msg: 'Invalid Email',
    path: 'email',
    location: 'body'
  }
]
    d. If error exists then we send a response of the msg. We need to set a key 'error:' so as to pass the json object
    e. response is returned and we dont execute next(), if there was no error then we would have moved ahead by executing next()
    f. next() is used commonly in middlewares
*/


//we will use this passwordValidator during reseting the password
exports.passwordValidator = [
    check("newPassword").trim().not().isEmpty().withMessage("Password cannot be empty").isLength({ min: 8, max: 20 }).withMessage("Password must be 8 to 20 characters long")
]

exports.signInValidator = [
    check("email").trim().normalizeEmail().isEmail().withMessage("Invalid Email"),
    check("password").trim().not().isEmpty().withMessage("Password cannot be empty")
]