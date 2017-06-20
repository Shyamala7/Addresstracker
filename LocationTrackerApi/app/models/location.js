// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Location', new Schema({ 
    user: {type: mongoose.Schema.Types.ObjectId, ref:'User'}, 
    location: String,
    latitude: Number,
    longitude: Number,
    street: String,
    city: String,
    zipcode: String,
    state: String,
    country: String
}));