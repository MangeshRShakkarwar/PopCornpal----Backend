const Review = require("../models/review")

exports.parseData = (req, res, next) => {
    const { trailer, cast, genres, tags } = req.body

    if (trailer) req.body.trailer = JSON.parse(trailer)
    if (cast) req.body.cast = JSON.parse(cast)
    if (genres) req.body.genres = JSON.parse(genres)
    if (tags) req.body.tags = JSON.parse(tags)

    next()
}

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