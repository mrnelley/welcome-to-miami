import { Background } from './components/Background'
import { Hero } from './components/Hero'
import { SurveyCard } from './components/SurveyCard'
import { AudioToggle } from './components/AudioToggle'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <Background />
      <main className="app__main">
        <Hero />
        <SurveyCard />
      </main>
      <AudioToggle />
    </div>
  )
}
