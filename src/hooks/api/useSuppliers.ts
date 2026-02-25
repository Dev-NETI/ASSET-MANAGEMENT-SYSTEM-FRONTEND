'use client';

import { useResource } from '../resource';

const useSuppliers = () => {
    const route = '/api/suppliers';
    return { ...useResource({ route }) };
};

export { useSuppliers };
