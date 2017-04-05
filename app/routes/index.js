const express = require('express');
const router = express.Router();
const Gym = require('../model/gym');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//This will be the landing page or home page which will render the list of Gym
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/', (req, res) => {
	let message = req.flash('message');

	let query = Gym.find({})
				///Gym is has a one to one relationship with trainer so it can be populated
				///Populate the referenced trainer and only show the name, specialization, address and email
				.populate('trainers', ['local.name', 
					'local.specialization', 
					'local.address', 'local.email',
					'local.rate', 'id'])
				.select({'__v': 0});
	///Execute query
	query.exec((err, gym) => {
		if(err){
			return response.status(500).send({success: false, error: err, message: 'Something went wrong.'});
		}
		if(!gym){
			return response.status(200).send({success: false, message: "Record for that gym is empty"});
		}
		//res.json({success: true, gym: gym, message: "Successfully fetched all gym"});
		res.render('gym/index', { gym: gym, user_type: req.session.type, message: message });
	}) 

});

router.get('/index', (req, res) => {
    res.render('index');
});


module.exports = router;