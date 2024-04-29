const express = require('express')
const { isAuth, isAdmin } = require('../middlewares/auth')
const { uploadVideo, uploadImage } = require('../middlewares/multer')
const { uploadTrailer, createMovie, updateMovie, removeMovie, getLatestUploads, getSingleMovie, getTopRatedMovies } = require('../controllers/movies')
const { parseData } = require('../utils/helper')
const { validateMovie, validate } = require('../middlewares/validator')

const router = express.Router()

router.post('/upload-trailer', isAuth, isAdmin, uploadVideo.single("video"), uploadTrailer)
router.post('/create-movie', isAuth, isAdmin, uploadImage.single("poster"), parseData, 
// validateMovie, validate, 
createMovie)
router.patch('/update-movie/:movieID', isAuth, isAdmin, uploadImage.single("poster"), parseData, 
// validateMovie, validate, 
updateMovie)

router.delete('/:movieID', isAuth, isAdmin, removeMovie)

//for users
router.get('/latest-uploads', getLatestUploads)
router.get('/single/:movieId', getSingleMovie)
router.get('/top-rated', getTopRatedMovies)


module.exports = router