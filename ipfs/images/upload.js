const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

// This script uses the local IPFS HTTP API directly via fetch + FormData
// to avoid compatibility issues with ipfs-http-client on some Node versions.
// It posts files to http://127.0.0.1:5001/api/v0/add

const { spawnSync } = require('child_process');
const os = require('os');

function apiAddFile(input, filename) {
    // If input is a path string and file exists, use curl @path
    let useTemp = false;
    let filePath = null;
    if (typeof input === 'string' && fs.existsSync(input)) {
        filePath = input;
    } else if (Buffer.isBuffer(input)) {
        // write buffer to temp file
        const tmp = path.join(os.tmpdir(), `${Date.now()}_${filename}`);
        fs.writeFileSync(tmp, input);
        filePath = tmp;
        useTemp = true;
    } else if (input && typeof input.path === 'string' && fs.existsSync(input.path)) {
        filePath = input.path;
    } else {
        throw new Error('Unsupported input to apiAddFile');
    }

    // Use curl to POST multipart/form-data to IPFS HTTP API
    // curl -s -X POST -F file=@<filePath> "http://127.0.0.1:5001/api/v0/add?pin=true"
    try {
        const curlArgs = ['-s', '-X', 'POST', '-F', `file=@${filePath}`, 'http://127.0.0.1:5001/api/v0/add?pin=true'];
        const res = spawnSync('curl', curlArgs, { encoding: 'utf8' });
        if (res.error) throw res.error;
        if (res.status !== 0) {
            throw new Error(`curl exited non-zero: ${res.status} ${res.stderr}`);
        }
        const out = res.stdout.trim();
        const firstLine = out.split('\n').find((l) => l.trim().length > 0);
        if (!firstLine) throw new Error('Empty response from IPFS API');
        const obj = JSON.parse(firstLine);
        const cid = obj.Hash || (obj.Cid && (obj.Cid['/'] || obj.Cid)) || obj.Hash;
        return cid;
    } finally {
        if (useTemp && filePath) {
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
        }
    }
}

async function run() {
    // players.json path candidates (allow it to live under ipfs/ or ipfs/images/)
    const candidates = [
        path.join(process.cwd(), 'ipfs', 'players.json'),
        path.join(process.cwd(), 'ipfs', 'images', 'players.json')
    ];

    const playersFile = process.argv[2] || candidates.find((p) => fs.existsSync(p));
    if (!playersFile) {
        console.error('players.json not found in expected locations. Expected one of:', candidates.join(', '));
        process.exit(1);
    }

    let playersRaw;
    try {
        playersRaw = await fsp.readFile(playersFile, 'utf8');
    } catch (err) {
        console.error('Failed to read players.json:', playersFile);
        console.error(err.message);
        process.exit(1);
    }

    let players;
    try {
        players = JSON.parse(playersRaw);
    } catch (err) {
        console.error('players.json is not valid JSON');
        process.exit(1);
    }

    const out = [];

    console.log(`Found ${players.length} players in ${playersFile}`);

    for (const p of players) {
        console.log(`\nProcessing ${p.name} ...`);

        const imagePath = p.imagePath;
        let imageCID = null;

        if (imagePath && imagePath.length > 0) {
            try {
                const stream = fs.createReadStream(imagePath);
                const fileName = path.basename(imagePath);
                console.log(`Uploading image ${imagePath} to IPFS via HTTP API...`);
                imageCID = await apiAddFile(stream, fileName);
                console.log(`Image uploaded: ${imageCID}`);
            } catch (err) {
                console.error(`Failed to upload image for ${p.name}:`, err.message);
                console.error('Make sure the image exists at the path specified in players.json');
            }
        } else {
            console.log('No local imagePath provided; using image field from players.json if present');
        }

        const metadata = {
            name: `${p.name} #${p.dorsal}`,
            description: p.description || `${p.name}, jugador del equipo Solfachuzas`,
            image: imageCID ? `ipfs://${imageCID}` : (p.image || ''),
            attributes: []
        };

        metadata.attributes.push({ trait_type: 'Dorsal', value: p.dorsal });
        metadata.attributes.push({ trait_type: 'Posición', value: p.position });

        if (p.stats && typeof p.stats === 'object') {
            for (const [k, v] of Object.entries(p.stats)) {
                metadata.attributes.push({ trait_type: k, value: String(v) });
            }
        }

        try {
            const metaStr = JSON.stringify(metadata);
            const metaBuffer = Buffer.from(metaStr, 'utf8');
            console.log('Uploading metadata JSON to IPFS via HTTP API...');
            const metadataCID = await apiAddFile(metaBuffer, `${p.name.replace(/\s+/g, '_')}_metadata.json`);
            console.log(`Metadata uploaded: ${metadataCID}`);

            out.push({
                name: p.name,
                dorsal: p.dorsal,
                position: p.position,
                recipient: p.recipient || '',
                imageCID: imageCID,
                metadataCID: metadataCID,
                metadataURI: `ipfs://${metadataCID}`
            });
        } catch (err) {
            console.error('Failed to upload metadata for', p.name, err.message);
        }
    }

    const outPath = path.join(process.cwd(), 'ipfs', 'players-with-cids.json');
    await fsp.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log(`\nWrote results to ${outPath}`);
    console.log('Done.');
    process.exit(0);
}

run();