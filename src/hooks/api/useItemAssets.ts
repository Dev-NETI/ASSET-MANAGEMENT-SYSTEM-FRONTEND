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

    // Use a passthrough transformRequest so FormData is not JSON-stringified
    // (the axios instance default Content-Type: application/json would otherwise
    // cause FormData to be serialized as {} for File fields)
    const uploadDR = (id: RouteParam, formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/${id}/upload-dr`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    const uploadDocument = (id: RouteParam, formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/${id}/documents`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    const deleteDocument = (assetId: RouteParam, docId: RouteParam): Promise<AxiosResponse> =>
        axios.delete(`${route}/${assetId}/documents/${docId}`);

    const downloadTemplate = (): Promise<AxiosResponse> =>
        axios.get(`${route}/template`, { responseType: 'blob' });

    const importExcel = (formData: FormData): Promise<AxiosResponse> =>
        axios.post(`${route}/import`, formData, {
            transformRequest: [(data: FormData) => data],
        });

    return {
        ...useResource({ route }),
        assign,
        returnAsset,
        uploadDR,
        uploadDocument,
        deleteDocument,
        downloadTemplate,
        importExcel,
    };
};

export { useItemAssets };
