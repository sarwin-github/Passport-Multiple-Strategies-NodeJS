//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Add the required modules
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const express = require('express');
const router = express.Router();
const passport = require('passport');
const csrf = require('csurf');

/* Create a middleware for CSRF token creation and validation. This middleware adds a req.csrfToken() 
function to make a token which should be added to requests which mutate state, within a hidden form field, 
query-string etc. This token is validated against the visitor's session or csrf cookie.*/

const csrfProtection = csrf();
router.use(csrfProtection);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// A middleware that will check if the user trying to log in is indeed a client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const isClient = (req, res, next) => {
    if(req.user.local.isClient === true || req.user.facebook.email){
        return next();
    }
    res.redirect('/client/login');
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Login Page, to pass the data to react use the res.json/ response.json
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/login', (req, res) => {
    let messages = req.flash('error');
    
    ///Set the request session root url to /client this will be added to the navigation bar to know what type of user is logged in
    req.session.type = "/client";

    ///Token will be validated every login get request, 
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0  });
    res.render('accounts/client/login', 
    { 
        csrfToken: req.csrfToken(), 
        user_type: req.session.type, 
        message: messages, 
        hasErrors: messages.length > 0  
    });
});

router.post('/login', passport.authenticate('local.client.login', {
    ///If passport is successful in authenticating login, redirect to client profile
    successRedirect: '/client/profile',
    ///If passport failed in authenticating login redirect to login page again
    failureRedirect: '/client/login',
    failureFlash: true
}));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Sign up Page, to pass the data to react use the res.json/ response.json
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/signup', (req, res) => {
    let messages = req.flash('error');
    
    ///Set the request session root url to /client this will be added to the navigation bar to know what type of user is logged in
    req.session.type = "/client";

    ///Token will be validated every Sign up get request,
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0 })
    res.render('accounts/client/signup', 
    { 
        csrfToken: req.csrfToken(), 
        user_type: req.session.type, 
        message: messages, hasErrors: 
        messages.length > 0 
    });
});

router.post('/signup', passport.authenticate('local.client.signup', {
    ///If passport is successful in authenticating signup, redirect to client profile
    successRedirect: '/client/profile',
    ///If passport failed in authenticating signup, redirect to sign up page again
    failureRedirect: '/client/signup',
    failureFlash: true
}));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Trainer Profile Page, to pass the data to react use the res.json/ response.json
// The req.user is the data of user created by passport, 
// you can access the client data using, user.local.email if you want to see the email of the client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/profile', isLoggedIn, isClient, (req, res) => {
    //res.json({user: req.user})
    res.render('accounts/client/profile.ejs', {
        user : req.user, user_type: req.session.type, 
    });
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Facebook Authentication
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/auth/facebook', passport.authenticate('facebook.client', { scope : 'email', }));

    ///handle the callback after facebook has authenticated the user
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook.client', {
            successRedirect : '/client/profile',
            failureRedirect : '/'
        }));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// You will be redirected to landing page or home page, You will be logged out and sessions will be destroyed
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Route middleware to make sure a user is logged in
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated())
        return next();
    res.redirect('/');
};

module.exports = router;