//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Add the required modules
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const express = require('express');
const router = express.Router();
const passport = require('passport');
const csrf = require('csurf');
const Client = require('../../model/client');

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
    req.flash('message', 'Sorry only client can access this route');
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
    req.logout();
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
router.get('/auth/facebook', passport.authenticate('facebook.client', { scope : ['email', 'public_profile', 'user_friends'] }));

    ///handle the callback after facebook has authenticated the user
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook.client', {
            successRedirect : '/client/profile',
            failureRedirect : '/index'
        }));


router.get('/update', isLoggedIn, isClient, (req, res) => {
    let messages = req.flash('message');
    let query = Client.findById({ _id: req.user._id })
                .select({'__v': 0, 'local.password': 0});

    query.exec((err, client) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!client){
            return res.status(204).send({success: false, message: 'Record for that client does not exist'});
        }
        res.json({
            client: client,
            csrfToken: req.csrfToken(),
            message: messages
        });
    });
});

router.put('/update', isLoggedIn, isClient, (req,res) => {
    let query = Client.findById({ _id: req.user._id })
                .select({'local.name': 1, 'local.birthday': 1, 'local.age': 1});

    query.exec((err, client) => {
        if(err){
            return res.status(500).send({success:false, error: err, message: 'Something went wrong.'});
        }

        client.local.name = req.body.name;
        client.local.birthday = req.body.birthday;
        client.local.age = req.body.birthday;

        client.save(err => {
            if(err){
                return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
            }

        req.flash('message', 'Successfully updated your profile');
        req.json({trainer: trainer, message: 'Successfully updated your profile'});
        });
    });           
});



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
    res.redirect('/index');
};

module.exports = router;