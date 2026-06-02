import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}
