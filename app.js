const express = require("express");
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const bodyParser = require("body-parser");
const multer = require('multer');
const path = require("path");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session); 
const cookieParser = require('cookie-parser');
const {doubleCsrf} = require('csrf-csrf');
const flash = require('connect-flash');
const helmet  = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const mongoose = require('mongoose');
const User = require('./models/user');

console.log(process.env.NODE_ENV);

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.mk3ycwc.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true`

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const allowedMimes = ['image/png', 'image/jpg', 'image/jpeg'];
const fileFilter = (req, file, cb) => {
    if(allowedMimes.includes(file.mimetype)){
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const rootDir = require('./util/path')

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');
const authRoutes = require('./routes/auth');

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(session({
    secret: 'umaStringBemSeguraAqui', 
    resave: false, 
    saveUninitialized: false,
    store: store, 
    cookie: {httpOnly: true, sameSite: 'lax'}}));
app.use(cookieParser('umaStringBemSegura'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).single('image')
);
app.use(express.static(path.join(rootDir, 'public')));
app.use('/images',express.static(path.join(rootDir, 'images')));
app.use(flash());

const {
    invalidTokenError,
    generateCsrfToken,
    validateRequest,
    doubleCsrfProtection
} = doubleCsrf({
    getSecret: (req) => "umasecretoseguro1234567890abcdef",
    getSessionIdentifier: (req) => req.session.id
})

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = generateCsrfToken(req, res);
    next();
})


app.use((req, res, next) => {
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if(!user) {
            return next()
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err)); //dentro de codigo assincrono usar next em vez de throw
    })
});


app.use('/admin', adminRoutes); 
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    console.log(error)
    res.status(500).render('500', {
        pageTitle: 'An error ocurred',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    })
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {
        // https
        //     .createServer({key: privateKey, cert: certificate}, app)
        //     .listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);
        console.log("Connected!");
    })
    .catch(err => console.error(err));



/* MySql
//products & user
Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);

//cart
Cart.belongsTo(User);
Cart.belongsToMany(Product, {through: CartItem});
Product.belongsToMany(Cart, {through: CartItem});

//orders
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, {through: OrderItem});
Product.belongsToMany(Order, {through: OrderItem});

sequelize.sync()
//.sync({force: true})
.then(result => {
    return User.findByPk(1);
    //console.log(result);
})
.then(user => {
    if(!user){
        return User.create({
            name: "Mateus",
            email: "mateus@gmail.com"})
    }
    return user;
})
.then(user => {
    //console.log(user)
    return user.createCart();
})
.then(cart => {
    app.listen(3000);
})
.catch(err => {
    console.error(err); 
});
*/
