import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally before importing the client
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocking
const { apiClient } = await import('./api-client.js');

describe('APIClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('successful requests', () => {
    it('returns data on 200 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: [1, 2, 3] }),
      });

      const result = await apiClient.get('/api/test');
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('sends credentials: include for cookie auth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient.get('/api/test');
      expect(mockFetch.mock.calls[0][1].credentials).toBe('include');
    });

    it('stringifies body for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient.post('/api/test', { name: 'test' });
      const body = mockFetch.mock.calls[0][1].body;
      expect(body).toBe('{"name":"test"}');
    });
  });

  describe('4xx errors - no retry', () => {
    it('throws immediately on 401 without retrying', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Not authenticated' }),
      });

      await expect(apiClient.get('/api/test', { retries: 3, retryDelay: 10 }))
        .rejects.toThrow('Not authenticated');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on 404 without retrying', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(apiClient.get('/api/missing', { retries: 3, retryDelay: 10 }))
        .rejects.toThrow('Not found');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('5xx errors - retry with backoff', () => {
    it('retries on 500 and succeeds on second attempt', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const result = await apiClient.get('/api/test', { retries: 3, retryDelay: 10 });
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all retries on 500', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiClient.get('/api/test', { retries: 2, retryDelay: 10 }))
        .rejects.toThrow();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('network errors - retry', () => {
    it('retries on TypeError (network failure) and succeeds', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      const result = await apiClient.get('/api/test', { retries: 3, retryDelay: 10 });
      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('AbortError - never retry', () => {
    it('throws immediately on AbortError', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(apiClient.get('/api/test', { retries: 3, retryDelay: 10 }))
        .rejects.toThrow('The operation was aborted');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
