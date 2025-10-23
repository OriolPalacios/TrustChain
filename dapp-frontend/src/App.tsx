import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Landing } from './pages/Landing';
import { Admin } from './pages/Admin';
import { OngPortal } from './pages/OngPortal';
import { ProyectoGaleria } from './pages/ProyectoGaleria';
import { ProyectoTimeline } from './pages/ProyectoTimeline';

import { Container } from 'react-bootstrap'; // <-- 1. Importa Container

function App() {
  return (
    <Router>
      <Header />

      {/* 2. Envuelve las rutas en un Container */}
      <Container className="mt-4 "> 
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/proyectos" element={<ProyectoGaleria />} />
          <Route path="/proyecto/:id" element={<ProyectoTimeline />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/portal" element={<OngPortal />} />
        </Routes>
      </Container>

    </Router>
  );
}

export default App;