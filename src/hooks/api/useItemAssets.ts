'use client';

import { useResource } from '../resource';
import axios from '@/lib/axios';
import { AxiosResponse } from 'axios';

type RouteParam = number | string;
type Payload = Record<string, unknown>;

const useItemAssets = () => {
    const route = '/api/item-assets';

    const assign = (id: RouteParam, payload: Payload): Promise<AxiosResponse> =>
        axios.post(`${route}/${id}/assign`, payload);

    const returnAsset = (id: RouteParam, payload: Payload): Promise<AxiosResponse> =>
        axios.post(`${route}/${id}/return`, payload);

    return {
        ...useResource({ route }),
        assign,
        returnAsset,
    };
};

export { useItemAssets };
