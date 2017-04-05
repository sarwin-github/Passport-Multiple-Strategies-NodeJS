//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//Add the required modules
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const mongoose = require('mongoose');
const express = require('express');
const router = express();
const Gym = require('../../model/gym');
const Trainer = require('../../model/trainer');
const csrf = require('csurf');

/* Create a middleware for CSRF token creation and validation. This middleware adds a req.csrfToken() 
function to make a token which should be added to requests which mutate state, within a hidden form field, 
query-string etc. This token is validated against the visitor's session or csrf cookie.*/

const csrfProtection = csrf();
router.use(csrfProtection);

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// A middleware that will check if the user trying to log in is indeed a trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
const isTrainer = (req, res, next) => {
    if(req.user.local.isTrainer === true || req.user.facebook.email && req.user.local.name != null){
        return next();
    }
    ///Flash this message if a trainer create a gym while using facebook oauth
    req.flash('message', 'Sorry, creating a gym is not yet supported for trainer authenticated by facebook');
    res.redirect('/trainer/login');
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the list of Gym and it's corresponding trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/', (req, res) => {
	let message = req.flash('message');

	let query = Gym.find({})
				///Gym is has a one to one relationship with trainer so it can be populated
				///Populate the referenced trainer and only show the name, specialization, address and email
				.populate('trainers', ['local.name', 
					'local.specialization', 
					'local.address', 'local.email',
					'id'])
				.select({'__v': 0});
	///Execute query
	query.exec((err, gym) => {
		if(err){
			return response.status(500).send({success: false, error: err, message: 'Something went wrong.'});
		}
		if(!gym){
			return response.status(200).send({success: false, message: "Record for that gym is empty"});
		}
		res.json({success: true, gym: gym, message: "Successfully fetched all gym"});
		//res.render('gym/index', { gym: gym, user_type: req.session.type, message: message });
	}) 
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Gym profile, view has not been created yet
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/search/:id', (req, res) => {
	var query = Gym.findById({ _id: req.params.id })
				///Gym have one to one relationship with trainer's model
				///Populate the referenced trainer and only show the name, specialization, address and email
				.populate('trainers', ['local.name', 
					'local.specialization', 
					'local.address', 'local.email',
					'id'])
				.select({'__v': 0});
	///Execute query			
	query.exec((err, gym) => {
		if(err){
			return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
		}
		if(!gym){
			return res.status(200).send({success: false, message: "Record for that gym does not exist"});
		}
		res.json({success: true, gym: gym, message: "Successfully fetched the gym"});
	});
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the Create Gym Form, One gym per trainer
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/create', isLoggedIn, isTrainer, (req, res) => {
	//res.json({success: true, csrfToken: req.csrfToken(), message: '', session: req.user});
	res.render('gym/create',
	{ 
		csrfToken: req.csrfToken(), 
		user_type: req.session.type, 
		message: '', 
		session: req.user 
	});
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// After everything is validated the http post will execute
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.post('/create', isLoggedIn, isTrainer, (req, res) => {

	///This will create the new Gym
	let newGym = new Gym();

	newGym.name = req.body.name;
	newGym.description = req.body.description;
	newGym.location = req.body.location;
	newGym.image = req.body.image;
	newGym.trainers = req.user;

	///Process the new Gym for saving
	newGym.save((err, gym) => {
		///Check for errors, If there's no errors execute the next function which will update the trainer's gym info
		if(err){
			//return res.json({ success: false, error: err, message: 'Something went wrong.', session: req.user, csrfToken: req.csrfToken() })
			return res.render('gym/create', 
			{ 
				success: false, 
			  	error: err, 
			  	message: 'Something went wrong.', 
			  	session: req.user, 
			  	csrfToken: req.csrfToken()
			});
		}
		if(!gym){
			return res.status(200).send(
			{
				success: false, 
				error: err, 
				message: 'Something went wrong.'
			});
		}

	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// This will update the trainer's gym information as gym information will be empty for newly created trainers
	//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	///create a session for the new created gym so that the trainer that will be updated can access the object id of the gym
	req.session.gym = newGym;

	///Get the logged in user id
	let query = Trainer.findOne({ _id: req.user._id });

	///Execute query
	query.exec((err, trainer) => {
		if (err) {	
			return res.status(500).send({success: false, error: err });
		}
		///Update the existing trainer and it's gymInfo
	    trainer.local.gymInfo = req.session.gym._id;
	    ///Process the info needed for updating the trainer's gymInfo
	    trainer.save(err => {
	      	if (err) {
				return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
			}
			//res.json({success: true, gym: gym, message: "Successfully added new gym"});
			req.flash('message', 'Successfully added a new Gym');
			res.redirect('/gym');
	    	});
		});
	});
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