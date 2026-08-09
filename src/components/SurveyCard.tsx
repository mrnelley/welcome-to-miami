import { useState } from 'react'
import { openSurveyMonkeyPopup } from '../lib/openSurveyMonkeyPopup'

export function SurveyCard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenSurvey() {
    setLoading(true)
    setError(null)
    try {
      await openSurveyMonkeyPopup()
    } catch {
      setError('Could not open the survey. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="survey-card" aria-labelledby="survey-heading">
      <div className="survey-card__glow" aria-hidden="true" />
      <div className="survey-card__frame">
        <div className="survey-card__corner survey-card__corner--tl" aria-hidden="true" />
        <div className="survey-card__corner survey-card__corner--tr" aria-hidden="true" />
        <div className="survey-card__corner survey-card__corner--bl" aria-hidden="true" />
        <div className="survey-card__corner survey-card__corner--br" aria-hidden="true" />

        <h2 id="survey-heading" className="survey-card__title">
          Pick a date. Pick a spot.
        </h2>
        <p className="survey-card__copy">
          Help us plan the HDC employee dinner — where and when works for you?
        </p>

        <button
          type="button"
          className="survey-card__button"
          onClick={handleOpenSurvey}
          disabled={loading}
        >
          <span className="survey-card__button-shine" aria-hidden="true" />
          {loading ? 'Opening…' : 'Launch Survey'}
        </button>

        {error && (
          <p className="survey-card__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
