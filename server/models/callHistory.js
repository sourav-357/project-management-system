import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema(
    {
        callType: {
            type: String,
            enum: ['one_to_one_voice', 'one_to_one_video', 'group_meeting'],
            required: true,
        },
        host: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        title: {
            type: String,
            default: 'Call / Meeting',
        },
        status: {
            type: String,
            enum: ['ongoing', 'completed', 'declined', 'missed'],
            default: 'completed',
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
        endedAt: {
            type: Date,
            default: Date.now,
        },
        durationSeconds: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

callHistorySchema.index({ host: 1 });
callHistorySchema.index({ participants: 1 });
callHistorySchema.index({ createdAt: -1 });

export const CallHistory = mongoose.models.CallHistory || mongoose.model('CallHistory', callHistorySchema);
