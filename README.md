# Solfachuzas NFTs

Estado: en progreso (probado en red local de Hardhat; no desplegado)

NFTs (ERC-721) para los jugadores del equipo de baloncesto **Solfachuzas**: un NFT por jugador, con su dorsal, posición y estadísticas como atributos. Forma parte del ecosistema de [SolfaCoin](https://github.com/charles030992/SolfaCoin) (el token del equipo) y está adaptado del ejercicio *MintNFT* de Alchemy University.

## El contrato (`contracts/MyToken.sol`)

Basado en OpenZeppelin 4 (`ERC721`, `ERC721URIStorage`, `Ownable`). Nombre `Solfachuzas Player`, símbolo `SLF`.

- `safeMint(to, uri)` y `batchMint(recipients, uris)` — solo el *owner* (el que despliega).
- **No transferible por defecto** (`transferable = false`): un jugador no puede vender ni pasar su NFT. El *owner* puede activarlo con `setTransferable(true)`.
- Mientras está bloqueado, el *owner* sí puede repartir los NFT que él mismo tiene (por ejemplo, acuñar a su cuenta y luego pasarlos a cada jugador). No puede mover el NFT de un jugador sin su aprobación.

## Puesta en marcha

Requisitos: Node.js (recomendado 18; con versiones más nuevas Hardhat 2 avisa de que no las soporta oficialmente, pero funciona) y npm.

```bash
npm install
npm test             # 12 tests del contrato, sin necesidad de .env
npm run compile
```

## Del equipo a los NFT

1. **Datos de los jugadores** — edita `ipfs/images/players.json` (nombre, dorsal, posición, estadísticas, URL de la imagen y, opcionalmente, la dirección `recipient` de cada jugador). Las imágenes viven en `ipfs/images/`.
2. **Subir los metadatos a IPFS** — con [IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) en marcha (API local en `127.0.0.1:5001`):

   ```bash
   npm run upload:ipfs
   ```

   Genera un JSON ERC-721 por jugador (`name`, `description`, `image`, `attributes`), lo sube a IPFS y escribe `ipfs/players-with-cids.json`. Ese fichero es generado y no se versiona.
3. **Desplegar y acuñar** — en la red local de Hardhat:

   ```bash
   npx hardhat run scripts/deploy.js
   ```

   Despliega el contrato y, si existe `ipfs/players-with-cids.json`, acuña un NFT por jugador. Si un jugador no tiene `recipient`, su NFT se acuña a la cuenta que despliega. Para acuñar en un contrato ya desplegado (por ejemplo en un nodo local con `npx hardhat node`), pasa su dirección en la variable `CONTRACT_ADDRESS`:

   ```bash
   CONTRACT_ADDRESS=0x... npx hardhat run scripts/batchMint.js --network localhost
   # PowerShell: $env:CONTRACT_ADDRESS="0x..."; npx hardhat run scripts/batchMint.js --network localhost
   ```

### Desplegar en Sepolia

Copia `.env.example` a `.env` y rellena `SEPOLIA_URL` y `PRIVATE_KEY` (**una cuenta solo de pruebas**). La red `sepolia` solo se activa si ambas variables existen. Después añade `--network sepolia` a los comandos anteriores.

## Importante antes de acuñar

El `tokenURI` de cada NFT debe apuntar al **JSON de metadatos**, no a la imagen. Genéralo siempre con `npm run upload:ipfs`: si acuñas con un `players-with-cids.json` cuyos `metadataURI` terminan en `.jpg`, los marketplaces mostrarían solo una foto, sin nombre ni atributos.

## Limitaciones

- Sin auditar y sin probar en un marketplace: úsalo solo en testnet.
- Subir los metadatos exige tener un nodo IPFS local; no hay todavía integración con un servicio de *pinning* (Pinata, web3.storage).
- Las fotos de `ipfs/images/` son de los jugadores del equipo.
