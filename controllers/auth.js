const User = require('../model/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


exports.signup = (req, res, next) => {
    const error = validationResult(req)
    if (!error.isEmpty()){
        const error = new Error('Validation failed')
        error.statusCode = 422
        throw error
    }
    const email = req.body.email
    const name = req.body.name
    const password = req.body.password

    bcrypt
        .hash(password, 12)
        .then(hash => {
            const user = new User({
                email,
                name,
                password: hash
            })
            return user.save()
        })
        .then(result => {
            res.status(201).json({
                message: 'user created',
                userId: result._id
            })
        })
        .catch(error => {
            if (!error.statusCode){
                error.statusCode = 500
            }
            next(error)
        })

}

exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let loadedUser
    User.findOne({email: email})
        .then(user => {
            if(!user){
                const error = new Error('A user with this email was not found')
                error.statusCode = 401
                throw error
            }
            loadedUser = user
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if(!isEqual){
                const error = new Error('Wrong password')
                error.statusCode = 401
                throw error
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'somesupersecret',
                {
                    expiresIn: '1h'
                }
            )
            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString(),

            })
        })
        .catch(error => {
            if(!error.statusCode){
                error.statusCode = 500
            }
            next(error)
        })
}