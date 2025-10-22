;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; contrato: traceability.clar
;; autor: tu-usuario
;; descripcion: Contrato para la trazabilidad de gastos de ONGs
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; --- Constantes de Errores ---
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-PROJECT-NOT-FOUND (err u404))
(define-constant ERR-ONG-NOT-REGISTERED (err u405))
(define-constant ERR-ALREADY-REGISTERED (err u406))
(define-constant ERR-INVALID-PROJECT-OWNER (err u407))

;; --- Variables de Estado ---

;; El admin del contrato (seras tu al desplegar)
(define-data-var contract-owner principal tx-sender)

;; Contadores para IDs
(define-data-var project-id-counter uint u0)
(define-data-var expense-id-counter uint u0)

;; --- Mapas (Nuestra Base de Datos) ---

;; 1. Mapa de ONGs Autorizadas
;; Mapea un principal (direccion STX) a un booleano (true = autorizada)
(define-map ongs-map principal bool)

;; 2. Mapa de Proyectos
;; Mapea un ID (uint) a la info del proyecto
(define-map projects-map uint
  {
    ong-owner: principal,       ;; Quien creo este proyecto
    nombre: (string-utf8 100),  ;; Nombre del proyecto
    descripcion: (string-utf8 500) ;; Descripcion
  }
)

;; 3. Mapa de Gastos (El Log de Trazabilidad)
;; Mapea un ID (uint) a la info del gasto
(define-map expenses-map uint
  {
    project-id: uint,
    ong-owner: principal,
    monto: uint,
    concepto: (string-utf8 200),
    proveedor: (string-utf8 100),
    timestamp: uint,
    document-url: (string-ascii 128), ;; 
    document-hash: (string-ascii 64)   ;; 
  }
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; --- FUNCIONES ADMINISTRATIVAS (SOLO DUENO DEL CONTRATO) ---
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Autoriza a una nueva direccion STX como ONG
(define-public (registrar-ong (ong-principal principal))
  (begin
    ;; 1. Solo el dueno del contrato puede llamar esto
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    
    ;; 2. Asegurarse que no este ya registrada
    (asserts! (is-none (map-get? ongs-map ong-principal)) ERR-ALREADY-REGISTERED)
    
    ;; 3. Registrarla   
    (map-set ongs-map ong-principal true) 
    (ok true)
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; --- FUNCIONES DE ONGs (ESCRITURA PuBLICA) ---
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Crea un nuevo proyecto
(define-public (crear-proyecto (nombre (string-utf8 100)) (descripcion (string-utf8 500)))
  (begin
    ;; 1. Verificar que quien llama es una ONG registrada
    (asserts! (default-to false (map-get? ongs-map tx-sender)) ERR-ONG-NOT-REGISTERED)
    
    ;; 2. Obtener y aumentar el contador de proyectos
    (let ((new-project-id (+ u1 (var-get project-id-counter))))
      
      ;; 3. Crear el nuevo struct (objeto) del proyecto
      (let ((new-project
        {
          ong-owner: tx-sender,
          nombre: nombre,
          descripcion: descripcion
        }
      ))
        ;; 4. Guardar el proyecto en el mapa
        (map-set projects-map new-project-id new-project)
        ;; 5. Actualizar el contador global
        (var-set project-id-counter new-project-id)
        (ok new-project-id) ;; Devolvemos el ID del nuevo proyecto
      )
    )
  )
)

;; Registra un nuevo gasto asociado a un proyecto
(define-public (registrar-gasto (project-id uint)
                               (monto uint)
                               (concepto (string-utf8 200))
                               (proveedor (string-utf8 100))
                               (timestamp uint)
                               (document-url (string-ascii 128))
                               (document-hash (string-ascii 64)))
  (begin
    ;; 1. Obtener el proyecto de la base de datos
    (let ((project (unwrap! (map-get? projects-map project-id) ERR-PROJECT-NOT-FOUND)))
      
      ;; 2. Verificar que quien llama es el DUENO de ese proyecto
      (asserts! (is-eq tx-sender (get ong-owner project)) ERR-INVALID-PROJECT-OWNER)

      ;; 3. Obtener y aumentar el contador de gastos
      (let ((new-expense-id (+ u1 (var-get expense-id-counter))))
        
        ;; 4. Crear el struct del gasto
        (let ((new-expense
          {
            project-id: project-id,
            ong-owner: tx-sender,
            monto: monto,
            concepto: concepto,
            proveedor: proveedor,
            timestamp: timestamp,
            document-url: document-url,
            document-hash: document-hash
          }
        ))
          ;; 5. Guardar el gasto en el mapa
          (map-set expenses-map new-expense-id new-expense)
          ;; 6. Actualizar el contador global
          (var-set expense-id-counter new-expense-id)
          (ok new-expense-id) ;; Devolvemos el ID del nuevo gasto
        )
      )
    )
  )
)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; --- FUNCIONES DE LECTURA (READ-ONLY) ---
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Devuelve el dueno del contrato
(define-read-only (get-contract-owner)
  (ok (var-get contract-owner))
)

;; Devuelve si un principal es una ONG registrada
(define-read-only (is-ong-registered (ong-principal principal))
  (is-some (map-get? ongs-map ong-principal))
)

;; Devuelve los datos de un proyecto por su ID
(define-read-only (get-project-by-id (id uint))
  (map-get? projects-map id)
)

;; Devuelve los datos de un gasto por su ID
(define-read-only (get-expense-by-id (id uint))
  (map-get? expenses-map id)
)

;; Devuelve el numero total de proyectos creados (para que el frontend itere)
(define-read-only (get-project-count)
  (ok (var-get project-id-counter))
)

;; Devuelve el numero total de gastos creados (para que el frontend itere)
(define-read-only (get-expense-count)
  (ok (var-get expense-id-counter))
)
