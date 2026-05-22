import { baseClient } from './baseClient';

export const getPropertyGroups = async () => {
    try {
        return await baseClient('/property-groups');
    } catch (error) {
        console.error('Failed to get property groups:', error);
        return [];
    }
};

export const syncPropertyGroups = async (groups: any[]) => {
    try {
        return await baseClient('/property-groups/sync', {
            method: 'PUT',
            body: JSON.stringify({ groups })
        });
    } catch (error) {
        console.error('Failed to sync property groups:', error);
        throw error;
    }
};
