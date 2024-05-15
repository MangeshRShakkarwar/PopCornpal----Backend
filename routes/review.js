const { addReview, updateReview, removeReview, getReviewsByMovie, addUpvote, addDownvote } = require('../controllers/review')
const { isAuth } = require('../middlewares/auth')
const { validateRatings, validate } = require('../middlewares/validator')

const router = require('express').Router()


router.post('/add/:movieId', isAuth, validateRatings, validate, addReview)
router.patch('/update/:reviewID', updateReview)
router.delete('/delete/:reviewID', isAuth, removeReview)
router.get('/get-reviews-by-movie/:movieId', getReviewsByMovie)
router.post('/add-upvote/:movieId/:reviewID', isAuth, addUpvote)
router.post('/add-downvote/:movieId/:reviewID', isAuth, addDownvote)
module.exports = router
