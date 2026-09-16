import type { ReactNode } from 'react'

type SocialProvider = 'google' | 'facebook' | 'twitter'

type SocialLoginButtonsProps = {
  onLogin: (provider: SocialProvider) => void
}

const providers: Array<{ id: SocialProvider; icon: ReactNode; label: string }> = [
  { id: 'google', icon: '🔵', label: 'Google' },
  { id: 'facebook', icon: '📘', label: 'Facebook' },
  { id: 'twitter', icon: '𝕏', label: 'X / Twitter' },
]

export default function SocialLoginButtons({ onLogin }: SocialLoginButtonsProps) {
  return (
    <>
      <div className="social-divider">Share Feedback Publicly</div>
      <div className="social-btns" aria-label="Share feedback publicly">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="social-btn"
            aria-label={`Continue with ${provider.label}`}
            onClick={() => onLogin(provider.id)}
          >
            <span aria-hidden="true">{provider.icon}</span> {provider.label}
          </button>
        ))}
      </div>
    </>
  )
}
