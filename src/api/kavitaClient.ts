import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDto } from '../types/kavita';

const TOKEN_KEY = 'kavita_token';
const REFRESH_TOKEN_KEY = 'kavita_refresh_token';
const API_KEY = 'kavita_api_key';

export class KavitaClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private token: string | null = null;
  private refreshToken: string | null = null;
  private apiKey: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadStoredCredentials();
  }

  private async loadStoredCredentials(): Promise<void> {
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
    this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    this.apiKey = await AsyncStorage.getItem(API_KEY);
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      async (config) => {
        if (!this.token) {
          this.token = await AsyncStorage.getItem(TOKEN_KEY);
        }
        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            await this.clearTokens();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string): Promise<UserDto> {
    try {
      const response = await this.client.post<UserDto>('/api/Account/login', {
        username,
        password,
      });

      const user = response.data;
      this.token = user.token;
      this.refreshToken = user.refreshToken;
      this.apiKey = user.apiKey;

      await AsyncStorage.setItem(TOKEN_KEY, user.token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, user.refreshToken);
      await AsyncStorage.setItem(API_KEY, user.apiKey);

      return user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      if (!this.refreshToken) {
        this.refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      }

      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post('/api/Account/refresh-token', {
        token: this.token,
        refreshToken: this.refreshToken,
      });

      const newToken = response.data.token;
      this.token = newToken;
      await AsyncStorage.setItem(TOKEN_KEY, newToken);

      return newToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.clearTokens();
  }

  private async clearTokens(): Promise<void> {
    this.token = null;
    this.refreshToken = null;
    this.apiKey = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    await AsyncStorage.removeItem(API_KEY);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api/Health');
      return true;
    } catch (error) {
      return false;
    }
  }

  async getLibraries(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/Library/libraries');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSeries(libraryId: number, pageNumber: number = 0, pageSize: number = 50): Promise<any[]> {
    try {
      const response = await this.client.post('/api/Series/all-v2', {
        libraryId,
        pageNumber,
        pageSize,
      });
      
      let seriesList: any[] = [];
      if (response.data.result) {
        seriesList = response.data.result;
      } else if (Array.isArray(response.data)) {
        seriesList = response.data;
      } else {
        console.warn('Unexpected response structure:', response.data);
        return [];
      }

      // Fetch volume info for each series to get chapter counts
      const enrichedSeries = await Promise.all(
        seriesList.map(async (series) => {
          try {
            const volumes = await this.getVolumes(series.id);
            
            // Calculate total chapter count across all volumes
            const totalChapters = volumes.reduce((sum, vol) => {
              return sum + (vol.chapters?.length || 0);
            }, 0);
            
            return {
              ...series,
              volumeCount: volumes.length,
              chapterCount: totalChapters,
            };
          } catch (error) {
            console.warn(`Failed to get volumes for series ${series.id}:`, error);
            return series;
          }
        })
      );

      return enrichedSeries;
    } catch (error) {
      console.error('all-v2 failed, trying alternative endpoint');
      
      try {
        const response = await this.client.get('/api/Series/series', {
          params: {
            libraryId,
            pageNumber,
            pageSize
          }
        });
        return response.data || [];
      } catch (error2) {
        throw this.handleError(error);
      }
    }
  }

  async getSeriesById(seriesId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/Series/${seriesId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getVolumes(seriesId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/Series/volumes`, {
        params: { seriesId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChapters(volumeId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/Series/chapter`, {
        params: { volumeId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getChapterInfo(chapterId: number): Promise<any> {
    try {
      const response = await this.client.get(`/api/Reader/chapter-info`, {
        params: { chapterId }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cache chapter images before reading
  async cacheChapter(chapterId: number): Promise<void> {
    try {
      // For PDFs, we need to call the book-info endpoint which triggers extraction
      await this.client.get(`/api/Book/${chapterId}/book-info`);
      console.log('Book info cached - PDF extracted');
      
      // Small delay to allow extraction to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log('Book-info cache failed, trying image dimensions endpoint');
      try {
        // Try getting image dimensions which should trigger cache
        await this.client.get(`/api/Reader/image-dimensions`, {
          params: { 
            chapterId,
            apiKey: this.apiKey
          }
        });
        console.log('Image dimensions cached');
      } catch (e) {
        console.log('All cache attempts failed');
      }
    }
  }

  async markProgress(seriesId: number, volumeId: number, chapterId: number, pageNum: number): Promise<void> {
    try {
      await this.client.post('/api/Reader/progress', {
        seriesId,
        volumeId,
        chapterId,
        pageNum,
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // FIXED: Image URLs with proper authentication
  getCoverImageUrl(seriesId: number): string {
    const params = new URLSearchParams({
      seriesId: seriesId.toString(),
    });
    
    // Use API key for image authentication (more reliable than JWT for images)
    if (this.apiKey) {
      params.append('apiKey', this.apiKey);
    }

    return `${this.baseUrl}/api/Image/series-cover?${params.toString()}`;
  }

  getVolumeCoverUrl(volumeId: number): string {
    const params = new URLSearchParams({
      volumeId: volumeId.toString(),
    });
    
    if (this.apiKey) {
      params.append('apiKey', this.apiKey);
    }

    return `${this.baseUrl}/api/Image/volume-cover?${params.toString()}`;
  }

  getChapterCoverUrl(chapterId: number): string {
    const params = new URLSearchParams({
      chapterId: chapterId.toString(),
    });
    
    if (this.apiKey) {
      params.append('apiKey', this.apiKey);
    }

    return `${this.baseUrl}/api/Image/chapter-cover?${params.toString()}`;
  }
// For PDFs - get the PDF URL
getPdfUrl(chapterId: number): string {
  const params = new URLSearchParams({
    chapterId: chapterId.toString(),
  });
  
  if (this.apiKey) {
    params.append('apiKey', this.apiKey);
  }

  return `${this.baseUrl}/api/reader/pdf?${params.toString()}`;
}
  // For reader - get page image
  getPageImageUrl(chapterId: number, page: number): string {
    const params = new URLSearchParams({
      chapterId: chapterId.toString(),
      page: page.toString(),
    });
    
    // Try with API key first, but might need JWT token instead
    if (this.apiKey) {
      params.append('apiKey', this.apiKey);
    }

    return `${this.baseUrl}/api/Reader/image?${params.toString()}`;
  }

  // Alternative: Get image with auth headers instead of query param
  async getPageImage(chapterId: number, page: number): Promise<string> {
    try {
      const response = await this.client.get('/api/Reader/image', {
        params: { chapterId, page },
        responseType: 'blob'
      });
      
      // Convert blob to base64 for React Native Image
      const blob = response.data;
      return URL.createObjectURL(blob);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Alternative method using chapter-info for caching
  async cacheImages(chapterId: number): Promise<void> {
    try {
      await this.cacheChapter(chapterId);
    } catch (error) {
      console.log('Failed to cache images:', error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        
        switch (status) {
          case 400:
            return new Error(`Bad Request: ${message}`);
          case 401:
            return new Error('Unauthorized. Please log in again.');
          case 403:
            return new Error('Forbidden. You do not have permission.');
          case 404:
            return new Error('Resource not found.');
          case 500:
            return new Error('Server error. Please try again later.');
          default:
            return new Error(`Error ${status}: ${message}`);
        }
      } else if (axiosError.request) {
        return new Error('No response from server. Check your connection.');
      }
    }
    return new Error('An unexpected error occurred.');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getToken(): string | null {
    return this.token;
  }

  getApiKey(): string | null {
    return this.apiKey;
  }
}