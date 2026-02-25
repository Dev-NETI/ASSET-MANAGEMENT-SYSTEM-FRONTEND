'use client';

import { useResource } from '../resource';

const useStockIssuances = () => {
    const route = '/api/stock-issuances';
    return { ...useResource({ route }) };
};

export { useStockIssuances };
