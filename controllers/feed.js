const { validationResult } = require('express-validator')
const Post = require('../model/post')
const fs = require('fs')
const path = require('path')
const User = require('../model/user')
const post = require('../model/post')

const clearImage = filePath => {
    filePath = path.join(__dirname, '..',filePath)
    fs.unlink(filePath, error => console.log(error))
}
exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1
    const perPage = 2
    let totalItems
    Post.find()
        .countDocuments()
        .then(count => {
            totalItems = count
            return Post.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(posts => {
            res.status(200)
                .json({
                    message: 'fetched posts successfully',
                    posts: posts,
                    totalItems: totalItems
                })
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500
                next(error)
            }
        })
}

exports.createPost = (req, res, next) => {
    let creator;
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('validation failed, incorrect data entered')
        error.statusCode = 422
        throw error
    }
    if (!req.file) {
        const error = new Error('No image provided')
        error.statusCode = 422
        throw error
    }
    const image = req.file.path
    const title = req.body.title
    const content = req.body.content
    const post = new Post({
        title: title,
        content: content,
        image: image,
        creator: req.userId
    })
    post
        .save()
        .then(result => {
            console.log(result)
            return User.findById(req.userId)
        })
        .then(user => {
            creator = user
            user.posts.push(post)
            return user.save()
        })
        .then(result => {
            res.status(201).json({
                message: 'post created successufully',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            })
        })
        .catch(error => {
            if (!error.statusCode){
                error.statusCode = 500
            }
            next(error)
        })
    
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId
    Post.findById(postId)
        .then(post => { 
            if(!post){
                const error = new Error('Could not find post')
                error.statusCode = 404
                throw error
            }
            res.status(200).json({
                message: 'post fetched',
                post: post
            })
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500
            }
            next(error)
        })
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('validation failed, incorrect data entered')
        error.statusCode = 422
        throw error
    }
    const title = req.body.title
    const content = req.body.content
    let image = req.body.image

    if (req.file){
        image = req.file.path
    }
    if (post.creator.toString() !== req.userId){
        const error = new Error('Not Authorized')
        error.statusCode = 403
        throw error
    }
    if (!image){
        const error = new Error('No file picked')
        error.statusCode = 422
        throw error
    }

    Post.findById(postId)
        .then(post => {
            if (!post){
                const error = new Error('Could not find the post')
                error.statusCode = 422
                throw error
            }
            if (image !== post.image) {
                clearImage(post.image)
            }
            post.title = title
            post.content = content
            post.image = image
            return post.save()
            
        })
        .then(result => {
            res.status(200).json({
                message: 'post updated',
                post: result
            })
        })
        .catch(error => {
            if (!error.statusCode){
                error.statusCode = 500
            }
            next(error)
        })

}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId
    Post.findById(postId)
        .then(post => {
            if (!post){
                const error = new Error('Could not find post')
                error.statusCode = 422
                throw error
            }

            if (post.creator.toString() !== req.userId){
                const error = new Error('Not Authorized')
                error.statusCode = 403
                throw error
            }
            clearImage(post.image)
            return Post.findByIdAndRemove(postId)

        })
        .then(result => {
            return User.findById(req.userId)
        })
        .then(user => {
            user.posts.pull(postId)
            return user.save()
        })
        .then(result => {
            console.log(result)
            res.status(200).json({
                message: 'Deleted post'
            })
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500
                next(error)
            }
        })
}