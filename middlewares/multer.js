const multer = require('multer')
const storage = multer.diskStorage({})

const videoFileFilter=(req, file, cb)=>{
    if(!file.mimetype.startsWith("video")){
        cb("Support only Video files!",false)
    }
    cb(null, true)

}
const imageFileFilter=(req, file, cb)=>{
    if(!file.mimetype.startsWith("image")){
        cb("Support only image files!",false)
    }
    cb(null, true)

}

exports.uploadVideo = multer({storage, fileFilter:videoFileFilter})
exports.uploadImage = multer({storage, fileFilter:imageFileFilter})