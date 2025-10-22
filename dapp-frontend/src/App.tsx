import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Importa el Header que conectará todo
import { Header } from './components/Header'; 

// Importa las páginas que acabamos de crear
import { Landing } from './pages/Landing';
import { Admin } from './pages/Admin';
import { OngPortal } from './pages/OngPortal';
import { ProyectoGaleria } from './pages/ProyectoGaleria';
import { ProyectoTimeline } from './pages/ProyectoTimeline';

function App() {
  return (
    <Router>
      {/* El Header manejará el Login/Logout y la navegación */}
      <Header />

      {/* Rutas de la aplicación */}  
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/proyectos" element={<ProyectoGaleria />} />
        <Route path="/proyecto/:id" element={<ProyectoTimeline />} />

        {/* Rutas "Protegidas" que el Header manejará */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/portal" element={<OngPortal />} />
      </Routes>
    </Router>
  );
}

export default App;