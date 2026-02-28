export async function request<T>(
  method: string,
  path: string,
  payload?: any
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("opensecret.token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Get workspace/org from store if available
    try {
      const workspaceStr = localStorage.getItem("opensecret.workspace");
      if (workspaceStr) {
        const workspace = JSON.parse(workspaceStr);
        // Zustand persist stores state directly, not wrapped in "state"
        if (workspace.organizationId) {
          headers["x-workspace-id"] = workspace.organizationId;
        }
      }
    } catch {}
  }

  const res = await fetch(path, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      // Redirect to landing if unauthorized
      window.location.href = "/";
    }
    throw new Error(data.error || data.raw || `HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string }>("POST", "/v1/auth/login", {
      email,
      password,
    }),

  getOrganizations: () => request<{ items: any[] }>("GET", "/v1/organizations"),
  getProjects: (orgId: string) =>
    request<{ items: any[] }>("GET", `/v1/projects?organization_id=${orgId}`),
  getEnvironments: (projectId: string) =>
    request<{ items: any[] }>(
      "GET",
      `/v1/environments?project_id=${projectId}`
    ),
  getSecrets: (projectId: string, envId: string, path: string) =>
    request<{ items: any[] }>(
      "GET",
      `/v1/secrets?project_id=${projectId}&environment_id=${envId}&path=${encodeURIComponent(
        path
      )}`
    ),
  createSecret: (
    projectId: string,
    envId: string,
    path: string,
    key: string,
    value: string,
    tags: string[]
  ) =>
    request<{ id: string }>("POST", "/v1/secrets", {
      project_id: projectId,
      environment_id: envId,
      path,
      key,
      value,
      tags,
    }),

  getApiTokens: () => request<{ items: any[] }>("GET", "/v1/tokens/api"),
  createApiToken: (name: string, ttl_hours: number) =>
    request<{ token: string }>("POST", "/v1/tokens/api", { name, ttl_hours }),

  getServiceTokens: (projectId: string, envId: string) =>
    request<{ items: any[] }>(
      "GET",
      `/v1/tokens/service?project_id=${projectId}&environment_id=${envId}`
    ),
  createServiceToken: (
    name: string,
    projectId: string,
    envId: string,
    ttl_hours: number,
    cidr?: string
  ) =>
    request<{ token: string }>("POST", "/v1/tokens/service", {
      name,
      project_id: projectId,
      environment_id: envId,
      ttl_hours,
      cidr,
    }),

  deleteToken: (id: string) =>
    request<{ status: string }>("DELETE", `/v1/tokens/${id}`),
};
