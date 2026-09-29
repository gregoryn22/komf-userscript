// Concatenates the userscript header with the vite bundle into komf.user.js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const assets = readdirSync('dist/assets').filter(file => file.startsWith('index') && file.endsWith('.js'))
if (assets.length != 1) throw new Error(`expected a single bundle in dist/assets, found: ${assets.join(', ')}`)

const meta = readFileSync('komf.meta.js', 'utf8')
const bundle = readFileSync(`dist/assets/${assets[0]}`, 'utf8')
writeFileSync('komf.user.js', meta + bundle)
console.log(`komf.user.js written (${assets[0]})`)
