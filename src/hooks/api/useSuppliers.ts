'use client';

import { useResource } from '../resource';
import axios from '@/lib/axios';
import { AxiosResponse } from 'axios';

const useSuppliers = () => {
    const route = '/api/suppliers';

    const downloadTemplate = (): Promise<AxiosResponse> =>
        axios.get(`${route}/template`, { responseType: 'blob' });

    const importExcel = (formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/import`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    return { ...useResource({ route }), downloadTemplate, importExcel };
};

export { useSuppliers };
