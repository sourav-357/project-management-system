import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    tokenHash: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        default: 'unknown',
    },
    userAgent: {
        type: String,
        default: 'unknown',
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
    replacedByTokenHash: {
        type: String,
        default: null,
    }
}, { timestamps: true });

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index to auto-clean expired sessions

export const RefreshToken = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
