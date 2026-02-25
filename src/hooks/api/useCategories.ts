'use client';

import { useResource } from '../resource';

const useCategories = () => {
    const route = '/api/categories';
    return { ...useResource({ route }) };
};

export { useCategories };
