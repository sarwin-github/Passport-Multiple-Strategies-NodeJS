const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Trainer = require('../../app/model/trainer');
const Client = require('../../app/model/client');
const FacebookStrategy = require('passport-facebook').Strategy;
const configAuth = require('./auth');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Serialize user for creating user session/trainer session
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.serializeUser((user,done) => {
	done(null, user.id);
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Deserialize the user and check wheter the serialize key equivalient is for trainer or client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.deserializeUser((id, done) => {

    Trainer.findById(id, function (err, user) {
         if(err)
             done(err);
         if(user) {
             done(null, user);
         }
         else {
             Client.findById(id, function (err, user) {
                 if(err)
                     done(err);
                 done(null, user);
             });
         }
     });
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Passport Strategy for creating new Trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.use('local.trainer.signup', new LocalStrategy({

	//Get the username field and password field on req.body
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//This is the Backend Validation using express-validator
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    req.checkBody('email', 'Invalid Credentials, Please check email').notEmpty().isEmail();
    req.checkBody('password', 'Password should atleast contain more than six characters').notEmpty().isLength({min:6});
    req.checkBody('name', 'Name is required').notEmpty();

    //Validate Error
    let errors = req.validationErrors();
    //If there's error push the error to messages[index] = error array
    if (errors) {
        let messages = [];
        errors.forEach((error) => {
           messages.push(error.msg);
        });

        //If there's error, create an alert that there's error, if you want to modify flash messages
        //set flash messages error info: req.flash('error', "Invalid Credentials, Please check username or password")
        return done(null, false, req.flash('error', messages));
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//A query that will search for an existing trainer in the mongo database, then after everything is validated, create new trainer
	//Find local.email from the database of trainer
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Trainer.findOne({'local.email': email}, (err, trainer)  => {
        if (err) {
            return done(err);
        }
        if (trainer) {
            return done(null, false, {message: 'That email is already taken!'});
        }
        //After everything is validated, Create new trainer
        let newTrainer = new Trainer();

        newTrainer.local.email = email;
        newTrainer.local.password = newTrainer.generateHash(password);
        newTrainer.local.isTrainer = true;

        newTrainer.local.name = req.body.name;
        newTrainer.local.description = req.body.description;
        newTrainer.local.age = req.body.age;
        newTrainer.local.birthday = req.body.birthday;
        newTrainer.local.address = req.body.address;
        newTrainer.local.specialization = req.body.specialization;
        newTrainer.local.phone = req.body.phone;
        newTrainer.local.rate = req.body.rate;
        newTrainer.local.image = req.body.image;

        newTrainer.save((err, result)  => {
           if (err) {
               return done(err);
           }
           return done(null, newTrainer);
        });
    });
}));


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Passport Strategy for Logging a Trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.use('local.trainer.login', new LocalStrategy({
	//Get the username field and password field on req.body
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//Check if email or password is empty, then validate error using the express-validator module
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    req.checkBody('email', 'Invalid Credentials, Please check email').notEmpty().isEmail();
    req.checkBody('password', 'Invalid Credentials, Please check password').notEmpty();
    let errors = req.validationErrors();

    if (errors) {
        let messages = [];
        errors.forEach((error) => {
            messages.push(error.msg);
        });

    //If there's error, create an alert that there's error, if you want to modify flash messages
    //set flash messages error info: req.flash('error', "Invalid Credentials, Please check username or password")  
    return done(null, false, req.flash('error', messages));
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//A query that will search for an existing trainer in the mongo database, then after everything is validated, Log in the user
	//Find local.email from the database of trainer
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    Trainer.findOne({'local.email': email}, (err, trainer) => {
        if (err) {
            return done(err);
        }
        if (!trainer) {
            return done(null, false, { message: 'The trainer does not exist. Click sign up to register as a trainer.'});
        }
        if (!trainer.validPassword(password)) {
            return done(null, false, { message: 'Password is invalid, Please check your password and try again.'});
        }
        return done(null, trainer);
    });
}));

passport.use('facebook.trainer', new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ["id", "emails", "displayName", "name", "timezone", "friends", "about", "gender", "profileUrl"]
    },
    // facebook will send back the token and profile
    (token, refreshToken, profile, done) => {
        // asynchronous
        process.nextTick(() => {
            // find the user in the database based on their facebook id
            Trainer.findOne({ 'facebook.id': profile.id }, (err, trainer) => {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);
                // if the user is found, then log them in
                if (trainer) {
                    return done(null, trainer); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newTrainer            = new Trainer();
                    // set all of the facebook information in our user model
                    newTrainer.facebook.id    = profile.id; // set the users facebook id                   
                    newTrainer.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newTrainer.facebook.name  = `${profile.name.givenName} ${profile.name.middleName} ${profile.name.familyName}`; // look at the passport user profile to see how names are returned
                    newTrainer.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    newTrainer.facebook.profileUrl = profile.profileUrl; 
                    newTrainer.facebook.gender = profile.gender; 


                    // save our user to the database
                    newTrainer.save(err => {
                        if (err){
                            console.log(err);
                            throw err;
                        }

                        // if successful, return the new user
                        return done(null, newTrainer);
                    });
                }
            });
        });
    }));