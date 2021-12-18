const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const isAuth = require('../middleware/isauth')

const feedController = require('../controllers/feed')
const valide = [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
]
router.get('/posts',isAuth, feedController.getPosts)
router.post('/post',isAuth,valide,feedController.createPost)

router.get('/post/:postId',isAuth, feedController.getPost)

router.put('/post/:postId',isAuth, valide, feedController.updatePost)
router.delete('/post/:postId',isAuth, feedController.deletePost)

module.exports = router