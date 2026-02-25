'use client';

import { useResource } from '../resource';

const useStockReceivials = () => {
    const route = '/api/stock-receivals';
    return { ...useResource({ route }) };
};

export { useStockReceivials };
