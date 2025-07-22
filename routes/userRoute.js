const express = require("express")
const { loginUser,registerUser,forgetPassword,resetPassword} = require('../controller/userModelController')

const router = express.Router()

router.post("/reset-password",forgetPassword)
router.post("/login",loginUser)
router.post("/register",registerUser)
router.post("/reset-password/:token",resetPassword)

module.exports=router