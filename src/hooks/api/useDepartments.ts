'use client';

import { useResource } from '../resource';

const useDepartments = () => {
    const route = '/api/departments';
    return { ...useResource({ route }) };
};

export { useDepartments };
