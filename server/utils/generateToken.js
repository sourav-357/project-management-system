import crypto from 'crypto';
import { RefreshToken } from '../models/refreshToken.js';

export const generateTokenResponse = async (user, statusCode, message, req, res) => {
    const accessToken = user.generateAccessToken();
    const rawRefreshToken = user.generateRefreshToken();

    // Hash refresh token for DB storage
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Refresh token expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Persist refresh token session metadata
    await RefreshToken.create({
        user: user._id,
        tokenHash,
        ip,
        userAgent,
        expiresAt,
    });

    const isProduction = process.env.NODE_ENV === 'production';

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        expires: expiresAt,
        path: '/api/v1/auth/refresh-token',
    });

    // Also option to keep backwards compatible 'token' cookie if requested
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    res.status(statusCode).json({
        success: true,
        message,
        data: {
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                avatar: user.avatar,
                department: user.department,
                expertise: user.expertise,
                maxStudents: user.maxStudents,
                assignedStudents: user.assignedStudents,
                supervisor: user.supervisor,
                project: user.project,
            },
        },
    });
};
