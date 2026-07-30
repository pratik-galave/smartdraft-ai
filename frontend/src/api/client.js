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
  getEmails: (filterType = 'actionable') => request(`/emails?source=gmail&filter_type=${filterType}`),
  
  generateDraft: (id) => request(`/emails/${id}/generate`, {
    method: 'POST',
  }),

  regenerateDraft: (id, customInstructions) => request(`/emails/${id}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ instruction: customInstructions }),
  }),

  approveEmail: (id, actionType, draftText) => request(`/emails/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ action: actionType, reply_body: draftText }),
  }),

  getScores: (id) => request(`/emails/${id}/scores`),
};
