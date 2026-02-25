'use client';

import { useResource } from '../resource';
import axios from '@/lib/axios';
import { AxiosResponse } from 'axios';

type Payload = Record<string, unknown>;

const useInventoryStocks = () => {
    const route = '/api/inventory-stocks';

    const adjust = (payload: Payload): Promise<AxiosResponse> =>
        axios.post(`${route}/adjust`, payload);

    return {
        ...useResource({ route }),
        adjust,
    };
};

export { useInventoryStocks };
