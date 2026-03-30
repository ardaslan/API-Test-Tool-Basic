export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}

export interface Config {
  subscribeRate: number;
  requestRate: number;
  totalUsers: number;
  targetUrl: string;
  subscribePath: string;
  endpoints: Endpoint[];
  dashboardInterval: number;
  timeout: number;
}

export const config: Config = {
  subscribeRate: 10,        // users subscribed per second
  requestRate: 5,           // requests per second per user
  totalUsers: 100,          // total users to create and subscribe
  targetUrl: 'http://localhost:3000',
  subscribePath: '/subscribe',
  endpoints: [
    { method: 'GET', path: '/users' },
    { method: 'POST', path: '/data' },
  ],
  dashboardInterval: 10000, // stats refresh interval in ms (10 seconds)
  timeout: 5000,            // request timeout in ms
};
