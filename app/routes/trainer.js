const express = require('express');
const router = express.Router();
const passport = require('passport');
const csrf = require('csurf');
const Trainer = require('../../app/model/trainer');
/* Create a middleware for CSRF token creation and validation. This middleware adds a req.csrfToken() 
function to make a token which should be added to requests which mutate state, within a hidden form field, 
query-string etc. This token is validated against the visitor's session or csrf cookie.*/

const csrfProtection = csrf();
router.use(csrfProtection);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// A middleware that will check if the user trying to log in is indeed a trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const isTrainer = (req, res, next) => {
    if(req.user.local.isTrainer === true || req.user.facebook.email){
        return next();
    }
    res.redirect('/trainer/login');
}


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Login Page, to pass the data to react use the res.json/ response.json
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/login', (req, res) => {
    let messages = req.flash('error');
    
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


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Sign up Page, to pass the data to react use the res.json/ response.json
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/signup', (req, res) => {
    let messages = req.flash('error');
    
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


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Trainer Profile Page, to pass the data to react use the res.json/ response.json
// you can access the trainer data using, trainer.local.email if you want to see the email of the trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/profile/', isLoggedIn, isTrainer, (req, res) => {

    var query = Trainer.findById({ _id: req.user._id })
                .populate('local.gymInfo', 
                ['name', 'description', 'location'])
                .select({'__v': 0});

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(200).send({success: false, message: "Record for that trainer does not exist"});
        }

        //res.json({trainer: trainer})
        res.render('accounts/trainer/profile.ejs', {
            trainer: trainer
        });
    });   
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This trainer profile can be seen by client whether they are logged or not
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/profile/:id', (req, res) => {
    var query = Trainer.findById({ _id: req.params.id })
                .select({'__v': 0});

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(200).send({success: false, message: "Record for that trainer does not exist"});
        }

        //res.json({user: req.user, trainer: trainer})
        res.render('accounts/trainer/profile-client-view.ejs', { trainer: trainer});
    });

  
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Facebook Authentication
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/auth/facebook', passport.authenticate('facebook.trainer', { scope : 'email' }));

 // handle the callback after facebook has authenticated the user
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook.trainer', {
            successRedirect : '/trainer/profile',
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
function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    res.redirect('/');
};

module.exports = router;