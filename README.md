# 🚀 TrustChain: Transparencia Radical para ONGs  

![Logo de TrustChain](./dapp-frontend/public/logo-full.png)

**Trazabilidad de gastos para organizaciones benéficas, construyendo confianza pública con el poder de la blockchain de Stacks.**

---

## 🌍 El Problema: La Caja Negra de las Donaciones  

Millones de personas donan a ONGs con esperanza, pero una vez que el dinero se entrega, desaparece en una **“caja negra”**.  
La falta de transparencia genera **desconfianza**, **menores donaciones** y **mala reputación**.  

Los donantes se preguntan:  
> 💭 *“¿En qué se gastó realmente mi dinero?”*  
> 💭 *“¿Puedo verificar que esos reportes son reales?”*  

---

## 🔗 La Solución: Trazabilidad Inmutable en Blockchain  

**TrustChain** es una **dApp Web3** que registra cada gasto de una ONG como una **bitácora pública, inmutable y verificable**, usando la **blockchain de Stacks**.  

Cada gasto se valida en tres pasos:

1. 🧾 **Hash del documento:** Se genera un hash SHA-256 del recibo o factura.  
2. ☁️ **Almacenamiento off-chain:** El archivo se guarda en **Supabase Storage**.  
3. ⛓️ **Compromiso on-chain:** El contrato de **Clarity** registra el gasto, la URL y el hash inmutable en la blockchain.  

Cualquier persona puede verificar criptográficamente que una factura **no ha sido alterada desde su registro**.  

---

## ✨ Funcionalidades Principales  

👥 **Roles de usuario:**

| Rol | Acciones |
|------|-----------|
| 🧑‍🤝‍🧑 **Público General** | Explora proyectos, visualiza líneas de tiempo de gastos y verifica facturas. |
| 🏢 **ONG Verificada** | Conecta su Hero Wallet, crea proyectos y registra gastos con documentos. |
| 🛡️ **Administrador** | Autoriza nuevas direcciones STX como ONGs válidas. |

---

## 🧱 Arquitectura y Stack Tecnológico  

**Arquitectura:**  
Frontend (React + Supabase) ↔️ Smart Contract (Clarity / Stacks)

### ⚙️ Frontend (`dapp-frontend`)  
- **Framework:** React + Vite + TypeScript  
- **UI:** React-Bootstrap  
- **Autenticación Web3:** `@stacks/connect` (Hero Wallet)  
- **Timeline visual:** `react-vertical-timeline-component`  
- **Enrutamiento:** `react-router-dom`  
- **Almacenamiento:** `@supabase/supabase-js`  

### ⛓️ Backend (`dapp-backend`)  
- **Blockchain:** Stacks Testnet  
- **Lenguaje:** Clarity  
- **Framework:** Clarinet  
- **Contrato principal:** `traceability.clar`  
  - `ongs-map` → ONGs autorizadas  
  - `projects-map` → Proyectos activos  
  - `expenses-map` → Gastos con `document-url` + `document-hash`  

---

## 🧩 Cómo Ejecutar el Proyecto  

### ✅ Requisitos Previos  
- Node.js (v18+)  
- NPM o Yarn  
- [Clarinet](https://docs.stacks.co/clarity/tools/clarinet-basics)  
- Cuenta de [Supabase](https://supabase.com)  
- [Hero Wallet](https://wallet.hiro.so) instalada  

---

### 🚀 1. Backend – Smart Contract  

```bash
cd dapp-backend
clarinet console           # probar localmente
clarinet deploy --net testnet
```

Guarda la dirección del contrato desplegado (`ST1...traceability`).

---

### 💻 2. Frontend – dApp

```
cd dapp-frontend
npm install
```

#### ⚙️ Configuración

Edita los siguientes archivos:

* `src/config.ts` → actualiza `CONTRACT_ADDRESS` y `ADMIN_WALLET`
* `src/services/supabaseClient.ts` → añade tus credenciales de Supabase

#### ▶️ Ejecuta

```bash
npm run dev
```

La app estará disponible en **[http://localhost:5173](http://localhost:5173)**

---

## 🧠 Equipo y Propósito

TrustChain fue creado durante **Stacks Latam Hackathon** para demostrar cómo la **blockchain puede devolver confianza y transparencia al ecosistema de donaciones**.
Objetivo: que cada donación pueda ser **verificada, auditada y confiable**.

---

## 🛠️ Futuras Mejoras

* Integración con IPFS o Gaia Storage, para lograr un almacenamiento completamente descentralizado.
* Panel de análisis de impacto (gráficas y métricas).
* Certificados NFT para donantes.

---

## 🧾 Licencia

MIT License © 2025 — TrustChain Team


---


