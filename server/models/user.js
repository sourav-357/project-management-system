

import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { kMaxLength } from 'buffer';



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required field'],
        trim: true,
        maxLength: [40, 'name cannot exceed 40 characters']
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        required: [true, 'email is required field'],
        unique: [true, 'no duplicate emails allowed']
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'password is required'],
        minLength: [8, 'minimum length is 8 characters']
    },
    role: {
        type: String,
        default: 'Student',
        enum: ["Student", "Teacher", "Admin"],
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    department: {
        type: String,
        trim: true,
        default: ""
    },
    experties: {
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



export default 

