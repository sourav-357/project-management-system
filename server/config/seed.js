import { User } from '../models/user.js';

export const seedDefaultUsers = async () => {
    try {
        const adminCount = await User.countDocuments({ role: 'Admin', isDeleted: false });
        if (adminCount === 0) {
            await User.create({
                name: 'System Admin',
                email: 'admin@university.edu',
                password: 'admin123456',
                role: 'Admin',
                department: 'Administration',
                status: 'active'
            });
        }

        const teacherCount = await User.countDocuments({ role: 'Teacher', isDeleted: false });
        if (teacherCount === 0) {
            await User.create({
                name: 'System Teacher',
                email: 'teacher@university.edu',
                password: 'teacher123456',
                role: 'Teacher',
                department: 'Computer Science',
                expertise: ['Web Development', 'Artificial Intelligence', 'Software Engineering'],
                maxStudents: 10,
                status: 'active'
            });
        }

        const studentCount = await User.countDocuments({ role: 'Student', isDeleted: false });
        if (studentCount === 0) {
            await User.create({
                name: 'System Student',
                email: 'student@university.edu',
                password: 'student123456',
                role: 'Student',
                department: 'Computer Science',
                status: 'active'
            });
        }
    } catch (error) {
        console.error('Error seeding default users:', error.message);
    }
};
