# MintNFT - Solfachuzas Players (adaptación del ejercicio)

Este repositorio contiene una adaptación del ejercicio "MintNFT" para crear NFTs para los jugadores del equipo "Solfachuzas".

Objetivo
 - Implementar un contrato ERC-721 (basado en OpenZeppelin) para acuñar NFTs de jugadores.
 - Generar metadata en formato ERC-721 (JSON) y subirla a IPFS.
 - Automatizar el proceso de subida (IPFS) y acuñado (Hardhat) con scripts.

Estado actual
 - Contrato modificado: `contracts/MyToken.sol`
   - Nombre / símbolo: `Solfachuzas Player` / `SLF`.
   - `safeMint(address,string)` y `batchMint(address[], string[])` (solo `owner`).
   - Transferibilidad bloqueada por defecto (`transferable = false`) y función `setTransferable(bool)` para habilitarla.
 - Scripts añadidos / modificados:
   - `ipfs/images/upload.js` — sube metadatos (y opcionalmente imágenes) a la API local de IPFS. Si la API local falla, el script acepta URLs públicas en `players.json`.
   - `ipfs/players.json` — entrada de ejemplo con los 3 jugadores (Charles, Mono, Buke).
   - `ipfs/players-with-cids.json` — archivo generado (en este repositorio se incluyó un fallback con URLs públicas) para permitir hacer `batchMint` mientras se depura la API de IPFS.
   - `scripts/deploy.js` — despliega el contrato y, si existe `ipfs/players-with-cids.json`, realiza `batchMint` con las URIs encontradas.
   - `scripts/batchMint.js` — helper para enviar `batchMint` a un contrato ya desplegado.

Requisitos (local)
 - Node.js (recomendada v16 o v18). El repo funciona con Node 22 pero Hardhat mostrará una advertencia.
 - npm
 - IPFS Desktop (opcional, para subir imágenes y metadatos localmente)

Instalación y pruebas locales
1. Instalar dependencias
```powershell
npm install
```

2. (Opcional) Iniciar un nodo Hardhat persistente para pruebas locales
```powershell
npx hardhat node
```

3. Subir imágenes / metadatos a IPFS
- Guardar imágenes en `ipfs/images/` con los nombres indicados en `ipfs/players.json` (ej. `charles.jpg`).
- Asegurarse de que IPFS Desktop esté ejecutándose y que la API aparezca en `/ip4/127.0.0.1/tcp/5001`.
- Ejecutar (desde la raíz del repo):
```powershell
node ipfs/images/upload.js
```
- Resultado esperado: se crea `ipfs/players-with-cids.json` con `metadataCID` y `metadataURI` (ipfs://...).

Si la API local de IPFS da problemas (403 / Forbidden), el script puede usar las URLs públicas ya subidas a un gateway (este repositorio incluye un `players-with-cids.json` de fallback que apunta a tus imágenes públicas). Esto permite continuar con el despliegue aunque los metadatos no estén fijados como archivos JSON en IPFS.

4. Desplegar y acuñar (local)
- Para desplegar usando la red local (persistente) que arrancaste en paso 2:
```powershell
npx hardhat run scripts/deploy.js --network localhost
```
- Alternativamente el script también se ejecuta en la red efímera por defecto:
```powershell
npx hardhat run scripts/deploy.js
```

5. Si ya despletaste en una instancia y solo quieres ejecutar el batchMint en un contrato existente, usa:
```powershell
npx hardhat run scripts/batchMint.js <CONTRACT_ADDRESS> --network localhost
```

Notas importantes / debugging IPFS
- Si `Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5001/api/v0/version` te devuelve `403 Forbidden`, prueba a reiniciar IPFS Desktop (Stop → Start). El endpoint de la API local acepta POST y devuelve JSON con la versión.
- Si el daemon local no responde, como alternativa puedes usar un servicio de pinning (Pinata, web3.storage). Puedo añadir soporte para web3.storage si quieres automatizar con una API key.

# Mint NFT 
