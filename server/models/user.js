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
        maxLength: [50, 'name cannot exceed 50 characters']
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
    status: {
        type: String,
        enum: ['active', 'suspended', 'archived'],
        default: 'active',
    },
    avatar: {
        type: String,
        default: '',
    },
    isDeleted: {
        type: Boolean,
        default: false,
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
}, { timestamps: true }
);

// Indexes based on query patterns
userSchema.index({ role: 1 });
userSchema.index({ status: 1, isDeleted: 1 });
userSchema.index({ department: 1 });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET || 'fallback_secret_key_for_dev_env',
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_key_for_dev_env',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );
};

userSchema.methods.comparePassword = async function (enteredPassword) {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    return resetToken;
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
