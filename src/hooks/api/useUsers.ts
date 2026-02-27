'use client';

import { useResource } from '../resource';

const useUsers = () => {
    return { ...useResource({ route: '/api/users' }) };
};

export { useUsers };
