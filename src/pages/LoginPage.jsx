import { AlertCircle, Shield } from 'lucide-react'
import longhouseAdvertisingLogo from '../assets/longhouse-advertising-logo.svg'
import { allowedEmailDomain, bypassAuth } from '../config/env.js'

export default function LoginPage({ onSignIn, error, signingIn }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-950">
      {/* Background depth */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06)_0%,_transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[26rem]">
          {/* Logo on dark — white mark stays visible */}
          <div className="mb-10 flex flex-col items-center text-center">
            <img
              src={longhouseAdvertisingLogo}
              alt="Longhouse Advertising"
              className="h-10 w-auto max-w-[min(100%,20rem)] object-contain sm:h-11"
              width={1920}
              height={374}
              decoding="async"
            />
          </div>

          {/* Sign-in card */}
          <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/25 sm:p-9">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
                Welcome back
              </h1>
              <p className="text-sm leading-relaxed text-ink-600">
                Sign in to access internal tools and apps for your team.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50 px-3 py-2.5 sm:justify-start">
              <Shield size={16} className="shrink-0 text-brand-700" aria-hidden />
              <p className="text-xs text-ink-600">
                <span className="font-medium text-brand-800">@{allowedEmailDomain}</span>
                {' '}
                Google Workspace accounts only
              </p>
            </div>

            {error ? (
              <div
                className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-800"
                role="alert"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onSignIn}
              disabled={signingIn}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200/80 bg-white px-4 py-3.5 text-sm font-medium text-ink-800 shadow-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
            >
              <GoogleMark />
              <span>
                {signingIn
                  ? bypassAuth
                    ? 'Signing in…'
                    : 'Redirecting to Google…'
                  : bypassAuth
                    ? 'Continue to dashboard'
                    : 'Continue with Google'}
              </span>
            </button>
          </div>

          <p className="mt-8 text-center text-xs leading-relaxed text-brand-300/70">
            Internal tools for Longhouse Advertising.
            <br />
            Need access? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}
