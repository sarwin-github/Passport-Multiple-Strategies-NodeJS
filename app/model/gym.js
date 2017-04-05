const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const gymSchema = mongoose.Schema({
	name: { type: String, required: true },
	trainers: { type: Schema.Types.ObjectId, ref: 'Trainer', required: true},
	description: { type: String, required: true },
	location: {type: String, required: true },
	image: [String] //Can contain many images
});

module.exports = mongoose.model('Gym', gymSchema);