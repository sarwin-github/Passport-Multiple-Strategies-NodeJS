const mongoose = require('mongoose');
const express = require('express');
const router = express();
const Gym = require('../model/gym');
const Trainer = require('../model/trainer');
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
    if(req.user.local.isTrainer === true || req.user.facebook.email){
        return next();
    }
    res.redirect('/trainer/login');
}


router.get('/', (req, res) => {
	var query = Gym.find({})
				.populate('trainers', ['local.name', 
					'local.specialization', 
					'local.address', 'local.email',
					'id'])
				.select({'__v': 0});

	query.exec((err, gym) => {
		if(err){
			return response.status(500).send({success: false, error: err, message: 'Something went wrong.'});
		}

		if(!gym){
			return response.status(200).send({success: false, message: "Record for that gym is empty"});
		}

		//res.json({success: true, gym: gym, message: "Successfully fetched all gym"});
		res.render('gym/index', { gym: gym });
	}) 
});

router.get('/search/:id', (req, res) => {
	var query = Gym.findById({ _id: req.params.id })
				.populate('trainers', ['local.name', 
					'local.specialization', 
					'local.address', 'local.email',
					'id'])
				.select({'__v': 0});

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


router.get('/create', isLoggedIn, isTrainer, (req, res) => {
	//res.json({success: true, csrfToken: req.csrfToken(), message: '', session: req.user});
	res.render('gym/create',{ csrfToken: req.csrfToken(), message: '', session: req.user });
});

router.post('/create', isLoggedIn, isTrainer, (req, res) => {

	let newGym = new Gym();

	newGym.name = req.body.name;
	newGym.description = req.body.description;
	newGym.location = req.body.location;
	newGym.image = req.body.image;
	newGym.trainers = req.user;

	newGym.save((err, gym) => {
		if(err){
			return res.render('gym/create',{success: false, error: err, message: 'Something went wrong.', session: req.user, csrfToken: req.csrfToken()});
		}
		if(!gym){
			return res.status(200).send({success: false, error: err, message: 'Something went wrong.'});
		}

	req.session.gym = newGym;

	let query = Trainer.findOne({ _id: req.user._id });

	query.exec((err, trainer) => {

		if (err) {	
			return res.status(500).send({success: false, error: err });
		}

		 // Update the existing trainer and it's gymInformation
	    trainer.local.gymInfo = req.session.gym._id;

	    // Save the trainer and check for errors 
	    trainer.save(err => {
	      	if (err) {
				return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
			}
		res.redirect('/gym');
	    });
	});

	//res.json({success: true, gym: gym, message: "Successfully added new gym"});

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