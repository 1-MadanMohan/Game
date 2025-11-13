import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000"
});

export const commitRound = () => API.post("/api/rounds/commit");
export const startRound = (id, body) => API.post(`/api/rounds/${id}/start`, body);
export const revealRound = (id) => API.post(`/api/rounds/${id}/reveal`);
export const getRound = (id) => API.get(`/api/rounds/${id}`);
export const verifyRound = (params) => API.get(`/api/rounds/verify`, { params });
export const getRounds = (limit = 20) => API.get(`/api/rounds?limit=${limit}`);
