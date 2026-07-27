const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getEmails: () => request('/emails'),
  
  generateDraft: (id) => request(`/emails/${id}/generate`, {
    method: 'POST',
  }),

  regenerateDraft: (id, customInstructions) => request(`/emails/${id}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ instructions: customInstructions }),
  }),

  approveEmail: (id, actionType) => request(`/emails/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ action: actionType }),
  }),

  getScores: (id) => request(`/emails/${id}/scores`),
};
