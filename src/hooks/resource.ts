import axios from '@/lib/axios';
import { AxiosResponse } from 'axios';

type RouteParam = number | string;
type Payload = Record<string, unknown>;

interface ResourceOptions {
    route: string;
}

const useResource = ({ route }: ResourceOptions) => {
    const index = (): Promise<AxiosResponse> =>
        axios.get(`${route}`);

    const show = (id: RouteParam): Promise<AxiosResponse> =>
        axios.get(`${route}/${id}`);

    const showWith2Parameter = (param1: RouteParam, param2: RouteParam): Promise<AxiosResponse> =>
        axios.get(`${route}/${param1}/${param2}`);

    const showWith3Parameter = (param1: RouteParam, param2: RouteParam, param3: RouteParam): Promise<AxiosResponse> =>
        axios.get(`${route}/${param1}/${param2}/${param3}`);

    const store = (payload: Payload): Promise<AxiosResponse> =>
        axios.post(`${route}`, payload);

    const update = (id: RouteParam, payload: Payload): Promise<AxiosResponse> =>
        axios.put(`${route}/${id}`, payload);

    const patch = (id: RouteParam, payload: Payload): Promise<AxiosResponse> =>
        axios.patch(`${route}/${id}`, payload);

    const patchNoPayload = (id: RouteParam): Promise<AxiosResponse> =>
        axios.patch(`${route}/${id}`);

    const destroy = (id: RouteParam): Promise<AxiosResponse> =>
        axios.delete(`${route}/${id}`);

    const destroy2Parameter = (id: RouteParam, id2: RouteParam): Promise<AxiosResponse> =>
        axios.delete(`${route}/${id}/${id2}`);

    return {
        index,
        show,
        showWith2Parameter,
        showWith3Parameter,
        store,
        update,
        patch,
        patchNoPayload,
        destroy,
        destroy2Parameter,
    };
};

export { useResource };
