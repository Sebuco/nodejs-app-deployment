const express = require('express');
const {check, body} = require('express-validator');

const authControllers = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authControllers.getLogin);

router.post('/login', 
  [
    body('email')
      .isEmail()
      .withMessage('Wrong e-mail or password')
      .normalizeEmail(),
    body('password', 'Wrong e-mail or password')
      .isLength({min: 6})
      .isAlphanumeric()
  ]
  ,authControllers.postLogin)

router.get('/signup', authControllers.getSignup);

router.post('/signup', 
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email adress')
      .custom((value, {req}) => {
        return User.findOne({email: value})
          .then(userDoc => {
            if(userDoc){
              return Promise.reject('E-mail already in use');
            }
          });
      })
      .normalizeEmail(), 
      body('password', 'Please enter a password with only numbers and text with at least 6 characters')
        .isLength({min: 6})
        .isAlphanumeric()
        .trim(),
      body('confirmPassword')
        .trim()
        .custom((value, {req}) => {
          if(value !== req.body.password){
            throw new Error('Passwords do not match');
          }
          return true;
        })
  ],
authControllers.postSignup);

router.post('/logout', authControllers.postLogout);

router.get('/reset', authControllers.getReset);

router.post('/reset', authControllers.postReset);

router.get('/reset/:token', authControllers.getNewPassword);

router.post('/new-password', authControllers.postNewPassword);

module.exports = router;