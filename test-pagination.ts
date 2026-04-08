
import { buildErpClient } from './server/src/lib/erpClient';

async function test() {
  const client = buildErpClient('https://dummyjson.com', 'API_KEY', { apiKey: 'test' });
  const { total, fetched } = await client.fetchAll({
    endpoint: '/users',
    pagination: {
      type: 'offset',
      offsetParam: 'skip',
      pageSizeParam: 'limit',
      pageSize: 30,
      dataPath: 'users',
      totalPath: 'total'
    },
    maxPages: 10
  });
  console.log(`Test Finished. Total: ${total}, Fetched: ${fetched}`);
}

test().catch(console.error);
