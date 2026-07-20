


import { Notification } from '../models/notification.js';



export const createNotification = async (data) => {
    const notification = await Notification.create(data);
    return await notification.save();
};




export const notifyUser = async (userId, message, type, link, priority) => {
    const notification = await createNotification({
        user: userId,
        message,
        type,
        link,
        priority,
    });
};


