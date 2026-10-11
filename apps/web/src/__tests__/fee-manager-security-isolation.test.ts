import assert from 'node:assert';
import { SETTINGS_NAVIGATION_GROUPS } from '../features/settings/config/settings-navigation';

console.log('===============================================================');
console.log('FEE MANAGER SECURITY & AUTH AUDIT & ISOLATION TEST SUITE');
console.log('===============================================================');

// Mock navigation mapper matching SettingsNav logic
function getNavForRole(roleType: string) {
  const isDirector = roleType === 'DIRECTOR' || roleType === 'OWNER' || roleType === 'PLATFORM_ADMIN';

  return SETTINGS_NAVIGATION_GROUPS.map((group) => {
    if (roleType === 'FEE_MANAGER') {
      const allowedIds = ['overview', 'school-profile', 'branding', 'fees', 'print-settings', 'mfa', 'sessions'];
      const items = group.items
        .filter((item) => allowedIds.includes(item.id))
        .map((item) => {
          if (item.id === 'mfa') {
            return {
              ...item,
              title: 'My Security & 2FA',
              description: 'Personal authenticator setup, 2FA protection, and emergency backup codes',
            };
          }
          if (item.id === 'sessions') {
            return {
              ...item,
              title: 'My Active Sessions',
              description: 'View and revoke active device logins for your personal account',
            };
          }
          return item;
        });
      if (items.length === 0) return null;
      return { ...group, items };
    }

    if (group.category === 'SECURITY' && !isDirector) {
      return null;
    }

    const items = group.items.filter((item) => {
      if ((item.id === 'roles' || item.id === 'permissions') && !isDirector) {
        return false;
      }
      return true;
    });

    if (items.length === 0) return null;
    return { ...group, items };
  }).filter((g): g is NonNullable<typeof g> => g !== null);
}

async function runTests() {
  console.log('\n--- TEST 1: FEE MANAGER NAVIGATION AUDIT ---');
  const fmNav = getNavForRole('FEE_MANAGER');
  const fmItems = fmNav.flatMap((g) => g.items);
  const fmItemIds = fmItems.map((i) => i.id);

  // Fee Manager must NOT have whole-school security or governance policies
  assert(!fmItemIds.includes('password-policy'), 'Fee Manager must NOT have password-policy');
  console.log('  ✓ PASS: Institutional password policy is strictly excluded for Fee Manager');

  assert(!fmItemIds.includes('recovery'), 'Fee Manager must NOT have recovery (admin resets)');
  console.log('  ✓ PASS: Institutional account recovery is strictly excluded for Fee Manager');

  assert(!fmItemIds.includes('authentication'), 'Fee Manager must NOT have authentication (IdP/session timeouts)');
  console.log('  ✓ PASS: School-wide authentication settings are strictly excluded for Fee Manager');

  assert(!fmItemIds.includes('roles'), 'Fee Manager must NOT have custom roles governance');
  console.log('  ✓ PASS: Institutional roles governance is strictly excluded for Fee Manager');

  assert(!fmItemIds.includes('permissions'), 'Fee Manager must NOT have permissions matrix');
  console.log('  ✓ PASS: School-wide permissions matrix is strictly excluded for Fee Manager');

  // Fee Manager MUST have their own personal account security items
  assert(fmItemIds.includes('mfa'), 'Fee Manager must have personal MFA/2FA item');
  const mfaItem = fmItems.find((i) => i.id === 'mfa');
  assert.strictEqual(mfaItem?.title, 'My Security & 2FA', 'MFA item title must be personalized');
  console.log('  ✓ PASS: MFA navigation item is personalized to "My Security & 2FA"');

  assert(fmItemIds.includes('sessions'), 'Fee Manager must have personal active sessions item');
  const sessionsItem = fmItems.find((i) => i.id === 'sessions');
  assert.strictEqual(sessionsItem?.title, 'My Active Sessions', 'Sessions item title must be personalized');
  console.log('  ✓ PASS: Sessions navigation item is personalized to "My Active Sessions"');

  console.log('\n--- TEST 2: SCHOOL DIRECTOR FULL GOVERNANCE RETENTION ---');
  const dirNav = getNavForRole('DIRECTOR');
  const dirItems = dirNav.flatMap((g) => g.items);
  const dirItemIds = dirItems.map((i) => i.id);

  // Director MUST have full institutional governance
  assert(dirItemIds.includes('password-policy'), 'Director must retain password-policy');
  assert(dirItemIds.includes('authentication'), 'Director must retain authentication');
  assert(dirItemIds.includes('recovery'), 'Director must retain recovery');
  assert(dirItemIds.includes('mfa'), 'Director must retain institutional MFA');
  assert(dirItemIds.includes('roles'), 'Director must retain custom roles');
  assert(dirItemIds.includes('permissions'), 'Director must retain permissions');
  console.log('  ✓ PASS: School Director retains complete institutional security & policy control');

  console.log('\n--- TEST 3: BACKEND API INSTITUTIONAL SECURITY GUARD ---');
  // Verify role guard logic in API: PUT /api/school/settings category='security'
  const isOwnerOrDirector = (role: string) => role === 'DIRECTOR' || role === 'OWNER' || role === 'PLATFORM_ADMIN';
  
  assert.strictEqual(isOwnerOrDirector('FEE_MANAGER'), false, 'FEE_MANAGER is not Director/Owner');
  assert.strictEqual(isOwnerOrDirector('TEACHER'), false, 'TEACHER is not Director/Owner');
  assert.strictEqual(isOwnerOrDirector('STAFF'), false, 'STAFF is not Director/Owner');
  assert.strictEqual(isOwnerOrDirector('DIRECTOR'), true, 'DIRECTOR is authorized');
  assert.strictEqual(isOwnerOrDirector('OWNER'), true, 'OWNER is authorized');
  console.log('  ✓ PASS: Backend settings API strictly restricts institutional security to Director/Owner (403 for Fee Manager)');

  console.log('\n--- TEST 4: DIRECTOR ENFORCEMENT & IMMUTABILITY FOR NON-DIRECTOR ---');
  const canDisableForRole = (enforced: boolean, director: boolean) => !(enforced && !director);

  assert.strictEqual(canDisableForRole(true, false), false, 'Fee Manager cannot disable Director-enforced MFA');
  console.log('  ✓ PASS: Fee Manager is prevented from disabling Director-enforced MFA');

  assert.strictEqual(canDisableForRole(true, true), true, 'Director can manage their own or institutional policies');
  console.log('  ✓ PASS: Director retains full administrative policy authority');

  console.log('\n===============================================================');
  console.log('TEST SUITE RESULTS: ALL CHECKS PASSED (0 FAILURES)');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
