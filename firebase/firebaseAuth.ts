import { auth } from './config';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

export const userLogin = async (email: string, password: string) => {
  try {
    const login = await signInWithEmailAndPassword(auth, email, password);
    console.log(login,'Login')
    return login;
  } catch (err: any) {
    throw err;
  }
};

export const userSignOut = async () => {
  try {
    const logout = await signOut(auth);
    return logout;
  } catch (err: any) {
    throw err;
  }
};
