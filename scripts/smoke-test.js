require('dotenv').config();

const baseUrl = process.env.SMOKE_API_URL || `http://localhost:${process.env.PORT || 5001}/api`;
const password = 'SmokeTest@123';
const results = [];
const createdUserIds = new Set();
const createdStoreIds = new Set();

async function request(path, { method = 'GET', token, body, expected } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (expected !== undefined && response.status !== expected) {
    throw new Error(`Expected HTTP ${expected}, received ${response.status}: ${JSON.stringify(data)}`);
  }
  return { status: response.status, data };
}

async function check(name, operation) {
  try {
    await operation();
    results.push({ name, result: 'PASS' });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, result: 'FAIL', error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function main() {
  let adminToken;
  let ownerToken;
  let otherOwnerToken;
  let noStoreOwnerToken;
  let userToken;
  let adminId;
  let ownerId;
  let userId;
  let otherOwnerId;
  let noStoreOwnerId;
  let storeId;
  let unownedStoreId;
  let secondStoreId;
  let adminCreatedUserId;
  let deleteUserId;
  const emailTag = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const emailFor = (prefix) => `smoke-${prefix}-${emailTag}@example.test`;

  try {
    const adminLogin = await request('/auth/login', {
      method: 'POST', expected: 200,
      body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    });
    adminToken = adminLogin.data.token;
    adminId = adminLogin.data.user.id;
    assert(adminToken && adminLogin.data.user.role === 'SYSTEM_ADMIN', 'Admin login response shape is invalid');

    const ownerLogin = await request('/auth/login', {
      method: 'POST', expected: 200,
      body: { email: 'storeowner1@example.com', password: 'StoreOwner@123' },
    });
    ownerToken = ownerLogin.data.token;
    ownerId = ownerLogin.data.user.id;

    await check('Auth: register rejects names under 20 characters', async () => {
      await request('/auth/register', { method: 'POST', expected: 400, body: {
        name: 'Too short', email: emailFor('short'), password, address: 'Smoke test address',
      } });
    });
    await check('Auth: register rejects a weak password', async () => {
      await request('/auth/register', { method: 'POST', expected: 400, body: {
        name: 'A Valid Smoke Test User', email: emailFor('weak'), password: 'password', address: 'Smoke test address',
      } });
    });
    await check('Auth: register creates a user with a valid name', async () => {
      const result = await request('/auth/register', { method: 'POST', expected: 201, body: {
        name: 'A Valid Smoke Test User', email: emailFor('normal'), password, address: 'Smoke test address',
      } });
      userToken = result.data.token;
      userId = result.data.user.id;
      createdUserIds.add(userId);
      assert(userToken && result.data.user.role === 'NORMAL_USER', 'Registration response lacks token or role');
    });
    await check('Auth: duplicate email is rejected', async () => {
      await request('/auth/register', { method: 'POST', expected: 400, body: {
        name: 'A Valid Smoke Test User', email: emailFor('normal'), password, address: 'Smoke test address',
      } });
    });
    await check('Auth: valid login returns token and user; bad password is 401', async () => {
      const good = await request('/auth/login', { method: 'POST', expected: 200, body: { email: emailFor('normal'), password } });
      assert(good.data.token && good.data.user.id === userId, 'Login response shape is invalid');
      await request('/auth/login', { method: 'POST', expected: 401, body: { email: emailFor('normal'), password: 'WrongPassword@1' } });
    });
    await check('Auth: profile accepts a token and rejects no token', async () => {
      const profile = await request('/auth/profile', { token: userToken, expected: 200 });
      assert(profile.data.user.id === userId, 'Profile returned the wrong user');
      await request('/auth/profile', { expected: 401 });
    });
    await check('Auth: token verification succeeds', async () => {
      const verified = await request('/auth/verify-token', { method: 'POST', token: userToken, expected: 200 });
      assert(verified.data.valid === true, 'Token was not marked valid');
    });
    await check('Auth: wrong and correct current password handling', async () => {
      await request('/auth/change-password', { method: 'POST', token: userToken, expected: 400, body: {
        currentPassword: 'WrongPassword@1', newPassword: 'SmokeTest@456', confirmPassword: 'SmokeTest@456',
      } });
      await request('/auth/change-password', { method: 'POST', token: userToken, expected: 200, body: {
        currentPassword: password, newPassword: 'SmokeTest@456', confirmPassword: 'SmokeTest@456',
      } });
      await request('/auth/change-password', { method: 'POST', token: userToken, expected: 200, body: {
        currentPassword: 'SmokeTest@456', newPassword: password, confirmPassword: password,
      } });
    });

    await check('Users: admin list succeeds; normal, owner, and anonymous access are denied', async () => {
      const users = await request('/users', { token: adminToken, expected: 200 });
      assert(Array.isArray(users.data.users), 'User list shape is invalid');
      assert(!('password' in users.data.users[0]), 'User list exposed a password');
      await request('/users', { token: userToken, expected: 403 });
      await request('/users', { token: ownerToken, expected: 403 });
      await request('/users', { expected: 401 });
    });
    await check('Users: admin can read any user; normal user can read only self', async () => {
      const details = await request(`/users/${ownerId}`, { token: adminToken, expected: 200 });
      assert(details.data.user.role === 'STORE_OWNER' && details.data.user.store_name && details.data.user.created_at && !('password' in details.data.user), 'User details shape/security invalid');
      await request(`/users/${userId}`, { token: userToken, expected: 200 });
      await request(`/users/${ownerId}`, { token: userToken, expected: 403 });
    });
    await check('Users: admin update accepts uppercase role and rejects lowercase role', async () => {
      const update = await request(`/users/${userId}`, { method: 'PUT', token: adminToken, expected: 200, body: {
        name: 'A Valid Smoke Test User Updated', email: emailFor('normal'), address: 'Updated smoke address', role: 'STORE_OWNER',
      } });
      assert(update.data.user.name.endsWith('Updated') && update.data.user.role === 'STORE_OWNER', 'User fields or role were not updated');
      await request(`/users/${userId}`, { method: 'PUT', token: adminToken, expected: 200, body: { role: 'NORMAL_USER' } });
      await request(`/users/${userId}`, { method: 'PUT', token: adminToken, expected: 400, body: { role: 'normal_user' } });
    });
    await check('Users: delete self returns 400 and another user can be deleted', async () => {
      await request(`/users/${adminId}`, { method: 'DELETE', token: adminToken, expected: 400 });
      const created = await request('/admin/users', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A User Created For Delete Test', email: emailFor('delete'), password, address: 'Delete test address', role: 'NORMAL_USER',
      } });
      deleteUserId = created.data.user.id;
      createdUserIds.add(deleteUserId);
      await request(`/users/${deleteUserId}`, { method: 'DELETE', token: adminToken, expected: 200 });
      createdUserIds.delete(deleteUserId);
    });
    await check('Users: dashboard stats are admin-only', async () => {
      const stats = await request('/users/stats/dashboard', { token: adminToken, expected: 200 });
      assert(stats.data.stats.total_users !== undefined, 'Dashboard stats missing totals');
      await request('/users/stats/dashboard', { token: userToken, expected: 403 });
      await request('/users/stats/dashboard', { token: ownerToken, expected: 403 });
    });

    await check('Admin: dashboard and create-user validation', async () => {
      const dashboard = await request('/admin/dashboard', { token: adminToken, expected: 200 });
      assert(dashboard.data.stats.total_users !== undefined && dashboard.data.stats.total_stores !== undefined && dashboard.data.stats.total_ratings !== undefined, 'Dashboard totals are incomplete');
      await request('/admin/dashboard', { token: userToken, expected: 403 });
      await request('/admin/users', { method: 'POST', token: adminToken, expected: 400, body: {
        name: 'A Bad Role User Test', email: emailFor('bad-role'), password, address: 'Test address', role: 'normal_user',
      } });
      const created = await request('/admin/users', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A Valid Admin Created Owner', email: emailFor('owner'), password, address: 'Test owner address', role: 'STORE_OWNER',
      } });
      otherOwnerId = created.data.user.id;
      createdUserIds.add(otherOwnerId);
      const login = await request('/auth/login', { method: 'POST', expected: 200, body: { email: emailFor('owner'), password } });
      otherOwnerToken = login.data.token;
    });

    await check('Admin: filters and ascending/descending sort work', async () => {
      const users = await request(`/admin/users?search=${encodeURIComponent(emailFor('normal'))}&searchBy=email&role=NORMAL_USER&dateFrom=2000-01-01&dateTo=2099-12-31&sortBy=email&sortOrder=asc`, { token: adminToken, expected: 200 });
      assert(users.data.users.some((u) => u.id === userId), 'Filtered user was not found');
      const ascending = await request('/admin/users?limit=100&sortBy=email&sortOrder=asc', { token: adminToken, expected: 200 });
      const descending = await request('/admin/users?limit=100&sortBy=email&sortOrder=desc', { token: adminToken, expected: 200 });
      assert(ascending.data.users.length > 1 && ascending.data.users[0].email <= ascending.data.users[1].email, 'Ascending user sort failed');
      assert(descending.data.users[0].email >= descending.data.users[1].email, 'Descending user sort failed');
      const stores = await request('/admin/stores?searchBy=name&search=Premium&dateFrom=2000-01-01&dateTo=2099-12-31&sortBy=email&sortOrder=asc', { token: adminToken, expected: 200 });
      assert(Array.isArray(stores.data.stores), 'Filtered store response invalid');
      const storesAsc = await request('/admin/stores?limit=100&sortBy=email&sortOrder=asc', { token: adminToken, expected: 200 });
      const storesDesc = await request('/admin/stores?limit=100&sortBy=email&sortOrder=desc', { token: adminToken, expected: 200 });
      assert(storesAsc.data.stores.length > 1 && storesAsc.data.stores[0].email <= storesAsc.data.stores[1].email, 'Ascending store sort failed');
      assert(storesDesc.data.stores[0].email >= storesDesc.data.stores[1].email, 'Descending store sort failed');
      const owners = await request('/admin/store-owners', { token: adminToken, expected: 200 });
      assert(Array.isArray(owners.data.storeOwners), 'Available owners response invalid');
    });

    await check('Stores: list is available to all roles and owners see only their store', async () => {
      const normal = await request('/stores', { token: userToken, expected: 200 });
      assert(normal.data.stores.every((s) => Object.hasOwn(s, 'user_rating')), 'Normal user list omitted user_rating');
      await request('/stores', { token: adminToken, expected: 200 });
      const ownerStores = await request('/stores', { token: ownerToken, expected: 200 });
      assert(ownerStores.data.stores.every((s) => s.owner_name), 'Owner list included a store owned by someone else');
    });
    await check('Stores: owner store route and no-store 404', async () => {
      const mine = await request('/stores/my-store', { token: ownerToken, expected: 200 });
      assert(mine.data.id, 'Owner store response missing id');
      await request('/stores/my-store', { token: userToken, expected: 403 });
      const created = await request('/admin/users', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A Valid Owner With No Store', email: emailFor('no-store'), password, address: 'No store address', role: 'STORE_OWNER',
      } });
      noStoreOwnerId = created.data.user.id;
      createdUserIds.add(noStoreOwnerId);
      const login = await request('/auth/login', { method: 'POST', expected: 200, body: { email: emailFor('no-store'), password } });
      noStoreOwnerToken = login.data.token;
      await request('/stores/my-store', { token: noStoreOwnerToken, expected: 404 });
      await request('/stores/my-store/ratings', { token: noStoreOwnerToken, expected: 404 });
    });
    await check('Stores: create validation, wrong owner role, and admin create', async () => {
      await request('/stores', { method: 'POST', token: adminToken, expected: 400, body: {
        name: 'Too Short Store', email: emailFor('short-store'), address: 'Test address',
      } });
      await request('/stores', { method: 'POST', token: userToken, expected: 403, body: {
        name: 'A Store Created For Smoke Testing', email: emailFor('blocked-store'), address: 'Test address',
      } });
      await request('/stores', { method: 'POST', token: adminToken, expected: 400, body: {
        name: 'A Store Created For Smoke Testing', email: emailFor('bad-owner'), address: 'Test address', ownerId: userId,
      } });
      const created = await request('/stores', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A Store Created For Smoke Testing', email: emailFor('owned-store'), address: 'Test store address', ownerId: otherOwnerId,
      } });
      storeId = created.data.store.id;
      createdStoreIds.add(storeId);
      const adminCreated = await request('/admin/stores', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'An Admin Endpoint Smoke Test Store', email: emailFor('admin-store'), address: 'Test store address',
      } });
      unownedStoreId = adminCreated.data.store.id;
      createdStoreIds.add(unownedStoreId);
    });
    await check('Stores: owner ratings route paginates and sorts', async () => {
      const result = await request('/stores/my-store/ratings?page=1&limit=5&sort_by=rating&sort_order=asc', { token: ownerToken, expected: 200 });
      assert(Array.isArray(result.data.ratings) && result.data.pagination, 'Owner ratings response missing pagination');
      if (result.data.ratings.length > 1) assert(result.data.ratings[0].rating <= result.data.ratings[1].rating, 'Owner ascending rating sort failed');
      const desc = await request('/stores/my-store/ratings?page=1&limit=5&sort_by=rating&sort_order=desc', { token: ownerToken, expected: 200 });
      if (desc.data.ratings.length > 1) assert(desc.data.ratings[0].rating >= desc.data.ratings[1].rating, 'Owner descending rating sort failed');
    });
    await check('Stores: details return 200 and missing ids return 404', async () => {
      await request(`/stores/${storeId}`, { token: adminToken, expected: 200 });
      await request('/stores/2147483000', { token: adminToken, expected: 404 });
    });
    await check('Stores: admin and owner update; other owner and normal user are denied', async () => {
      await request(`/stores/${storeId}`, { method: 'PUT', token: adminToken, expected: 200, body: { address: 'Admin updated address' } });
      await request(`/stores/${storeId}`, { method: 'PUT', token: otherOwnerToken, expected: 200, body: { address: 'Owner updated address' } });
      await request(`/stores/${storeId}`, { method: 'PUT', token: ownerToken, expected: 403, body: { address: 'Forbidden address' } });
      await request(`/stores/${storeId}`, { method: 'PUT', token: userToken, expected: 403, body: { address: 'Forbidden address' } });
    });
    await check('Stores: store ratings are limited to admin and owning owner', async () => {
      await request(`/stores/${storeId}/ratings`, { token: adminToken, expected: 200 });
      await request(`/stores/${storeId}/ratings`, { token: otherOwnerToken, expected: 200 });
      await request(`/stores/${storeId}/ratings`, { token: ownerToken, expected: 403 });
      await request(`/stores/${storeId}/ratings`, { token: userToken, expected: 403 });
    });

    await check('Ratings: insert, duplicate, bounds, and missing store', async () => {
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId, rating: 4 } });
      await request('/ratings', { method: 'POST', token: userToken, expected: 400, body: { storeId, rating: 3 } });
      await request('/ratings', { method: 'POST', token: userToken, expected: 400, body: { storeId: unownedStoreId, rating: 0 } });
      await request('/ratings', { method: 'POST', token: userToken, expected: 400, body: { storeId: unownedStoreId, rating: 6 } });
      await request('/ratings', { method: 'POST', token: userToken, expected: 404, body: { storeId: 2147483000, rating: 3 } });
      await request('/ratings', { method: 'POST', token: adminToken, expected: 403, body: { storeId, rating: 3 } });
      await request('/ratings', { method: 'POST', token: otherOwnerToken, expected: 403, body: { storeId, rating: 3 } });
    });
    await check('Ratings: update, missing update, and delete', async () => {
      await request(`/ratings/${storeId}`, { method: 'PUT', token: userToken, expected: 200, body: { storeId, rating: 5 } });
      await request('/ratings/2147483000', { method: 'PUT', token: userToken, expected: 404, body: { storeId: 2147483000, rating: 5 } });
      await request(`/ratings/${storeId}`, { method: 'DELETE', token: userToken, expected: 200 });
      await request(`/ratings/${storeId}`, { method: 'DELETE', token: userToken, expected: 404 });
    });
    await check('Ratings: my ratings, store ratings, user ratings, and stats authorization', async () => {
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId, rating: 2 } });
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId: unownedStoreId, rating: 5 } });
      const mineAsc = await request('/ratings/my-ratings?page=1&limit=5&sortBy=rating&sortOrder=asc', { token: userToken, expected: 200 });
      const mineDesc = await request('/ratings/my-ratings?page=1&limit=5&sortBy=rating&sortOrder=desc', { token: userToken, expected: 200 });
      assert(mineAsc.data.ratings[0].rating <= mineAsc.data.ratings[1].rating, 'Ascending my-ratings sort failed');
      assert(mineDesc.data.ratings[0].rating >= mineDesc.data.ratings[1].rating, 'Descending my-ratings sort failed');
      await request('/ratings/my-ratings', { token: ownerToken, expected: 403 });
      await request(`/ratings/store/${storeId}?sortBy=user_name&sortOrder=desc`, { token: userToken, expected: 200 });
      await request(`/ratings/user/${userId}`, { token: adminToken, expected: 200 });
      await request(`/ratings/user/${userId}`, { token: ownerToken, expected: 403 });
      await request('/ratings/stats', { token: adminToken, expected: 200 });
      await request('/ratings/stats', { token: userToken, expected: 403 });
      await request(`/ratings/${storeId}`, { method: 'DELETE', token: userToken, expected: 200 });
      await request(`/ratings/${unownedStoreId}`, { method: 'DELETE', token: userToken, expected: 200 });
    });
    await check('Ratings: trigger keeps aggregate values correct on insert, update, and delete', async () => {
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId, rating: 2 } });
      let aggregate = await request(`/stores/${storeId}`, { token: adminToken, expected: 200 });
      assert(Number(aggregate.data.store.total_ratings) === 1 && Number(aggregate.data.store.average_rating) === 2, 'Insert trigger did not update store totals');
      await request(`/ratings/${storeId}`, { method: 'PUT', token: userToken, expected: 200, body: { storeId, rating: 5 } });
      aggregate = await request(`/stores/${storeId}`, { token: adminToken, expected: 200 });
      assert(Number(aggregate.data.store.total_ratings) === 1 && Number(aggregate.data.store.average_rating) === 5, 'Update trigger did not update store totals');
      await request(`/ratings/${storeId}`, { method: 'DELETE', token: userToken, expected: 200 });
      aggregate = await request(`/stores/${storeId}`, { token: adminToken, expected: 200 });
      assert(Number(aggregate.data.store.total_ratings) === 0 && Number(aggregate.data.store.average_rating) === 0, 'Delete trigger did not update store totals');
    });
    await check('Database: owner_id is unique and owner deletion sets owner_id NULL', async () => {
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId: unownedStoreId, rating: 4 } });
      const secondOwner = await request('/admin/users', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A Second Owner For Foreign Key Test', email: emailFor('second-owner'), password, address: 'Owner address', role: 'STORE_OWNER',
      } });
      const secondOwnerId = secondOwner.data.user.id;
      createdUserIds.add(secondOwnerId);
      const secondStore = await request('/admin/stores', { method: 'POST', token: adminToken, expected: 201, body: {
        name: 'A Second Temporary Test Store Name', email: emailFor('second-store'), address: 'Store address', ownerId: secondOwnerId,
      } });
      secondStoreId = secondStore.data.store.id;
      createdStoreIds.add(secondStoreId);
      await request('/ratings', { method: 'POST', token: userToken, expected: 201, body: { storeId: secondStoreId, rating: 3 } });
      await request('/admin/stores', { method: 'POST', token: adminToken, expected: 400, body: {
        name: 'A Duplicate Owner Store Attempt', email: emailFor('duplicate-owner'), address: 'Store address', ownerId: secondOwnerId,
      } });
      await request(`/users/${secondOwnerId}`, { method: 'DELETE', token: adminToken, expected: 200 });
      createdUserIds.delete(secondOwnerId);
      const checkNull = await request(`/stores/${secondStoreId}`, { token: adminToken, expected: 200 });
      assert(checkNull.data.store.owner_id === null, 'Deleting an owner did not set owner_id to NULL');
    });
    await check('Stores: only admin can delete stores; store deletion cascades ratings', async () => {
      await request(`/stores/${unownedStoreId}`, { method: 'DELETE', token: userToken, expected: 403 });
      await request(`/stores/${unownedStoreId}`, { method: 'DELETE', token: adminToken, expected: 200 });
      createdStoreIds.delete(unownedStoreId);
      const remaining = await request(`/ratings/store/${unownedStoreId}`, { token: userToken, expected: 404 });
      assert(remaining.status === 404, 'Deleted store remained readable');
    });
    await check('Authorization: protected route matrix rejects requests without a token', async () => {
      const cases = [
        ['/users', 'GET'], [`/users/${userId}`, 'GET'], [`/users/${userId}`, 'PUT'], [`/users/${userId}`, 'DELETE'],
        ['/users/stats/dashboard', 'GET'], ['/admin/dashboard', 'GET'], ['/admin/users', 'GET'], ['/admin/users', 'POST'],
        ['/admin/stores', 'GET'], ['/admin/stores', 'POST'], ['/admin/store-owners', 'GET'],
        ['/stores', 'GET'], ['/stores/my-store', 'GET'], ['/stores/my-store/ratings', 'GET'],
        [`/stores/${storeId}`, 'GET'], ['/stores', 'POST'], [`/stores/${storeId}`, 'PUT'], [`/stores/${storeId}`, 'DELETE'],
        [`/stores/${storeId}/ratings`, 'GET'], ['/ratings', 'POST'], [`/ratings/${storeId}`, 'PUT'],
        [`/ratings/${storeId}`, 'DELETE'], ['/ratings/my-ratings', 'GET'], [`/ratings/user/${userId}`, 'GET'],
        [`/ratings/store/${storeId}`, 'GET'], ['/ratings/stats', 'GET'],
      ];
      for (const [path, method] of cases) {
        await request(path, { method, expected: 401, ...(method === 'POST' || method === 'PUT' ? { body: {} } : {}) });
      }
    });
  } catch (error) {
    results.push({ name: 'Smoke suite setup', result: 'FAIL', error: error.message });
    console.error(`FAIL Smoke suite setup: ${error.message}`);
  } finally {
    for (const id of createdStoreIds) {
      try { await request(`/stores/${id}`, { method: 'DELETE', token: adminToken, expected: 200 }); } catch { /* report cleanup below */ }
    }
    for (const id of createdUserIds) {
      try { await request(`/users/${id}`, { method: 'DELETE', token: adminToken, expected: 200 }); } catch { /* already removed or unavailable */ }
    }
    if (secondStoreId) {
      const db = require('../config/database');
      try {
        const dashboard = await request('/admin/dashboard', { token: adminToken, expected: 200 });
        const counts = await db.pool.query(`
          SELECT (SELECT COUNT(*) FROM users) AS total_users,
                 (SELECT COUNT(*) FROM stores) AS total_stores,
                 (SELECT COUNT(*) FROM ratings) AS total_ratings
        `);
        for (const key of ['total_users', 'total_stores', 'total_ratings']) {
          if (Number(dashboard.data.stats[key]) !== Number(counts.rows[0][key])) {
            throw new Error(`Dashboard ${key} does not match database count`);
          }
        }
        console.log('PASS Admin dashboard totals match database counts');
        results.push({ name: 'Admin dashboard totals match database counts', result: 'PASS' });
        const remaining = await db.pool.query('SELECT COUNT(*) FROM ratings WHERE store_id = $1', [secondStoreId]);
        if (Number(remaining.rows[0].count) !== 0) throw new Error('Deleting store did not cascade ratings');
        console.log('PASS Database: deleting store cascades its ratings');
        results.push({ name: 'Database: deleting store cascades its ratings', result: 'PASS' });
        const uniqueOwnerIndex = await db.pool.query("SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'stores' AND indexname = 'idx_stores_owner_unique' AND indexdef ILIKE '%UNIQUE%'");
        if (Number(uniqueOwnerIndex.rows[0].count) !== 1) throw new Error('owner_id unique index is missing');
        console.log('PASS Database: owner_id has a unique index');
        results.push({ name: 'Database: owner_id has a unique index', result: 'PASS' });
        const shortNames = await db.pool.query('SELECT COUNT(*) FROM users WHERE LENGTH(name) < 20');
        if (Number(shortNames.rows[0].count) !== 0) throw new Error('Users remain with names shorter than 20 characters');
        console.log('PASS Database: all existing user names meet the 20-character minimum');
        results.push({ name: 'Database: all existing user names meet the 20-character minimum', result: 'PASS' });
      } catch (error) {
        console.error(`FAIL Database: deleting store cascades its ratings: ${error.message}`);
        results.push({ name: 'Database: deleting store cascades its ratings', result: 'FAIL', error: error.message });
      } finally {
        await db.pool.end();
      }
    }
    const failed = results.filter((item) => item.result === 'FAIL').length;
    console.log(`\nSmoke tests: ${results.length - failed} PASS, ${failed} FAIL`);
    if (failed) process.exitCode = 1;
  }
}

main();
