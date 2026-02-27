import axios from '@/lib/axios';

interface UpdateAccountPayload {
    name: string;
    email: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
}

export const useAccount = () => {
    const update = async (payload: UpdateAccountPayload) => {
        const res = await axios.put('/api/account', payload);
        return res.data;
    };

    return { update };
};
