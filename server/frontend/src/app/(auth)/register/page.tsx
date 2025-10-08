'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  sponsor_code: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sponsorValidation, setSponsorValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    sponsor: any;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    sponsor: null,
    message: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const sponsorCode = watch('sponsor_code');

  // Set referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setValue('sponsor_code', refCode);
    }
  }, [searchParams, setValue]);

  // Validate sponsor code
  useEffect(() => {
    if (!sponsorCode || sponsorCode.length < 3) {
      setSponsorValidation({
        isValidating: false,
        isValid: null,
        sponsor: null,
        message: '',
      });
      return;
    }

    const validateSponsor = async () => {
      setSponsorValidation(prev => ({ ...prev, isValidating: true }));
      
      try {
        const response = await authAPI.validateReferralCode(sponsorCode);
        setSponsorValidation({
          isValidating: false,
          isValid: response.data.valid,
          sponsor: response.data.sponsor,
          message: response.data.message,
        });
      } catch (error) {
        setSponsorValidation({
          isValidating: false,
          isValid: false,
          sponsor: null,
          message: 'Invalid referral code',
        });
      }
    };

    const debounceTimer = setTimeout(validateSponsor, 500);
    return () => clearTimeout(debounceTimer);
  }, [sponsorCode]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authAPI.register({
        email: data.email,
        password: data.password,
        sponsor_code: data.sponsor_code,
      });

      // Store auth token (in production, this would come from the response)
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      
      // Set user in store
      setUser(response.data.user);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setError('root', { message: errorMessage });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Tracverse</h1>
          <p className="text-gray-600">Start your MLM journey today</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Sponsor Code Field */}
            <div>
              <label htmlFor="sponsor_code" className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code (Optional)
              </label>
              <div className="relative">
                <input
                  {...register('sponsor_code')}
                  type="text"
                  id="sponsor_code"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Enter referral code"
                />
                {sponsorValidation.isValidating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                  </div>
                )}
                {!sponsorValidation.isValidating && sponsorValidation.isValid === true && (
                  <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
                {!sponsorValidation.isValidating && sponsorValidation.isValid === false && sponsorCode && (
                  <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {sponsorValidation.sponsor && (
                <p className="mt-1 text-sm text-green-600">
                  Sponsor: {sponsorValidation.sponsor.email}
                </p>
              )}
              {sponsorValidation.isValid === false && sponsorCode && (
                <p className="mt-1 text-sm text-red-600">{sponsorValidation.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Form Error */}
            {errors.root && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
