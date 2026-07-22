import { User } from '../models/user.js';

export const seedDefaultUsers = async () => {
    try {
        const adminCount = await User.countDocuments({ role: 'Admin', isDeleted: false });
        if (adminCount === 0) {
            console.log('Seeding default Admin user...');
            await User.create({
                name: 'System Admin',
                email: 'admin@university.edu',
                password: 'admin123456',
                role: 'Admin',
                department: 'Administration',
                status: 'active'
            });
            console.log('Default Admin user created: admin@university.edu / admin123456');
        }

        const teacherCount = await User.countDocuments({ role: 'Teacher', isDeleted: false });
        if (teacherCount === 0) {
            console.log('Seeding default Teacher user...');
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
            console.log('Default Teacher user created: teacher@university.edu / teacher123456');
        }

        const studentCount = await User.countDocuments({ role: 'Student', isDeleted: false });
        if (studentCount === 0) {
            console.log('Seeding default Student user...');
            await User.create({
                name: 'System Student',
                email: 'student@university.edu',
                password: 'student123456',
                role: 'Student',
                department: 'Computer Science',
                status: 'active'
            });
            console.log('Default Student user created: student@university.edu / student123456');
        }
    } catch (error) {
        console.error('Error seeding default users:', error.message);
    }
};
