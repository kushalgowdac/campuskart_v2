import useSWR from 'swr';
import api from '../api';

const fetcher = (url) => api.get(url).then(res => res.data);

export const useFetch = (url, options = {}) => {
  return useSWR(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    ...options,
  });
};

export default useFetch;
