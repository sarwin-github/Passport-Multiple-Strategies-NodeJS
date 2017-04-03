const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const clientSchema = mongoose.Schema({
	//Data for local authentication
	local: {
		//login email and password
		email 		 	: { type: String, required: true },
		password 	 	: String,
		//account info
        isClient    	: Boolean,
        name 		 	: String,
        age             : String,
        birthday        : Date,
        address         : [String]
	},
	//Data for oauth using facebook
	facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    //Data for oauth using gmail or google+
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }
});

clientSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

clientSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.local.password);
};


module.exports = mongoose.model('Client', clientSchema);