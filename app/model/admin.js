const mongoose = require('mongoose');
const bcrypt = require('bcrypt-nodejs');

const validateEmail = function(email) {
    let regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
};

const adminSchema = mongoose.Schema({
	email 	: 	{ 
				type: String, 
				unique: true, 
				required: true, 
				validate: [validateEmail, 
				'Please fill a valid email address'],
		        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
		    	},
    password : { type: String, required: true },
    name 	 : { type: String, required: true},
    isAdmin : Boolean
});

adminSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

adminSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('Administrator', adminSchema);

