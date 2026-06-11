import { redirect } from 'next/navigation';

export default function ServiceRedirect() {
  redirect('/?theme=service');
}
