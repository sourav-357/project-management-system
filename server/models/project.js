



import mongoose from 'mongoose';



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
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
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
        }
    ],
    deadline: {
        type: Date
    }
}, { timestamps: true }
);



// * indexing for better performance
projectSchema.index({ student: 1 });
projectSchema.index({ supervisor: 1 });
projectSchema.index({ status: 1 });



export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

