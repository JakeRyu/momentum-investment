import { Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import About from './routes/About'
import Home from './routes/Home'
import Learn from './routes/Learn'
import Lesson from './routes/Lesson'
import NotFound from './routes/NotFound'
import Privacy from './routes/Privacy'
import StrategyPage from './routes/StrategyPage'

/** Shared by the browser entry and the build-time prerender. */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/strategies/:id" element={<StrategyPage />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:slug" element={<Lesson />} />
        <Route path="/ko/learn" element={<Learn lang="ko" />} />
        <Route path="/ko/learn/:slug" element={<Lesson lang="ko" />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
