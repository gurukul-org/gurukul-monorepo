'use client';

import { Suspense, useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  useAcceptInvitation,
  useValidateInvitation,
} from '@/services/api/requests/invitations';

function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [rollNumber, setRollNumber] = useState('');
  const [admissionDate, setAdmissionDate] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const {
    data: validationResult,
    isLoading: isValidating,
    error: validationError,
  } = useValidateInvitation(token);

  useEffect(() => {
    if (validationResult) {
      if (validationResult.rollNumber)
        setRollNumber(validationResult.rollNumber);
      if (validationResult.admissionDate)
        setAdmissionDate(validationResult.admissionDate);
      if (validationResult.emergencyPhone)
        setEmergencyPhone(validationResult.emergencyPhone);
    }
  }, [validationResult]);

  const { mutate: acceptInvitation, isPending: isAccepting } =
    useAcceptInvitation();

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-red-700">
            Invalid Link
          </h1>
          <p className="text-red-600">
            The invitation link is missing or invalid.
          </p>
        </div>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (validationError || !validationResult) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm max-w-md w-full">
          <h1 className="mb-2 text-xl font-semibold text-red-700">
            Invitation Invalid
          </h1>
          <p className="text-red-600">
            {(validationError as any)?.response?.data?.message ||
              'This invitation is invalid, expired, or has already been accepted.'}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 w-full rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleAccept = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (validationResult.requiresPasswordSetup && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const lowerRoles = validationResult.roles.map((r) => r.toLowerCase());
    const isStudent = lowerRoles.includes('student');
    const isParent =
      lowerRoles.includes('parent') || lowerRoles.includes('parents');

    if (isStudent && (!rollNumber || !admissionDate)) {
      setError(
        'Roll number and admission date are required to complete student profile setup.',
      );
      return;
    }

    if (isParent && !emergencyPhone) {
      setError(
        'Emergency phone number is required to complete parent profile setup.',
      );
      return;
    }

    acceptInvitation(
      {
        token,
        password: validationResult.requiresPasswordSetup ? password : undefined,
        rollNumber: isStudent ? rollNumber : undefined,
        admissionDate: isStudent ? admissionDate : undefined,
        emergencyPhone: isParent ? emergencyPhone : undefined,
      },
      {
        onSuccess: () => {
          router.push('/login?message=invitation_accepted');
        },
        onError: (err: any) => {
          setError(
            err.response?.data?.message ||
              'An error occurred while accepting the invitation.',
          );
        },
      },
    );
  };

  const lowerRoles = validationResult.roles.map((r) => r.toLowerCase());
  const isStudent = lowerRoles.includes('student');
  const isParent =
    lowerRoles.includes('parent') || lowerRoles.includes('parents');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            You've been invited!
          </h1>
          <p className="text-gray-600">
            Join <strong>{validationResult.tenantName}</strong>
          </p>
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Your Roles</h3>
          <div className="flex flex-wrap gap-2">
            {validationResult.roles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleAccept} className="space-y-4">
          {validationResult.requiresPasswordSetup && (
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Create a Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters.
              </p>
            </div>
          )}

          {/* Student Profile Completion Steps */}
          {isStudent && (
            <div className="space-y-4 rounded-lg border border-zinc-200 p-4 bg-zinc-50/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Complete Student Profile
              </h3>

              <div>
                <label
                  htmlFor="rollNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Roll Number
                </label>
                <input
                  id="rollNumber"
                  type="text"
                  required
                  disabled={!!validationResult.rollNumber}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-zinc-100 disabled:text-zinc-500"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. STU-2026-001"
                />
              </div>

              <div>
                <label
                  htmlFor="admissionDate"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Admission Date
                </label>
                <input
                  id="admissionDate"
                  type="date"
                  required
                  disabled={!!validationResult.admissionDate}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-zinc-100 disabled:text-zinc-500"
                  value={admissionDate}
                  onChange={(e) => setAdmissionDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Parent Profile Completion Steps */}
          {isParent && (
            <div className="space-y-4 rounded-lg border border-zinc-200 p-4 bg-zinc-50/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Complete Parent Profile
              </h3>

              <div>
                <label
                  htmlFor="emergencyPhone"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Emergency Contact Phone
                </label>
                <input
                  id="emergencyPhone"
                  type="text"
                  required
                  disabled={!!validationResult.emergencyPhone}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-zinc-100 disabled:text-zinc-500"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="e.g. +91 99999 99999"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isAccepting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {isAccepting
              ? 'Accepting...'
              : validationResult.requiresPasswordSetup
                ? 'Set Password & Join'
                : 'Accept Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
