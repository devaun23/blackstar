import * as fs from 'fs';
import * as path from 'path';
const envPath = path.resolve(__dirname, '../.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1]!] = m[2]!;
}
async function main() {
  const { topicSourceMap } = await import('../src/lib/factory/source-packs/topic-source-map');
  const { checkSourceSufficiency } = await import('../src/lib/factory/source-packs/sufficiency');
  const NBME_COVERED = ['Tuberculosis', 'Heart Failure', 'CHF Exacerbation', 'Anaphylaxis', 'Parkinson Disease', 'Pericarditis', 'SLE', 'UTI/Pyelonephritis'];
  console.log('Topics in NBME ∩ blueprint_node, checking source sufficiency:');
  for (const t of NBME_COVERED) {
    const lookup = topicSourceMap[t] ?? topicSourceMap[t.toLowerCase()] ?? topicSourceMap[t.replace(/\s+/g, '-').toLowerCase()];
    const mapHit = !!lookup;
    let suff = { sufficient: false, missing: [] as string[] };
    try {
      suff = await checkSourceSufficiency(t);
    } catch (e) {
      suff = { sufficient: false, missing: [String(e)] };
    }
    console.log(`  ${t.padEnd(25)} map_hit=${mapHit ? 'Y' : 'N'}  sufficient=${suff.sufficient}  missing=${suff.missing.join('; ') || '(none)'}`);
  }
}
main().catch(console.error);
