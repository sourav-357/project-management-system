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

const milestoneSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Milestone title is required'],
        trim: true,
        maxLength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    dueDate: {
        type: Date,
        required: [true, 'Milestone due date is required'],
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'approved', 'rejected'],
        default: 'pending',
    },
    submissionUrl: {
        type: String,
        default: '',
    },
    teacherFeedback: {
        type: String,
        default: '',
    },
    submittedAt: Date,
    reviewedAt: Date,
}, { timestamps: true });

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
    milestones: [milestoneSchema],
    deadline: {
        type: Date
    }
}, { timestamps: true });

// * Compound Indexes based on production query access patterns
projectSchema.index({ student: 1, isDeleted: 1 });
projectSchema.index(
    { student: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } } // Enforces 1 active project per student
);
projectSchema.index({ supervisor: 1, status: 1, isDeleted: 1 });
projectSchema.index({ status: 1, createdAt: -1 });

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
