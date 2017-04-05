const express = require('express');
const router = express.Router();
const Trainer = require('../../model/trainer');

/*
    THIS ROUTES ARE UNRESTRICTED, ANYONE CAN ACCESS THE ROUTES LISTED BELOW
*/

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the trainer profile can be seen by client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/profile/:id', (req, res) => {
    ///Find the profile of the trainer, using the ID as parameter
    let query = Trainer.findById({ _id: req.params.id })
                .populate('local.gymInfo', ///Populate Gym Info details
                ['name', 'description','location', 'image']) ///Only populate the name, description, location and image
                .select({'__v': 0, 
                'local.password': 0, 'local.isTrainer':0 }); ///Remove the password and isTrainer so user cannot access that data

    ///Execute query
    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(200).send({success: false, message: "Record for that trainer does not exist"});
        }

        //res.json({user: req.user, trainer: trainer})
        res.render('accounts/trainer/profile-client-view', { trainer: trainer, user_type: req.session.type});
    });
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This will render the contact form for trainer can be seen by client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/contact/:id', (req,res) => {
    let query = Trainer.findById({_id: req.params.id})
                .populate('local.gymInfo', ['name', 'description', 'location', 'id'])
                .select({'__v': 0});

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(200).send({success: false, message: 'Record for this trainer does not exist'});
        }
        //res.json({user: req.user, trainer: trainer})
        res.render('accounts/trainer/trainer-contact-by-client', { trainer: trainer, user_type: req.session.type});
    });            
});


//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get the list of trainers can be seen by client
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
router.get('/list', (req, res) => {
    let query = Trainer.find({}).select({ '__v': 0, 'local.password': 0, 'local.isTrainer':0 });

    query.exec((err, trainer) => {
        if(err){
            return res.status(500).send({success: false, error: err, message: 'Something went wrong.'});
        }
        if(!trainer){
            return res.status(200).send({success: false, message: 'Record for that trainer does not exist'});
        }
        
        //res.json({success:true, trainer: trainer, user_type: req.session.type, message: 'Successfully fetched all trainers'})
        res.render('accounts/trainer/trainers-list', { trainer: trainer, user_type: req.session.type });
    });
});


module.exports = router;