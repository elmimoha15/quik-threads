import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../lib/userService';

export function usePlanAccess() {
  const { userProfile } = useAuth();

  const canAccessAnalytics = () => {
    if (!userProfile) return false;
    return UserService.canAccessAnalytics(userProfile.plan);
  };

  const canPostToX = () => {
    if (!userProfile) return false;
    return UserService.canPostToX(userProfile.plan);
  };

  const canGenerate = () => {
    if (!userProfile) return false;
    return UserService.canGenerate(userProfile);
  };

  const getPlanFeatures = () => {
    if (!userProfile) return null;
    return UserService.getUserPlanFeatures(userProfile.plan);
  };

  const getCurrentPlan = () => {
    return userProfile?.plan || 'free';
  };

  const getGenerationsRemaining = () => {
    if (!userProfile) return 0;
    const features = UserService.getUserPlanFeatures(userProfile.plan);
    return Math.max(0, features.generationsPerMonth - userProfile.generationsUsed);
  };

  return {
    canAccessAnalytics,
    canPostToX,
    canGenerate,
    getPlanFeatures,
    getCurrentPlan,
    getGenerationsRemaining,
    userProfile
  };
}
