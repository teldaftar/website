import { toast } from 'vue-sonner'

/** Thin wrapper so the whole app calls one toast API with consistent options. */
export const notify = {
  success(message: string, description?: string) {
    toast.success(message, { description })
  },
  error(message: string, description?: string) {
    toast.error(message, { description })
  },
  info(message: string, description?: string) {
    toast(message, { description })
  },
}

export { toast }
