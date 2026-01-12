const express = require('express');
const {check, body} = require('express-validator');

const path = require('path');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post('/add-product', 
  [
    body('title')
      .isString()
      .isLength({min: 3})
      .trim()
      .withMessage('Your product title must only contain alphanumeric characters'),
    body('price')
      .isFloat()
      .withMessage('Invalid Price'),
    body('description')
      .isLength({min: 8, max: 400})
      .withMessage('Invalid Description')
      .trim()
  ]
  ,isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
  [
    body('title', 'Your product title must only contain alphanumeric characters and have at least 3 of them')
      .isString()
      .isLength({min: 3})
      .trim(),
    body('price')
      .isFloat()
      .withMessage('Invalid Price'),
    body('description')
      .isLength({min: 8, max: 400})
      .trim()
      .withMessage('Your description must contain at least 8 characters')
  ]
  ,isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

router.get('/products', isAuth, adminController.getAdminProducts);

module.exports = router;

