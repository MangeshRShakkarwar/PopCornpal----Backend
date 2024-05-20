const Review = require("../models/review")
const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
//used to convert json object to arrays in the db
exports.parseData = (req, res, next) => {
    const { trailer, cast, genres, tags } = req.body

    if (trailer) req.body.trailer = JSON.parse(trailer)
    if (cast) req.body.cast = JSON.parse(cast)
    if (genres) req.body.genres = JSON.parse(genres)
    if (tags) req.body.tags = JSON.parse(tags)

    next()
}
//aggregation for calculating average rating
exports.averageRatingPipeline = (movieId) => {
    return [
        {
            $lookup: {
                from: "Review",
                localField: "rating",
                foreignField: "_id",
                as: "avgRating"
            }
        },
        {
            $match: { parentMovie: movieId },
        },
        {
            $group: {
                _id: null,
                ratingAverage: {
                    $avg: "$rating",
                },
                reviewsCount: {
                    $sum: 1
                }
            }
        }
    ]

}
exports.getAverageRatings = async (movieId) => {
    const [aggregatedResponse] = await Review.aggregate(this.averageRatingPipeline(movieId))
    const reviews = {}
    if (aggregatedResponse) {
        const { ratingAverage, reviewsCount } = aggregatedResponse
        reviews.ratingAverage = parseFloat(ratingAverage).toFixed(1)
        reviews.reviewsCount = reviewsCount
    }

    return reviews
}

//to fetch top rated movies 
exports.topRatedMoviesPipeline = (type) => {
    return [
        {
            $lookup: {
                from: "Movie",
                localField: "reviews",
                foreignField: "_id",
                as: "topRatedMovies"
            }
        },
        {
            $match: {
                reviews: { $exists: true },
                type: { $eq: type }
            }
        },
        {
            $project: {
                title: 1,
                poster: "$poster.url",
                reviewsCount: { $size: "$reviews" }
            }
        },
        {
            $sort: {
                reviewsCount: -1
            }
        },
        {
            $limit: 10
        }
    ]
}
//helper to send an email to user
exports.emailSender = async ({ userEmail, subjectText, bodyText, bodyHtml }) => {

    const msg = {
        to: userEmail,
        from: {
            name: 'PopcornPal',
            email: 'abhishekchavan940@gmail.com'
        },
        subject: subjectText,
        text: bodyText,
        html: bodyHtml,
    }

    await sgMail
        .send(msg)
        .then((response) => {
            console.log(response[0].statusCode)
            console.log("Email Sent...")
        })
        .catch((error) => {
            console.error(error)
        })
}
