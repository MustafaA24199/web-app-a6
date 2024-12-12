/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.
*  No part of this assignment has been copied manually or electronically from any other source.
********************************************************************************/
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const passport = require('passport');
const handlebars = require('handlebars');
const authService = require('./auth-service');
const ensureLogin = require('./ensureLogin');
const storeService = require('./store-service');
const User = require('./User');

const app = express();
const upload = multer();
const HTTP_PORT = process.env.PORT || 8080;

// MongoDB connection
mongoose.connect("mongodb+srv://mabidi3:Mustafa24199@senecadbs311.zw0lj.mongodb.net/webApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Configure Handlebars
app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    navLink: function (url, options) {
      let className = app.locals.activeRoute === url ? 'nav-link active' : 'nav-link';
      return `<li class="nav-item"><a class="${className}" href="${url}">${options.fn(this)}</a></li>`;
    },
    equal: function (lvalue, rvalue, options) {
      return lvalue === rvalue ? options.fn(this) : options.inverse(this);
    },
    safeHTML: function (text) {
      return new handlebars.SafeString(text);
    },
    formatDate: function (dateObj) {
      if (!(dateObj instanceof Date)) return '';
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      let day = dateObj.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
}));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Cloudinary Configuration
cloudinary.config({
  cloud_name: "dyzupsv5u",
  api_key: "391944133355469",
  api_secret: "Og7dSw026kms_k2Xd_duYIYjCNQ",
  secure: true
});

// Passport Configuration
require('./passport-config')(passport);

// Set active route
app.use((req, res, next) => {
  app.locals.activeRoute = req.path;
  res.locals.session = req.session;
  next();
});

// Routes
app.get('/', (req, res) => res.redirect('/login'));

app.get('/signup', (req, res) => res.render('signup', { errorMessage: req.flash('error') }));
app.post('/signup', async (req, res) => {
  console.log('Request Body:', req.body); // Debug: Log incoming data

  const { username, email, password, confirmPassword } = req.body;
  console.log('Parsed Data:', { username, email, password, confirmPassword }); // Ensure parsing works

  if (!username || !email || !password || !confirmPassword) {
    return res.render('signup', { errorMessage: 'All fields are required.' });
  }
  if (password !== confirmPassword) {
    return res.render('signup', { errorMessage: 'Passwords do not match.' });
  }

  try {
    await authService.registerUser({ userName: username, email, password });
    req.flash('success', 'Signup successful! Please log in.');
    res.redirect('/login');
  } catch (err) {
    console.error('Signup Error:', err); // Debug: Log exact error
    res.render('signup', { errorMessage: err.message });
  }
});



app.get('/login', (req, res) => {
  res.render('login', { 
    errorMessage: req.flash('error'), 
    successMessage: req.flash('success') 
  });
});
app.post('/login', async (req, res) => {
  req.body.userAgent = req.get('User-Agent');
  try {
    const user = await authService.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    req.flash('success', 'Login successful!');
    res.redirect('/items');
  } catch (err) {
    req.flash('error', err);
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/userSession', ensureLogin, (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'You must log in to view this page.');
    return res.redirect('/login');
  }
  res.render('userSession', {
    userName: req.session.user.userName,
    email: req.session.user.email,
    loginHistory: req.session.user.loginHistory
  });
});


app.get('/about', (req, res) => res.render('about', { layout: 'main', title: 'About Us' }));

app.get('/shop', async (req, res) => {
  let viewData = {};
  try {
    let items = req.query.category
      ? await storeService.getPublishedItemsByCategory(req.query.category)
      : await storeService.getPublishedItems();
    viewData.items = items;
    viewData.item = items[0];
  } catch {
    viewData.message = "No results found.";
  }
  try {
    viewData.categories = await storeService.getCategories();
  } catch {
    viewData.categoriesMessage = "No results found.";
  }
  res.render("shop", { data: viewData });
});

app.get('/items', ensureLogin, (req, res) => {
  storeService.getAllItems()
    .then(items => res.render('items', { items, successMessage: req.flash('success') }))
    .catch(() => res.render('items', { message: 'No items found.' }));
});

app.get('/categories', ensureLogin, (req, res) => {
  storeService.getCategories()
    .then(categories => res.render('categories', { categories }))
    .catch(() => res.render('categories', { message: 'No categories available.' }));
});

app.get('/categories/add', ensureLogin, (req, res) => res.render('addCategory'));
app.post('/categories/add', ensureLogin, (req, res) => {
  storeService.addCategory(req.body)
    .then(() => res.redirect('/categories'))
    .catch(() => res.status(500).send('Unable to create category'));
});

app.get('/items/add', ensureLogin, (req, res) => {
  storeService.getCategories()
    .then(categories => res.render('addItem', { categories }))
    .catch(() => res.render('addItem', { categories: [] }));
});

app.post('/items/add', ensureLogin, upload.single('featureImage'), (req, res) => {
  if (req.file) {
    let uploadStream = () => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((err, result) => {
          if (result) resolve(result);
          else reject(err);
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    uploadStream().then(uploaded => {
      req.body.featureImage = uploaded.url;
      return storeService.addItem(req.body);
    }).then(() => res.redirect('/items'))
      .catch(() => res.status(500).send('Unable to add item.'));
  } else {
    storeService.addItem(req.body)
      .then(() => res.redirect('/items'))
      .catch(() => res.status(500).send('Unable to add item.'));
  }
});

app.use((req, res) => res.status(404).render('404'));

// Start server
storeService.initialize()
  .then(() => app.listen(HTTP_PORT, () => console.log(`Server running on port ${HTTP_PORT}`)))
  .catch(err => console.error(`Error initializing: ${err}`));
