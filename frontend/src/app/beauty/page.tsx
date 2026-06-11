import { redirect } from 'next/navigation';

export default function BeautyRedirect() {
  redirect('/?theme=beauty');
}
