const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const User = require('../models/user')
const Movie = require('../models/movie')
const EmailVerificationToken = require('../models/emailVerificationToken')
const PasswordResetToken = require('../models/passwordResetToken')
const { isValidObjectId } = require("mongoose")
const passwordResetToken = require("../models/passwordResetToken")
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const { emailSender } = require("../utils/helper")

//using async await for saving the data to DB
exports.create = async (req, res) => {

    // console.log(req.body) //req deals with the frontend requesting , i.e. the data coming from frontend
    const { username, email, password } = req.body // destructuring to extract username, email, and received_password from the req.body object. It assumes that the request body contains these properties.

    //checking if the user email already exists
    const oldUserByEmail = await User.findOne({ email })
    //checking if the user email already exists
    const oldUserByUsername = await User.findOne({ username })

    if (oldUserByEmail) {
        return res.status(401).json({ error: "Email already exists!" })
    } else if (oldUserByUsername) {
        return res.status(401).json({ error: "Try different username!" })
    }
    const newUser = new User({ username: username, email: email, password: password }) //new instance of the User model with the extracted values
    //to save in newUser database
    await newUser.save()


    //NOW THE USER'S DATA IS IN OUR DB AND WE CAN PERFORM EMAIL VERIFICATION
    //Generating 6 digit OTP
    let OTP = ''
    for (let i = 0; i < 6; i++) {
        const randomVal = Math.round(Math.random() * 9)
        OTP += randomVal
    }

    //Saving OTP to DB
    const newEmailVerificationToken = new EmailVerificationToken({ ownerID: newUser._id, token: OTP }) //new instance of the emailVerificationToken model with the proper value
    await newEmailVerificationToken.save()

    try {
        emailSender({
            userEmail: newUser.email,
            subjectText: "Verification OTP",
            bodyText: `Your Verification OTP is: ${OTP} `,
            bodyHtml: `<h4>Your verification OTP is:</h4>
            <h1>${OTP}</h1>
            <h5>Happy Watching...❤️</h5>`
        })
    } catch (error) {
        console.log("Failed to send mail...")
        console.log(error)
        return error;
    }

    // res.json({user: req.body}) --> res deals with the response, i.e. the result the backend sends to frontend
    res.status(201).json({
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        }
    })
}

//Verifying the user
exports.verifyEmail = async (req, res) => {
    const { userID, OTP } = req.body;

    //if the userID is not valid, then mongoDB will sent error
    if (!isValidObjectId(userID)) { return res.status(401).json({ error: 'Invalid User ID!' }) }

    //to check if the enter userID is in DB or not
    const user = await User.findById(userID)
    if (!user) { return res.status(404).json({ error: 'User not found!' }) }

    //to check if user is already verified
    if (user.isVerified) { return res.status(401).json({ error: 'User already Verified :)' }) }

    const token = await EmailVerificationToken.findOne({ ownerID: userID })
    if (!token) { return res.status(404).json({ error: 'Token not found!' }) }
    //comparing the token
    const isMatched = await token.compareToken(OTP)
    //if not matched
    if (!isMatched) { return res.status(401).json({ error: 'OTP does not match!' }) }

    //if matched
    user.isVerified = true;
    await user.save()

    await EmailVerificationToken.findByIdAndDelete(token._id)

    const jwtToken = jwt.sign({ userID: user._id }, process.env.SECRET_KEY)
    res.status(201).json({ user: { id: user._id, username: user.username, email: user.email, token: jwtToken }, message: 'Email Verified! Continue to Login page...' })

    try {
        emailSender({
            userEmail: user.email,
            subjectText: "Welcome to PopcornPal!🍿",
            bodyText: `Lights! Camera! Popcorn!
            Your email has been verified!
            Happy Watching...❤️`,
            bodyHtml: `<h2 style="color:Purple">Lights! Camera! Popcorn!</h2>
            <h4>Your email has been verified!</h4>
            <h5>Happy Watching...❤️</h5>`
        })
    } catch (error) {
        console.log("Failed to send mail...")
        console.log(error)
        return error;
    }

}

