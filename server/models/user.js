

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import validator from 'validator';



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: [2, "Name must contain at least 2 characters"],
        required: [true, 'name is required field'],
        trim: true,
        maxLength: [40, 'name cannot exceed 40 characters']
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    password: {
        type: String,
        required: [true, 'password is required'],
        minLength: [8, 'minimum length is 8 characters'],
        maxLength: [100, "Password cannot exceed 100 characters"],
        select: false
    },
    role: {
        type: String,
        default: 'Student',
        enum: ['Student', 'Teacher', 'Admin'],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    department: {
        type: String,
        trim: true,
        default: ''
    },
    expertise: {
        type: [String],
        default: [],
    },
    maxStudents: {
        type: Number,
        default: 10,
        min: [1, 'minimum students must be 1'],
    },
    assignedStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null
    }
},{ timestamps: true }
);




userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});



userSchema.methods.generateToken = function () {
    return jwt.sign({ id: this.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
}



userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}



export const User = mongoose.model('User', userSchema)
