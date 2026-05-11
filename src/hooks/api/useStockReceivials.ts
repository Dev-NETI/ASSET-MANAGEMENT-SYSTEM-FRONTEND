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

    const downloadTemplate = (): Promise<AxiosResponse> =>
        axios.get(`${route}/template`, { responseType: 'blob' });

    const importExcel = (formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/import`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    return { ...useResource({ route }), uploadDocument, downloadTemplate, importExcel };
};

export { useStockReceivials };
