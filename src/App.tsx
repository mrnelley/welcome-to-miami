import { Background } from './components/Background'
import { Hero } from './components/Hero'
import { SurveyCard } from './components/SurveyCard'
import { AudioPanel } from './components/AudioPanel'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Background />
      <main className="app__main">
        <Hero />
        <SurveyCard />
      </main>
      <AudioPanel />
    </div>
  )
}
