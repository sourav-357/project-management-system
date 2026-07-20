


import { SupervisorRequest } from '../models/supervisorRequest.js';



export const createRequest = async (data) => {
    const existingRequest = await SupervisorRequest.findOne({ 
        student: data.student, 
        supervisor: data.supervisor,
        status: 'pending',
    });

    if (existingRequest) {
        throw new Error('You already sent a request to this supervisor. Please wait for response');
        return;
    }

    const request = await SupervisorRequest.create(data);
    return await request.save();
};


