import {seedFiles} from '../lib/exports';
import {transaction} from '../lib/store';
async function main(){transaction(()=>null);console.log(`Preserved ${await seedFiles()} synthetic source originals. Existing state retained.`)}main();
