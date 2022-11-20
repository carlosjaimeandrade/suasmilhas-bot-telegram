import axios from 'axios';

const http = axios.create({
    baseURL: 'https://suasmilhas.online/api',
    headers: { "Content-Type": "application/json" },
});

export default http;