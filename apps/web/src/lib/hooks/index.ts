/**
 * Hooks Index
 * ===========
 * 
 * Central export point for all React Query hooks.
 */

// Waste hooks
export {
  useWasteEntries,
  useWasteEntry,
  useWasteStats,
  useRecentWaste,
  useUploadWaste,
  useDeleteWaste,
  wasteKeys,
} from './useWaste';

// Auth hooks
export {
  useLogin,
  useRegister,
  useLogout,
  useForgotPassword,
  useResetPassword,
  useCurrentUser,
} from './useAuth';
