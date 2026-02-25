'use client';

import { useResource } from '../resource';

const useItems = () => {
    const route = '/api/items';
    return { ...useResource({ route }) };
};

export { useItems };
