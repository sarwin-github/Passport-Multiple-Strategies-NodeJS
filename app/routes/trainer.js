const express = require('express');
const router = express.Router();
const passport = require('passport');
const csrf = require('csurf');

/* Create a middleware for CSRF token creation and validation. This middleware adds a req.csrfToken() 
function to make a token which should be added to requests which mutate state, within a hidden form field, 
query-string etc. This token is validated against the visitor's session or csrf cookie.*/

var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/login', (req, res) => {
    var messages = req.flash('error');
    
    //Token will be validated every login get request, 
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0  });
    res.render('accounts/trainer/login', { csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0  });
});

router.post('/login', passport.authenticate('local.trainer.login', {
    //If passport is successful in authenticating login, redirect to trainer profile
    successRedirect: '/trainer/profile',
    //If passport failed in authenticating login redirect to login page again
    failureRedirect: '/trainer/login',
    failureFlash: true
}));

router.get('/signup', (req, res) => {
    var messages = req.flash('error');
    
    //Token will be validated every Sign up get request,
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0 })
    res.render('accounts/trainer/signup', { csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0 });
});

router.post('/signup', passport.authenticate('local.trainer.signup', {
    //If passport is successful in authenticating signup, redirect to trainer profile
    successRedirect: '/trainer/profile',
    //If passport failed in authenticating signup, redirect to sign up page again
    failureRedirect: '/trainer/signup',
    failureFlash: true
}));

router.get('/profile', isLoggedIn, (req, res) => {
    res.render('accounts/trainer/profile.ejs', {
        user : req.user 
    });
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    res.redirect('/');
}

module.exports = router;