import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FachList from './components/FachList.jsx'
import KartenList from './components/KartenList.jsx'
import KartenView from './components/KartenView.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-white">
        <Routes>
          <Route path="/" element={<FachList />} />
          <Route path="/fach/:fachId" element={<KartenList />} />
          <Route path="/fach/:fachId/karte/:karteId" element={<KartenView />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
