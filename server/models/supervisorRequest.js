import mongoose from 'mongoose';

const supervisorRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'student ID is required field'],
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'supervisor ID is required field'],
    },
    message: {
        type: String,
        required: [true, 'message is required field'],
        trim: true,
        maxLength: [500, 'message cannot exceed 500 characters'],
    },
    status: {
        type: String,
        required: [true, 'status is required field'],
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
}, { timestamps: true });

// * Compound Indexes with Unique Constraints & Partial Filtering
supervisorRequestSchema.index({ student: 1, supervisor: 1, status: 1 });
supervisorRequestSchema.index(
    { student: 1, supervisor: 1 },
    { unique: true, partialFilterExpression: { status: 'pending' } } // Prevents duplicate pending requests to same teacher
);
supervisorRequestSchema.index({ supervisor: 1, status: 1, createdAt: -1 });

export const SupervisorRequest = mongoose.models.SupervisorRequest || mongoose.model('SupervisorRequest', supervisorRequestSchema);
