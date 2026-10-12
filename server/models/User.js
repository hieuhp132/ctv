const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{15,}$/;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: { 
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    credit: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ["candidate", "admin", "lower_admin", "recruiter", "recruiter_freelancer", "recruiter_fulltime"],
        default: "recruiter_freelancer"
    },
    jobs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      }],
})

// Hash mat khau truoc khi luu
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

//==== helper function ====
// matchPassword
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model("User", userSchema);
module.exports = User;
