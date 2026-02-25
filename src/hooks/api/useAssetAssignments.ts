'use client';

import { useResource } from '../resource';

const useAssetAssignments = () => {
    const route = '/api/asset-assignments';
    return { ...useResource({ route }) };
};

export { useAssetAssignments };
