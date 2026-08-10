import { attendanceService } from './services/attendanceService.js';

async function test() {
  try {
    const status = await attendanceService.getMyStatus(1);
    console.log(JSON.stringify(status, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
