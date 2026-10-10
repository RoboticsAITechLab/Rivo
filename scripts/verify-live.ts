async function verifyLive() {
  const base = 'https://rivo-web-sand.vercel.app';
  console.log('Testing live target:', base);

  // 1. Root health
  try {
    const hRes = await fetch(base + '/api/health');
    console.log('1. /api/health -> status:', hRes.status);
  } catch (e: any) {
    console.log('1. /api/health failed:', e.message);
  }

  // 2. Testing center unauthenticated access & SEO headers
  try {
    const tcRes = await fetch(base + '/testing-center', { redirect: 'manual' });
    console.log('2. /testing-center -> status:', tcRes.status, 'location:', tcRes.headers.get('location'), 'x-robots-tag:', tcRes.headers.get('x-robots-tag'));
  } catch (e: any) {
    console.log('2. /testing-center failed:', e.message);
  }

  // 3. Legacy /admin/testing redirect
  try {
    const legacyRes = await fetch(base + '/admin/testing', { redirect: 'manual' });
    console.log('3. /admin/testing -> status:', legacyRes.status, 'location:', legacyRes.headers.get('location'));
  } catch (e: any) {
    console.log('3. /admin/testing failed:', e.message);
  }

  // 4. Operator API unauthorized protection
  try {
    const apiRes = await fetch(base + '/api/testing-center/health');
    console.log('4. /api/testing-center/health (no auth) -> status:', apiRes.status);
  } catch (e: any) {
    console.log('4. /api/testing-center/health failed:', e.message);
  }

  // 5. Test login with seeded admin@greenwood.edu
  try {
    const loginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@greenwood.edu', password: 'Password@123' }),
    });
    console.log('5. Login attempt admin@greenwood.edu -> status:', loginRes.status);
    const loginData = await loginRes.json();
    console.log('   Login response keys:', Object.keys(loginData));
    if (loginData.success) {
      console.log('   Login SUCCESS! User authenticated:', loginData.user?.email, 'role:', loginData.user?.role || loginData.user?.platformRole);
    }
  } catch (e: any) {
    console.log('5. Login failed:', e.message);
  }
}

verifyLive();
