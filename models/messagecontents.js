const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const user= require('./user');

const messagecontentsSchema = new Schema({
    username : String,
    to: String,
    html:String    
});

const MessageContents = mongoose.model('messagecontents', messagecontentsSchema);
module.exports = MessageContents;