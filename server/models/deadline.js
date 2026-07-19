



import mongoose from 'mongoose';



const deadlineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Deadline name/title is required'],
        trim: true,
        maxLength: [100, 'Deadline name/title cannot exceed 100 characters'],
    },
    dueDate: {
        type: Date,
        required: [true, 'Deadline due date is required'],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'Deadline created by is required'],
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null
    },
}, { timestamps: true }
);



// * indexing for better performance
deadlineSchema.index({ dueDate: 1 });
deadlineSchema.index({ project: 1 });
deadlineSchema.index({ createdBy: 1 });



export const Project = mongoose.models.Deadline || mongoose.model('Deadline', deadlineSchema);

