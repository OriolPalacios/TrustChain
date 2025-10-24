import { useState, useEffect } from 'react';
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Card,
} from 'react-bootstrap';
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  STACKS_NETWORK,
} from '../config';
import { userSession } from '../services/userSessionService';
import { supabase } from '../services/supabaseClient';
import { showContractCall } from '@stacks/connect';
import {
  fetchCallReadOnlyFunction, // Usaremos esto para traer los proyectos
  cvToJSON,
  stringUtf8CV,
  uintCV,
  stringAsciiCV, // Para la URL de Gaia
} from '@stacks/transactions';

// Definimos un tipo para nuestros proyectos
interface Project {
  id: number;
  nombre: string;
  descripcion: string;
  'ong-owner': string;
}

// Helper para hashear el archivo
async function getFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const OngPortal = () => {
  // --- Estados para el Formulario de PROYECTO ---
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectStatus, setProjectStatus] = useState({
    loading: false,
    success: '',
    error: '',
  });

  // --- Estados para el Formulario de GASTO ---
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseProvider, setExpenseProvider] = useState('');
  const [expenseFile, setExpenseFile] = useState<File | null>(null);
  const [expenseStatus, setExpenseStatus] = useState({
    loading: false,
    success: '',
    error: '',
  });

  // --- Estado para la lista de proyectos de la ONG (para el dropdown) ---
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const ongPrincipal = userSession.loadUserData().profile.stxAddress.testnet;

  // --- useEffect para cargar los proyectos de la ONG al inicio ---
  useEffect(() => {
    const fetchMyProjects = async () => {
      setLoadingProjects(true);
      try {
        // 1. Obtener el contador total de proyectos
        const projectCountResult = await fetchCallReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-project-count',
          functionArgs: [],
          network: STACKS_NETWORK, 
          senderAddress: ongPrincipal,
        });

        const projectCount = Number(cvToJSON(projectCountResult).value.value); // ej: 5
        if (projectCount === 0) {
           setLoadingProjects(false);
           return;
        }

        // 2. Crear un array de promesas para traer cada proyecto
        const projectPromises = [];
        for (let i = 1; i <= projectCount; i++) {
          projectPromises.push(
            fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-project-by-id',
              functionArgs: [uintCV(i)],
              network: STACKS_NETWORK,
              senderAddress: ongPrincipal,
            })
          );
        }

        // 3. Ejecutar todas las promesas
        const results = await Promise.all(projectPromises);
        
        const allProjects = results.map((res, index) => {
          // El resultado es (some {datos...}) o (none)
          let projectData = cvToJSON(res).value.value;
          projectData = Object.fromEntries(
            Object.entries(projectData).map(([key, value])=> {
              return [key, (value as any).value]
            })
          )
          if (projectData) {
            return {
              id: index + 1,
              ...projectData,
            };
          }
          return null;
        }).filter(p => p !== null) as Project[]; // Quitar nulos

        // 4. Filtrar solo los proyectos de esta ONG
        const userProjects = allProjects.filter(
          (p) => p['ong-owner'] == ongPrincipal
        );
        
        setMyProjects(userProjects);
        
        // Si tenemos proyectos, seleccionamos el primero por defecto
        if (userProjects.length > 0) {
          setSelectedProjectId(userProjects[0].id);
        }

      } catch (e: any) {
        console.error('Error al cargar proyectos:', e.message);
        setExpenseStatus({ loading: false, success: '', error: 'Error al cargar proyectos.'});
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchMyProjects();
  }, [ongPrincipal]); // Se ejecuta cuando el componente carga

  // --- Manejador para CREAR PROYECTO ---
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectStatus({ loading: true, success: '', error: '' });

    try {
      await showContractCall({
        network: STACKS_NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'crear-proyecto',
        functionArgs: [
          stringUtf8CV(projectName), // (nombre (string-utf8 100))
          stringUtf8CV(projectDesc), // (descripcion (string-utf8 500))
        ],
        appDetails: {
          name: 'dApp Trazabilidad',
          icon: window.location.origin + '/logo.svg',
        },
        onFinish: (data) => {
          console.log('Proyecto Creado! TXID:', data.txId);
          setProjectStatus({
            loading: false,
            success: `¡Proyecto Creado! Recarga la página en 1 min para verlo. TXID: ${data.txId}`,
            error: '',
          });
          setProjectName('');
          setProjectDesc('');
          // Aquí podríamos recargar la lista de proyectos
        },
        onCancel: () => {
          setProjectStatus({ loading: false, success: '', error: 'Creación cancelada.' });
        },
      });
    } catch (e: any) {
      setProjectStatus({ loading: false, success: '', error: e.message });
    }
  };

  // --- Manejador para REGISTRAR GASTO ---
  const handleRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFile || !selectedProjectId) {
      setExpenseStatus({ loading: false, success: '', error: 'Completa todos los campos y adjunta la factura.' });
      return;
    }
    setExpenseStatus({ loading: true, success: '', error: '' });

    try {
      // --- PASO 1: hashear el archivo ---
      setExpenseStatus({ loading: true, success: 'Calculando hash del archivo...', error: '' });
      const fileHash = await getFileHash(expenseFile);
      console.log('File Hash:', fileHash);

      // --- PASO 2: Llamar al Contrato ---
      setExpenseStatus({ loading: true, success: 'Subiendo factura a Supabase...', error: '' });
      const fileName = `${Date.now()}_${expenseFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('facturas') // El nombre de tu bucket
        .upload(fileName, expenseFile);
      console.log(uploadData);
      if (uploadError) {
        throw uploadError;
      }
    // --- PASO 3: Obtener la URL pública ---
      const { data: urlData } = supabase.storage
        .from('facturas')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      setExpenseStatus({ loading: true, success: 'Archivo subido. Registrando en blockchain...', error: '' });

      const amountAsUint = parseInt(expenseAmount, 10);
      if (isNaN(amountAsUint)) {
         throw new Error('El monto debe ser un número.');
      }
      
      await showContractCall({
        network: STACKS_NETWORK,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'registrar-gasto',
        functionArgs: [
          uintCV(selectedProjectId),   // (project-id uint)
          uintCV(amountAsUint),        // (monto uint)
          stringUtf8CV(expenseConcept),// (concepto (string-utf8 200))
          stringUtf8CV(expenseProvider),// (proveedor (string-utf8 100))
          uintCV(Date.now()),          // (timestamp uint)
          stringAsciiCV(publicUrl),
          stringAsciiCV(fileHash)     
        ],
        appDetails: {
          name: 'dApp Trazabilidad',
          icon: window.location.origin + '/logo.svg',
        },
        onFinish: (data) => {
          console.log('Gasto Registrado! TXID:', data.txId);
          setExpenseStatus({
            loading: false,
            success: `¡Gasto Registrado! TXID: ${data.txId}`,
            error: '',
          });
          // Limpiar formulario
          setExpenseAmount('');
          setExpenseConcept('');
          setExpenseProvider('');
          setExpenseFile(null);
        },
        onCancel: () => {
          setExpenseStatus({ loading: false, success: '', error: 'Registro de gasto cancelado.' });
        },
      });
      
    } catch (e: any) {
      setExpenseStatus({ loading: false, success: '', error: e.message });
    }
  };

  return (
    <Container className="mt-5">
      <Row>
        {/* Columna 1: Crear Proyecto */}
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Crear Nuevo Proyecto</Card.Title>
              <Form onSubmit={handleCreateProject}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Proyecto</Form.Label>
                  <Form.Control
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Ej: Comedor Popular en Cusco"
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Breve descripción del proyecto"
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={projectStatus.loading}>
                  {projectStatus.loading ? <Spinner size="sm" /> : 'Crear Proyecto'}
                </Button>
                {projectStatus.success && <Alert variant="success" className="mt-3">{projectStatus.success}</Alert>}
                {projectStatus.error && <Alert variant="danger" className="mt-3">{projectStatus.error}</Alert>}
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Columna 2: Registrar Gasto */}
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>Registrar Nuevo Gasto</Card.Title>
              <Form onSubmit={handleRegisterExpense}>
                <Form.Group className="mb-3">
                  <Form.Label>Proyecto Asociado</Form.Label>
                  {loadingProjects ? (
                     <Spinner size="sm" />
                  ) : (
                    <Form.Select
                      aria-label="Seleccionar proyecto"
                      value={selectedProjectId || ''}
                      onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                      disabled={myProjects.length === 0}
                    >
                      {myProjects.length === 0 ? (
                        <option>Primero debes crear un proyecto</option>
                      ) : (
                        myProjects.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))
                      )}
                    </Form.Select>
                  )}
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Monto (ej: 500)</Form.Label>
                  <Form.Control
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="Monto gastado (solo números)"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Concepto</Form.Label>
                  <Form.Control
                    type="text"
                    value={expenseConcept}
                    onChange={(e) => setExpenseConcept(e.target.value)}
                    placeholder="Ej: Compra de arroz y pollo"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Proveedor</Form.Label>
                  <Form.Control
                    type="text"
                    value={expenseProvider}
                    onChange={(e) => setExpenseProvider(e.target.value)}
                    placeholder="Ej: Supermercado S.A.C."
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Factura/Recibo (PDF/JPG)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setExpenseFile((e.target as HTMLInputElement).files?.[0] || null)}
                    required
                  />
                </Form.Group>

                <Button variant="success" type="submit" disabled={expenseStatus.loading || myProjects.length === 0}>
                  {expenseStatus.loading ? <Spinner size="sm" /> : 'Registrar Gasto'}
                </Button>
                
                {/* Mensajes de estado para el formulario de gasto */}
                {expenseStatus.success && <Alert variant="success" className="mt-3">{expenseStatus.success}</Alert>}
                {expenseStatus.error && <Alert variant="danger" className="mt-3">{expenseStatus.error}</Alert>}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};