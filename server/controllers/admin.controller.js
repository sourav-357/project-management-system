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
        role: 'Student'
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
    const user = await User.findById(id);
    if (!user || user.role !== 'Student') {
        return next(new ErrorHandler('Student not found', 404));
    }

    user.isDeleted = true;
    user.status = 'archived';
    await user.save();

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
    const user = await User.findById(id);
    if (!user || user.role !== 'Teacher') {
        return next(new ErrorHandler('Teacher not found', 404));
    }

    user.isDeleted = true;
    user.status = 'archived';
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Teacher archived/deleted successfully'
    });
});

// * Toggle User Status (Active / Suspended)
export const toggleUserStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'suspended'

    if (!['active', 'suspended', 'archived'].includes(status)) {
        return next(new ErrorHandler('Invalid status specified', 400));
    }

    const user = await User.findById(id);
    if (!user) {
        return next(new ErrorHandler('User not found', 404));
    }

    user.status = status;
    await user.save();

    res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        data: { user },
    });
});

// * Get All Users (With Pagination, Search, Filter)
export const getAllUsers = asyncHandler(async (req, res, next) => {
    const { role, search, status, page = 1, limit = 50 } = req.query;

    const query = { isDeleted: false, role: { $ne: 'Admin' } };
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        message: 'Users fetched successfully',
        data: { users, total, page: Number(page), pages: Math.ceil(total / limit) },
    });
});

// * Get All Projects
export const getAllProjects = asyncHandler(async (req, res, next) => {
    const projects = await Project.find({ isDeleted: false })
        .populate('student', 'name email department avatar')
        .populate('supervisor', 'name email department avatar')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: 'All projects fetched successfully',
        data: { projects },
    });
});

// * Admin Proposal Final Override Approval / Rejection
export const reviewProposalAdmin = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const { status, remarks } = req.body; // 'approved' or 'rejected'

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    project.status = status;
    if (remarks) {
        project.feedback.push({
            supervisorId: req.user._id,
            type: status === 'approved' ? 'positive' : 'negative',
            title: `Admin Proposal Review (${status.toUpperCase()})`,
            message: remarks,
        });
    }

    await project.save();

    res.status(200).json({
        success: true,
        message: `Project proposal status set to ${status}`,
        data: { project },
    });
});

// * Admin Assign Supervisor Manually
export const assignSupervisor = asyncHandler(async (req, res, next) => {
    const { projectId, supervisorId } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
        return next(new ErrorHandler('Project not found', 404));
    }

    if (project.status !== 'approved' && project.status !== 'assigned') {
        return next(new ErrorHandler('Supervisors can only be assigned to approved projects', 400));
    }

    const supervisor = await User.findById(supervisorId);
    if (!supervisor || supervisor.role !== 'Teacher') {
        return next(new ErrorHandler('Invalid teacher selected', 400));
    }

    project.supervisor = supervisorId;
    await project.save();

    await User.findByIdAndUpdate(project.student, { supervisor: supervisorId });
    await User.findByIdAndUpdate(supervisorId, { $addToSet: { assignedStudents: project.student } });

    res.status(200).json({
        success: true,
        message: 'Supervisor assigned successfully',
        data: { project },
    });
});

// * Get Admin System Dashboard Analytics
export const getAdminDashboardStats = asyncHandler(async (req, res, next) => {
    const totalStudents = await User.countDocuments({ role: 'Student', isDeleted: false });
    const totalTeachers = await User.countDocuments({ role: 'Teacher', isDeleted: false });
    const totalProjects = await Project.countDocuments({ isDeleted: false });
    const pendingProposals = await Project.countDocuments({ status: 'pending', isDeleted: false });
    const approvedProjects = await Project.countDocuments({ status: 'approved', isDeleted: false });

    res.status(200).json({
        success: true,
        message: 'Admin dashboard stats fetched successfully',
        data: {
            metrics: {
                totalStudents,
                totalTeachers,
                totalProjects,
                pendingProposals,
                approvedProjects,
            },
        },
    });
});
