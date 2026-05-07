'use client';

import { useResource } from '../resource';
import axios from '@/lib/axios';
import { AxiosResponse } from 'axios';

type RouteParam = number | string;

const useStockReceivials = () => {
    const route = '/api/stock-receivals';

    const uploadDocument = (id: RouteParam, formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/${id}/documents`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    return { ...useResource({ route }), uploadDocument };
};

export { useStockReceivials };
