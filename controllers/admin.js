const product = require('../models/product');
const Product = require('../models/product');

const fileHelper = require('../util/file');

const {validationResult} = require('express-validator');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        editing: false,
        errorMsg: null,
        oldInput: {
            title: '',
            imageUrl: '',
            price: '',
            description: ''
        },
        validationErrors: []
    })
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const image = req.file;
    const errors = validationResult(req);

    if(!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            errorMsg: 'Invalid image file',
            oldInput: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: [],
        })
    }

    if(!errors.isEmpty()){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product', 
            path: '/admin/add-product',
            editing: false,
            errorMsg: errors.array()[0].msg,
            oldInput: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: errors.array(),
        })
    }

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user._id
    });

    product
        .save() //provided by mongoose
        .then(result => {
            console.log("Product Created");
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if(!editMode){
        return res.redirect('/');
    }
    const prodId = req.params.productId
    Product.findById(prodId)
    .then(product => {
        if(!product) {
            return res.status(422).render('admin/edit-product', {
                pageTitle: 'Edit Product', 
                path: `/admin/edit-product`,
                editing: editMode,
                errorMsg: "An error ocurred, please try again",
                oldInput: {
                    title: '',
                    price: '',
                    imageUrl: '',
                    description: ''
                },
                validationErrors: [],
                product: product
            });
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: `/admin/edit-product`,
            editing: editMode,
            errorMsg: null,
            oldInput: {
                title: '',
                price: '',
                imageUrl: '',
                description: ''
            },
            validationErrors: [],
            product: product
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
}

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const updatedImage = req.file;

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: `/admin/edit-product`,
            editing: true,
            errorMsg: errors.array()[0].msg,
            validationErrors: errors.array(),
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            oldInput: {
                title: updatedTitle,
                imageUrl: updatedImageUrl,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            }
        })
    }

    Product.findById(prodId) 
    .then(product => {
        if(product.userId.toString() !== req.user._id.toString()){
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        if(updatedImage) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl = updatedImage.path;
        } 
        return product.save()
        .then(result => {
            console.log("UPDATED PRODUCT");
            res.redirect('/admin/products');
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if(!product) {
            return next(new Error('Product not Found'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({_id: prodId, userId: req.user._id});
    })
    .then(() => {
        console.log('Product Deleted');
        res.status(200).json({message: "Success"});
    })
    .catch(err => {
        res.status(500).json({message: "An error ocurred while deleting the product"});
    });
};

exports.getAdminProducts = (req, res, next) => {
    Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
        console.log(products)
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
};
