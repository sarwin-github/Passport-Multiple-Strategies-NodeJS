const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Client = require('../../app/model/trainer');

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
	//Check if email or password is empty, then validate error using the express-validator module
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	req.checkBody().notEmpty().isEmail();
	req.checkBody().notEmpty().isLength({min: 6});
	//Validate Error
	var errors = req.validationErrors();
	//If there's error push the error to messages[index] = error array
	if(errors){
		var messages = [];
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
	Client.findOne({'local.email': email}, (err, user) => {
		if(err){
			return done(err);
		}
		if(user){
			return done(null, false, { message: 'That email is already taken!'});
		}

		var newClient = new Client();

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