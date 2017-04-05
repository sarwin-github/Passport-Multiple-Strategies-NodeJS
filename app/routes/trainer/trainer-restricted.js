const express = require('express');
const router = express.Router();
const passport = require('passport');
const csrf = require('csurf');
const Trainer = require('../../model/trainer');

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
    let facebookWarning = req.flash('message');
    
    ///Set the request session root url to /client this will be added to the navigation bar to know what type of user is logged in
    req.session.type = "/trainer";

    ///Token will be validated every login get request, 
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0  });
    res.render('accounts/trainer/login', 
    { 
        csrfToken: req.csrfToken(), 
        message: messages, 
        facebookWarning: facebookWarning, 
        hasErrors: messages.length > 0  
    });
});

router.post('/login', passport.authenticate('local.trainer.login', {
    ///If passport is successful in authenticating login, redirect to trainer profile
    successRedirect: '/trainer/profile',
    ///If passport failed in authenticating login redirect to login page again
    failureRedirect: '/trainer/login',
    failureFlash: true
}));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Sign up Page, to pass the data to react use the res.json/ response.json
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/signup', (req, res) => {
    let messages = req.flash('error');
    
    ///Set the request session root url to /client this will be added to the navigation bar to know what type of user is logged in
    req.session.type = "/trainer";
    req.logout(); ///Logout any user before redirecting to profile after successful registration or sign up

    ///Token will be validated every Sign up get request,
    //res.json({ csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0 })
    res.render('accounts/trainer/signup', { csrfToken: req.csrfToken(), message: messages, hasErrors: messages.length > 0 });
});

router.post('/signup', passport.authenticate('local.trainer.signup', {
    ///If passport is successful in authenticating signup, redirect to trainer profile
    successRedirect: '/trainer/profile',
    ///If passport failed in authenticating signup, redirect to sign up page again
    failureRedirect: '/trainer/signup',
    failureFlash: true
}));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Trainer Profile Page, to pass the data to react use the res.json/ response.json
// you can access the trainer data using, trainer.local.email if you want to see the email of the trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/profile/', isLoggedIn, isTrainer, (req, res) => {

    ///Trainer have one to one relationship with Gym
    ///Populate the referenced Gym and only show the name, description and location
    let query = Trainer.findById({ _id: req.user._id })
                .populate('local.gymInfo', 
                ['name', 'description', 'location', 'image', 'id'])
                .select({'__v': 0});

    ///Execute the query
    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(204).send({success: false, message: "Record for that trainer does not exist"});
        }
        //res.json({trainer: trainer})
        res.render('accounts/trainer/profile', {
            trainer: trainer, user_type: req.session.type
        });
    });   
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the update form for user
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/update', isLoggedIn, isTrainer, (req, res) => {
    let messages = req.flash('error');

    ///Populate the referenced Gym and only show the name, description and location
    let query = Trainer.findById({ _id: req.user._id })
                .populate('local.gymInfo', ///Populate Gym Info details
                ['name', 'description','location', 'image']) ///Only populate the name, description, location and image
                .select({'__v': 0, 
                'local.password': 0, 'local.isTrainer':0 }); ///Remove the password and isTrainer so user cannot access that data

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(204).send({success: false, message: 'Record for that trainer does not exist'});
        }
        res.json(
        {
            trainer: trainer, 
            csrfToken: req.csrfToken(), 
            message: messages, 
            hasErrors: messages.length > 0 
        });
    });
});

router.put('/update', (req, res) => {
    let query = Trainer.findById({_id: req.user._id }).select({'local.name': 1, 'phone': 1});

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(204).send({success: false, message: 'Record for that trainer does not exist'});
        }

        trainer.local.name = req.body.name;
        trainer.local.phone = req.body.phone;
        trainer.local.birthday = req.body.birthday;
        trainer.local.age = req.body.age;

        trainer.save(err => {
            if(err){
                return res.status(500).send({
                    success: false, 
                    error: err, 
                    message: 'Something went wrong.'
                });
            }
        //res.json({success: true, gym: gym, message: "Successfully added new gym"});
        req.flash('message', 'Successfully updated your profile');
        res.json({trainer: trainer, message: 'Successfully updated your profile'})   
        })

   
    });
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Facebook Authentication
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/auth/facebook', passport.authenticate('facebook.trainer', { scope : ['email', 'public_profile', 'user_friends']}));

    ///handle the callback after facebook has authenticated the user
    router.get('/auth/facebook/callback',
        passport.authenticate('facebook.trainer', {
            successRedirect : '/trainer/profile',
            failureRedirect : '/index'
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
    res.redirect('/index');
};


module.exports = router;