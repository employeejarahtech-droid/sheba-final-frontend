import type { User } from "@/types/users.types";

// User details returned from the backend
// export interface User {
//   id: number;
//   name: string;
//   email: string;
//   role_id?: number;
//   role:Role
// }

// Request payload for login
export interface LoginRequest {
  email: string;
  password: string;
}

// Response returned by the login API
export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
}
export interface AuthUserResponse {
  status: boolean;
  message: string;
  data: {
    user: User
  }
}


// Auth slice state shape
export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}