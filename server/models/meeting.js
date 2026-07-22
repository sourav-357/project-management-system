import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Meeting title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        invitedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        status: {
            type: String,
            enum: ['scheduled', 'active', 'ended'],
            default: 'scheduled',
        },
        startedAt: {
            type: Date,
            default: null,
        },
        endedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

meetingSchema.index({ host: 1 });
meetingSchema.index({ invitedUsers: 1 });
meetingSchema.index({ status: 1 });

export const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
