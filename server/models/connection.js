import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema(
    {
        requester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'blocked'],
            default: 'pending',
            required: true,
        },
        blockedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ status: 1 });
connectionSchema.index({ rejectedAt: 1 });

export const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);
