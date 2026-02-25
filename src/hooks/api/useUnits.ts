'use client';

import { useResource } from '../resource';

const useUnits = () => {
    const route = '/api/units';
    return { ...useResource({ route }) };
};

export { useUnits };