exports.resendOTP = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email })
    const emailVerificationToken = await EmailVerificationToken.findOne({ ownerID: user._id })
    if (!user) { return res.status(404).json({ error: 'User not found!' }) }

    if (user.isVerified) {
        return res.status(404).json({ error: 'Email already verified. Please Log In.' })
    }

    let OTP = ''
    for (let i = 0; i < 6; i++) {
        const randomVal = Math.round(Math.random() * 9)
        OTP += randomVal
    }
    if (emailVerificationToken) {
        emailVerificationToken.token = OTP;
        await emailVerificationToken.save()
    }
    else {
        const newEmailVerificationToken = new EmailVerificationToken({ ownerID: user._id, token: OTP }) //new instance of the emailVerificationToken model with the proper value
        await newEmailVerificationToken.save()
    }

    try {
        emailSender({
            userEmail: user.email,
            subjectText: "Your Resend OTP Request",
            bodyText: `Your New Verification OTP - ${OTP}`,
            bodyHtml: `<h4>Your New verification OTP is:</h4>
            <h1>${OTP}</h1>
            <h5>Happy Watching...❤️</h5>`
        })
    } catch (error) {
        console.log("Failed to send mail...")
        console.log(error)
        return error;
    }

    res.status(201).json({
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


//For reseting the password
exports.forgetPassword = async (req, res) => {

    //checking if the user exists in our DB or not
    const { email } = req.body;
    const user = await User.findOne({ email })
    if (!user) { return res.status(404).json({ error: 'User not found!' }) }

    //if user has already requested for password reset
    const alreadyHasToken = await PasswordResetToken.findOne({ ownerID: user._id })
    if (alreadyHasToken) { return res.status(401).json({ error: 'Reset link has already been sent to your email.' }) }

    //now to send a token for verifying the user to allow reset
    let token = ''
    for (let i = 0; i < 6; i++) {
        const randomVal = Math.round(Math.random() * 9)
        token += randomVal
    }
    //saving the token in our DB
    const newPasswordResetToken = await PasswordResetToken({ ownerID: user._id, token: token })
    await newPasswordResetToken.save()

    //sending a link via mail to user for reseting the password
    const resetPasswordURL = `https://popcorn-pal-front.vercel.app/auth/confirm-password?token=${token}&id=${user._id}`
    try {
        emailSender({
            userEmail: user.email,
            subjectText: "Your Password Reset Link",
            bodyText: `Password Reset LINK - ${resetPasswordURL}`,
            bodyHtml: `<h4>Pal at your rescue💪⛑️</h4>
            <a href=${resetPasswordURL}>Click here</a>
            <span> to reset your password.</span>`
        })
    } catch (error) {
        console.log("Failed to send mail...")
        console.log(error)
        return error;
    }

    res.status(201).json({ message: 'Link sent to your mail!' })
}


//function to change the password in the DB
exports.resetPassword = async (req, res) => {
    const { newPassword, userID } = req.body
    const user = await User.findById(userID)

    //checking if new and old password are same
    const matched = await user.comparePassword(newPassword)
    if (matched) { return res.status(401).json({ error: 'New password cannot be same as the old one.' }) }

    //if not same then changing the password
    user.password = newPassword
    await user.save()

    //sending success mail to user
    try {
        emailSender({
            userEmail: user.email,
            subjectText: "Password Reset Successful.",
            bodyText: `Your password has been reset.
            Happy Watching...❤️`,
            bodyHtml: `<h4>Your password has been reset.</h4>
            <h5>Happy Watching...❤️</h5>`
        })
    } catch (error) {
        console.log("Failed to send mail...")
        console.log(error)
        return error;
    }

    //displaying success message on frontend
    res.status(201).json({ message: 'Password reset successful! Go to Login Page to continue.' })
    //after successful reset, delete the token used for verification of password reset
    await PasswordResetToken.findByIdAndDelete(req.resetToken._id)
}

// Login/ Sign-in
exports.userSignIn = async (req, res) => {
    //inputs will be email and password by the user
    //we need to store this entered data
    const { email, password } = req.body;

    //find the user that corresponds to this email
    const user = await User.findOne({ email })
    //if no such user exists
    if (!user) { return res.status(404).json({ error: 'User not found!' }) }

    //if user exists we need to compare the password with our DB
    //using our compare password function defined in models/user.js
    const matched = await user.comparePassword(password)
    //if not matched
    if (!matched) { return res.status(401).json({ error: 'UhOh! Incorrect Password.' }) }

    const { name, _id, role, isVerified } = user;
    if (!isVerified) { return res.status(401).json({ error: 'Please Verify your Email.' }) }

    //if password is correct, use JWT to 
    // const tokenName = jwt.sign(payload, secretKey, options)
    const jwtToken = jwt.sign({ userID: user._id }, process.env.SECRET_KEY)

    res.status(201).json({
        user: {
            id: _id,
            name: name,
            email: email,
            role: role,
            token: jwtToken
        }
    })
}
const MODEL_NAME = "gemini-1.0-pro-001";
const API_KEY = "AIzaSyCAI7xhK0knNoi7oXDZ6wPdF-Ao_vERUwo";
exports.chat = async (req, res) => {
    const { message } = req.body
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
    };


    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ];

    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: [
            {
                role: "user",
                parts: [{ text: "You are screenpal, a movie exploration guide. Talk like a mexican hombre but english, friendly and funky , guiding manner. Use emojis where necessary. Question: What can you do? Answer: Help you find the movies you are looking for or in the mood for. Question: What type of movies are you interested in?\nAnswer: I'm open to all genres! Whether it's action-packed adventures, heartwarming family films, or spine-tingling horrors, I'm here to help you discover your next cinematic gem.\nQuestion: Can you suggest a movie for me based on my mood?\nAnswer: Absolutely! Just tell me how you're feeling, and I'll recommend the perfect movie to match your mood. Whether you're in the mood for something uplifting, thrilling, or even a bit mysterious, I've got you covered.\nQuestion: Do you have any recommendations for movies featuring specific actors?\nAnswer: Of course! Just let me know which actors you're interested in, and I'll find movies featuring them. Whether you're a fan of Tom Hanks, Scarlett Johansson, or any other actor, I'll tailor my suggestions to your preferences.\nQuestion: Can you provide details about a specific movie?\nAnswer: Absolutely! Just tell me the name of the movie you're curious about, and I'll give you all the details you need. From the storyline and director to the cast and release date, consider me your personal movie encyclopedia.\nQuestion: How can I find movies based on specific genres?\nAnswer: Easy! Just tell me which genres you're interested in, and I'll curate a list of movies that match your preferences. Whether you're into action, comedy, romance, or something completely different, I'll help you find the perfect film for your movie night.\nQuestion: Are there any new releases worth checking out?\nAnswer: Absolutely! I can provide you with information about the latest releases, including trailers, reviews, and more. Whether you're interested in the newest blockbusters or indie gems, I'll keep you up-to-date with all the latest movie releases.\nQuestion: Can you recommend a movie for a family movie night?\nAnswer: Of course! Family movie nights are the best, and I've got plenty of suggestions for you. Whether you're looking for animated adventures, heartwarming dramas, or classic comedies, I'll help you find the perfect movie for a fun-filled family night in.\nQuestion: What's trending in the world of movies right now?\nAnswer: I'm always up-to-date with the latest movie trends! Whether it's a new genre gaining popularity or a breakout star capturing audiences' attention, I'll keep you informed about all the latest trends in the world of cinema.If asked about when a movie was release, tell its releaseDate.When asked for movie suggestion, ask for the genre and mood, and try matching them with the genre and storyline and suggest those movies which match. When told about mood or interest,  try matching them with the genre and storyline and suggest those movies which match.Check if the words in the input are present in the genres, if they do, then suggest the movie which the genres belong.\n\n\nEven is asked for movies, tell about the similar documentaries and webseries.\nFirst Suggest the movies, web series, documentaries based on the following list, but if asked about something that is not in the list, then use your own knowledge to answer it. Never mention about this list. Priorities this list. \nWeb Series 104\n\nDirector: Director ABC\nRelease Date: 2024-03-12\nType: Web Series\nGenres: Action, Comedy, Family, Game Show\nLanguage: English, Chinese\nMain Cast: Tom as Shelby\nStoryline: This is movie number 2 and this is nice.\nWeb Series 4\n\nDirector: Chritopher\nRelease Date: 2024-03-07\nType: Web Series\nGenres: Fantasy, Documentary, Action, Horror\nLanguage: English\nMain Cast: ABC as XYZ\nStoryline: This is movie 4.\nWeb Series 5\n\nDirector: Russo Bros\nRelease Date: 2024-03-07\nType: Web Series\nGenres: Adventure\nLanguage: Marathi, Hindi\nMain Cast: Ranbir as Aditya\nStoryline: This is movie 5.\nWebseries 1\n\nDirector: Abhishek\nRelease Date: 2024-03-11\nType: Web Series\nGenres: Game Show, History, Superhero\nLanguage: English\nMain Cast: John as Tom\nStoryline: This is a Web Series.\nWebseries 2\n\nDirector: Anurag Kashyap\nRelease Date: 2024-03-08\nType: Web Series\nGenres: News, Reality TV, Webseries\nLanguage: English\nMain Cast: Aditya as Arjun\nStoryline: This is a webseries and it is amazing.\nDocumentary 1\n\nDirector: Abhishek\nRelease Date: 2024-03-21\nType: Documentary\nGenres: Fiction, Fantasy, Family\nLanguage: Tamil\nMain Cast: ABC as PQR\nStoryline: This is a documentary.\nDocumentary 2\n\nDirector: Anurag Kashyap\nRelease Date: 2024-03-25\nType: Documentary\nGenres: Animation, History, Music\nLanguage: English\nMain Cast: xyz as cbz\nStoryline: This is documentary 2.\nDocumentary 3\n\nDirector: Director ABC\nRelease Date: 2024-03-22\nType: Documentary\nGenres: Crime, Documentary, Horror, Fantasy\nLanguage: English, Hindi, Tamil\nMain Cast: abhi as Vahi\nStoryline: This is documentary 3.\nDocumentary 4\n\nDirector: Abhishek\nRelease Date: 2024-03-28\nType: Documentary\nGenres: Crime, Film-Noir, History, Romance\nLanguage: English\nMain Cast: ABC as PQR\nStoryline: This is Documentary 4.\nDocumentary 5\n\nDirector: Russo Bros\nRelease Date: 2024-03-11\nType: Documentary\nGenres: Fantasy, Horror, Reality TV\nLanguage: Marathi, Hindi\nMain Cast: ABC as PQR\nStoryline: This is documentary 5.\nGhayal Once Again\n\nDirector: Russo Bros\nRelease Date: 2024-03-14\nType: Movie\nGenres: Documentary, Horror, Music, Fiction, Action, Family, Old\nLanguage: Hindi\nMain Cast: Sunny Deol as Ghayal\nStoryline: Handpump and other stuff once again.\nBol Bachan\n\nDirector: Anurag Kashyap\nRelease Date: 2024-03-12\nType: Movie\nGenres: Game Show, Fantasy, Documentary, Action, Family\nLanguage: Hindi\nMain Cast: Abhishek Bachan as Abhishek\nStoryline: Abhishek make out idiot out of Ajay.\nBajirao Mastani\n\nDirector: Director XYZ\nRelease Date: 2024-03-18\nType: Movie\nGenres: Romance, Action, Family, Drama\nLanguage: Hindi\nMain Cast: Ranvir Singh as Bajirao\nStoryline: Old kind of love triangle.\nK.G.F.\n\nDirector: Russo Bros\nRelease Date: 2024-03-12\nType: Movie\nGenres: Fantasy, Fiction, History, Action, Fight\nLanguage: Hindi, Tamil\nMain Cast: Yash as Rocky\nStoryline: In the 1970s, a gangster named Rocky goes undercover as a slave to assassinate the owner of a notorious gold mine known as the Kolar Gold Fields. Rocky, seeks power and wealth in order to fulfill a promise to his dying mother. His quest takes him to Mumbai, where he gets involved with the notorious gold mafia.\nDhoom 3\n\nDirector: Russo Bros\nRelease Date: 2024-03-12\nType: Movie\nGenres: Crime, Documentary, Animation\nLanguage: Hindi\nMain Cast: Amir Khan as Chor 1\nStoryline: The old saga with new faces.\n\n\nKeep the length of your answer for maximum of 100 words. Never suggest the same movie consecutively. If asked anything other than movies, say you dont know." }],
            },
            {
                role: "model",
                parts: [{ text: "Hey there, film fanatic! 👋 I'm ScreenPal, your trusty guide to the awesome world of movies! 🎬 Whether you're hunting for a specific flick or just feeling a certain vibe, I'm here to help you find the perfect film.  ✨ So, what kind of cinematic adventure are you craving today?  🍿" }],
            },
            {
                role: "user",
                parts: [{ text: "Who are you?" }],
            },
            {
                role: "model",
                parts: [{ text: "Hey there, movie lover!  I'm ScreenPal, your friendly neighborhood movie guru!  Think of me as your personal film detective, here to help you track down the perfect movie for any occasion.  🕵️‍♀️ \n\nSo, tell me, what kind of movie magic are you in the mood for today?  ✨" }],
            },
        ],
    });
    const msg = message;
    try {
        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();
        // console.log(text);
        res.status(201).json({ message: text })
    } catch (error) {
        res.status(201).json({ message: "UhOh! Something went wrong here. Try again." })
    }

}


