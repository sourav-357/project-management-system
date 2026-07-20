



import mongoose from 'mongoose';



const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'user ID is required field'],
    },
    message: {
        type: String,
        required: [true, 'message is required field'],
        trim: true,
        maxLength: [1000, 'message cannot exceed 1000 characters'],
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: null
    },
    type: {
        type: String,
        enum: ['request', 'approval', 'feedback', 'rejection', 'deadline', 'general', 'meeting', 'system'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    }
}, { timestamps: true }
);



// * indexing for better performance
notificationSchema.index({ user: 1 });
notificationSchema.index({ isRead: 1 });



export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

