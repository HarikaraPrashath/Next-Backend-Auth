const mongoose = require("mongoose")

const informationUser = new mongoose.Schema({
    name:{type:String},
    email:{type:String},
    password:{type:String}
})

module.exports = mongoose.model("InformationAboutAuth",informationUser)