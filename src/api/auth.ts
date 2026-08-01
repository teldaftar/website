import { api } from './http'
import type {
  AuthTokens,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  SessionInfo,
} from './types'

export const authApi = {
  login(payload: LoginPayload) {
    return api.post<AuthTokens>('/auth/login', payload).then((r) => r.data)
  },
  register(payload: RegisterPayload) {
    return api.post<AuthTokens>('/auth/register', payload).then((r) => r.data)
  },
  me() {
    return api.get<SessionInfo>('/auth/me').then((r) => r.data)
  },
  logout(refreshToken: string) {
    return api.post('/auth/logout', { refreshToken }).then((r) => r.data)
  },
  changePassword(payload: ChangePasswordPayload) {
    return api.patch('/auth/password', payload).then((r) => r.data)
  },
}
