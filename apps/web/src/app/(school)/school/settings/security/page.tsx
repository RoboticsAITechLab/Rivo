import { redirect } from 'next/navigation';

export default function SecuritySettingsPage() {
  // Direct default to the Multi-Factor Authentication setup workspace
  redirect('/school/settings/security/mfa');
}
