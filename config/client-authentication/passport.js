const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Client = require('../../app/model/client');
const FacebookStrategy = require('passport-facebook').Strategy;
const configAuth = require('./auth');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Passport Strategy for creating new Trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.use('local.client.signup', new LocalStrategy({
	//Get the username field and password field on req.body
	usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, (req, email, password, done) => {

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//This is the Backend Validation using express-validator
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	req.checkBody('email', 'Invalid Credentials, Please check email').notEmpty().isEmail();
	req.checkBody('password', 'Password should atleast contain more than six characters').notEmpty().isLength({min: 6});
    req.checkBody('name', 'Name is required').notEmpty();

	//Validate Error
	let errors = req.validationErrors();
	//If there's error push the error to messages[index] = error array
	if(errors){
		let messages = [];
		errors.forEach((error) => {
			messages.push(error.msg);
		});
     
 		//If there's error, create an alert that there's error, if you want to modify flash messages
        //set flash messages error info: req.flash('error', "Invalid Credentials, Please check username or password")
        return done(null, false, req.flash('error', messages));
    }

    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	//A query that will search for an existing client in the mongo database, then after everything is validated, create new client
	//Find local.email from the database of client
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	Client.findOne({'local.email': email}, (err, client) => {
		if(err){
			return done(err);
		}
		if(client){
			return done(null, false, { message: 'That email is already taken!'});
		}

		let newClient = new Client();

		newClient.local.email = email;
		newClient.local.password = newClient.generateHash(password);
		newClient.local.isClient = true;
		
		newClient.local.name = req.body.name;
		newClient.local.age = req.body.age;
		newClient.local.birthday = req.body.birthday;
		newClient.local.address = req.body.address;
		
		newClient.save((err,result) => {
			if(err){
				return done(err);
			}
			return done(null, newClient);
		});
	});
}));

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Passport Strategy for Logging a Trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
passport.use('local.client.login', new LocalStrategy({
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

    Client.findOne({'local.email': email}, (err, client) => {
        if(err){
            return done(err);
        }
        if(!client){
           return done(null, false, {message: 'The trainer does not exist. Click sign up to register as a client.'})
        }
        if(!client.validPassword(password)){
           return done(null, false, { message: 'Password is invalid, Please check your password and try again.'});
        }

        return done(null, client)
    });
}));

passport.use('facebook.client', new FacebookStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ["emails", "displayName", "name","timezone", "friends", "about", "gender", "profileUrl"]
    },
    // facebook will send back the token and profile
    (token, refreshToken, profile, done) => {
        // asynchronous
        process.nextTick(() => {
            // find the user in the database based on their facebook id
            Client.findOne({ 'facebook.id': profile.id }, (err, trainer) => {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);
                // if the user is found, then log them in
                if (trainer) {
                    return done(null, trainer); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newClient             = new Client();
                    // set all of the facebook information in our user model
                    newClient.facebook.id    = profile.id; // set the users facebook id                   
                    newClient.facebook.token = token; // we will save the token that facebook provides to the user                    
                    newClient.facebook.name  = `${profile.name.givenName} ${profile.name.middleName} ${profile.name.familyName}`; // look at the passport user profile to see how names are returned
                    newClient.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                    newClient.facebook.profileUrl = profile.profileUrl; 
                    newClient.facebook.gender = profile.gender; 

                    // save our user to the database
                    newClient.save(err => {
                        if (err){
                            console.log(err);
                            throw err;
                        }

                        // if successful, return the new user
                        return done(null, newClient);
                    });
                }
            });
        });
    }));