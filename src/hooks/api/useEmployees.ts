'use client';

import { useResource } from '../resource';

const useEmployees = () => {
    const route = '/api/employees';
    return { ...useResource({ route }) };
};

export { useEmployees };
