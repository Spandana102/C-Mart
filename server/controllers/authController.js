const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// Register User
const registerUser = async (req, res) => {
    try {

        const { fullName, email, password, collegeId, phoneNumber } = req.body;


        // Check existing user
        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                message:"User already exists"
            });
        }


        // Password encryption
        const hashedPassword = await bcrypt.hash(password,10);


        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            collegeId,
            phoneNumber
        });


        res.status(201).json({
            message:"User registered successfully",
            user
        });


    } catch(error){

        res.status(500).json({
            message:error.message
        });

    }
};



// Login User
const loginUser = async(req,res)=>{

    try{

        const {email,password}=req.body;


        const user = await User.findOne({email});


        if(!user){
            return res.status(404).json({
                message:"User not found"
            });
        }


        const isMatch = await bcrypt.compare(
            password,
            user.password
        );


        if(!isMatch){
            return res.status(400).json({
                message:"Invalid password"
            });
        }


        const token = jwt.sign(
  {
    id: user._id,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "1d"
  }
);

        res.json({
            message:"Login successful",
            token,
            user
        });



    }catch(error){

        res.status(500).json({
            message:error.message
        });

    }

};

// Get User Profile
const getProfile = async (req, res) => {
    try {

        const user = await User.findById(req.user.id)
            .select("-password");

        res.json({
            message: "Profile fetched successfully",
            user
        });

    } catch(error) {

        res.status(500).json({
            message: error.message
        });

    }
};
// Update User Profile
const updateProfile = async (req, res) => {
    try {

        const { fullName, phoneNumber, collegeId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                fullName,
                phoneNumber,
                collegeId
            },
            {
                new: true
            }
        ).select("-password");


        res.json({
            message: "Profile updated successfully",
            user
        });


    } catch(error) {

        res.status(500).json({
            message: error.message
        });

    }
};
module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile
};