import {seedFiles} from '../tests/legacy-support/exports';
import {transaction} from '../tests/legacy-support/store';
async function main(){transaction(()=>null);console.log(`Preserved ${await seedFiles()} synthetic source originals. Existing state retained.`)}main();
