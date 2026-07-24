import { asyncHandler } from '../middlewares/asyncHandler.js';
import ErrorHandler from '../middlewares/error.js';
import { User } from '../models/user.js';
import { Project } from '../models/project.js';
import * as userService from '../services/userService.js';
import * as projectService from '../services/projectService.js';

// * Create Student
export const createStudent = asyncHandler(async (req, res, next) => {
    const { name, email, password, department } = req.body;
    if (!name || !email || !password || !department) {
        return next(new ErrorHandler('Please provide name, email, password, and department', 400));
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        return next(new ErrorHandler('User with this email already exists', 400));
    }

    const user = await userService.createUser({
        name,
        email: email.toLowerCase().trim(),
        password,
        department,
        role: 'Student',
        status: 'active'
    });

    res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: { user },
    });
});

// * Update Student
export const updateStudent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.role;

    const user = await User.findById(id);
    if (!user || user.role !== 'Student') {
        return next(new ErrorHandler('Student not found', 404));
    }

    const updatedUser = await userService.updateUser(id, updateData);

    res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: { updatedUser },
    });
});

// * Delete Student (Soft Delete)
export const deleteStudent = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
        id,
        { isDeleted: true, status: 'archived' },
        { new: true, runValidators: false }
    );
    if (!user || user.role !== 'Student') {
        return next(new ErrorHandler('Student not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Student archived/deleted successfully'
    });
});

// * Create Teacher
export const createTeacher = asyncHandler(async (req, res, next) => {
    const { name, email, password, department, maxStudents, expertise } = req.body;
    if (!name || !email || !password || !department) {
        return next(new ErrorHandler('Please provide name, email, password, and department', 400));
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        return next(new ErrorHandler('User with this email already exists', 400));
    }

    const user = await userService.createUser({
        name,
        email: email.toLowerCase().trim(),
        password,
        department,
        role: 'Teacher',
        maxStudents: maxStudents || 10,
        status: 'active',
        expertise: Array.isArray(expertise)
            ? expertise
            : typeof expertise === 'string' && expertise.trim() !== ''
            ? expertise.split(',').map(item => item.trim())
            : [],
    });

    res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: { user },
    });
});

// * Update Teacher
export const updateTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };

    delete updateData.password;
    delete updateData.role;

    if (updateData.expertise && typeof updateData.expertise === 'string') {
        updateData.expertise = updateData.expertise.split(',').map(item => item.trim());
    }

    const user = await User.findById(id);
    if (!user || user.role !== 'Teacher') {
        return next(new ErrorHandler('Teacher not found', 404));
    }

    const updatedUser = await userService.updateUser(id, updateData);

    res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: { updatedUser },
    });
});

// * Delete Teacher (Soft Delete)
export const deleteTeacher = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(
        id,
        { isDeleted: true, status: 'archived' },
        { new: true, runValidators: false }
    );
    if (!user || user.role !== 'Teacher') {
        return next(new ErrorHandler('Teacher not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Teacher archived/deleted successfully'
    });
});

// * Toggle User Status (Active / Pending / Suspended / Archived)
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'suspended', 'archived'].includes(status)) {
        return next(new ErrorHandler('Invalid status specified', 400));
    }

    const user = await User.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: false }
    ).select('-password');

    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: status === 'active' ? 'User account activated/approved successfully' : `User status updated to ${status}`,
        data: { user },
    });
});

// * Get All Users (With Pagination, Search, Filter)
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const { role, search, status, page = 1, limit = 50 } = req.query;

    const query = { isDeleted: false, role: { $ne: 'Admin' } };
    if (role && ['Student', 'Teacher'].includes(role)) {
        query.role = role;
    }
    if (status && ['active', 'pending', 'suspended', 'archived'].includes(status)) {
        query.status = status;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
        ];
    }

    const users = await User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        data: { users },
    });
});

// * Get All Projects for Admin Oversight
export const getAllProjects = asyncHandler(async (req, res, next) => {
    const { projects } = await projectService.getAllProjects();

    res.status(200).json({
        success: true,
        message: 'All projects fetched successfully',
        data: { projects },
    });
});

// * Admin Review Proposal (Approve / Reject)
export const reviewProposalAdmin = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { action } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(action)) {
        return next(new ErrorHandler('Invalid action specified', 400));
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    project.status = action;
    await project.save();

    res.status(200).json({
        success: true,
        message: `Project proposal ${action} by Admin`,
        data: { project },
    });
});

// * Assign Supervisor to Student Project
export const assignSupervisor = asyncHandler(async (req, res, next) => {
    const { projectId, teacherId } = req.body;

    if (!projectId || !teacherId) {
        return next(new ErrorHandler('Project ID and Teacher ID are required', 400));
    }

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'Teacher' || teacher.isDeleted) {
        return next(new ErrorHandler('Teacher not found or invalid role', 404));
    }

    const student = await User.findById(project.student);
    if (!student) {
        return next(new ErrorHandler('Student not found', 404));
    }

    // Link supervisor to project and student
    project.supervisor = teacherId;
    project.status = 'assigned';
    await project.save();

    student.supervisor = teacherId;
    await student.save({ validateBeforeSave: false });

    if (!teacher.assignedStudents.includes(student._id)) {
        teacher.assignedStudents.push(student._id);
        await teacher.save({ validateBeforeSave: false });
    }

    res.status(200).json({
        success: true,
        message: `Supervisor ${teacher.name} assigned to project successfully`,
        data: { project },
    });
});

// * Admin Dashboard High-Level Stats
export const getAdminDashboardStats = asyncHandler(async (req, res, next) => {
    const [totalStudents, totalTeachers, totalProjects, pendingProposals, activeSupervisions] = await Promise.all([
        User.countDocuments({ role: 'Student', isDeleted: false }),
        User.countDocuments({ role: 'Teacher', isDeleted: false }),
        Project.countDocuments({ isDeleted: false }),
        Project.countDocuments({ status: 'pending', isDeleted: false }),
        Project.countDocuments({ status: { $in: ['assigned', 'approved'] }, isDeleted: false }),
    ]);

    res.status(200).json({
        success: true,
        data: {
            totalStudents,
            totalTeachers,
            totalProjects,
            pendingProposals,
            activeSupervisions,
        },
    });
});
