import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/AuthForm';

export default function RegisterScreen() {
  const { register } = useAuth();

  return (
    <AuthForm
      mode="register"
      onSubmit={async ({ name, email, password }) => {
        await register(name!, email, password);
      }}
    />
  );
}
