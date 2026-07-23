import mongoose from 'mongoose';

export const PROJECT_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ASSIGNED: 'assigned',
    COMPLETED: 'completed',
};

const projectSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'student is required field'],
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxLength: [200, 'Project title cannot exceed 200 characters'],
    },
    description: {
        type: String,
        required: [true, 'Project description is required'],
        trim: true,
        maxLength: [2000, 'Project description cannot exceed 2000 characters'],
    },
    status: {
        type: String,
        required: [true, 'Project status is required'],
        enum: Object.values(PROJECT_STATUS),
        default: PROJECT_STATUS.PENDING || PROJECT_STATUS.SUBMITTED,
    },
    isDraft: {
        type: Boolean,
        default: false,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    files: [
        {
            fileType: {
                type: String,
                required: true
            },
            fileUrl: {
                type: String,
                required: true
            },
            originalName: {
                type: String,
                required: true
            },
            size: {
                type: Number,
                default: 0
            },
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    feedback: [
        {
            supervisorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            type: {
                type: String,
                required: true,
                enum: ['positive', 'negative', 'general'],
                default: 'general'
            },
            title: {
                type: String,
                required: true,
                trim: true,
                maxLength: [200, 'Feedback title cannot exceed 200 characters'],
            },
            message: {
                type: String,
                required: true,
                trim: true,
                maxLength: [1000, 'Feedback message cannot exceed 1000 characters'],
            },
            createdAt: {
                type: Date,
                default: Date.now,
            }
        }
    ],
    deadline: {
        type: Date
    }
}, { timestamps: true });

// * Compound Indexes based on production query access patterns
projectSchema.index({ student: 1, isDeleted: 1 });
projectSchema.index(
    { student: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false, status: { $nin: ['completed', 'rejected'] } } } // Enforces 1 active non-finalized project per student
);
projectSchema.index({ supervisor: 1, status: 1, isDeleted: 1 });
projectSchema.index({ status: 1, createdAt: -1 });

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
