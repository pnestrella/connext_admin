export type AuthTypes = {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  userMDB: any;
  setUserMDB: React.Dispatch<React.SetStateAction<any>>;
  loading: boolean;
  setLoading: (value: boolean) => void,
  logout: any;
};
