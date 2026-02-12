import { useState, useEffect } from 'react';
import { getFunders } from '@/lib/api/funders';
import { getUserFunders } from '@/lib/api/users';
import { getUsers } from '@/lib/api/users';
import { getISOs } from '@/lib/api/ios_old';
import { Funder } from '@/types/funder';
import { User } from '@/types/user';
import { ISO } from '@/types/iso';

export const useFunders = () => {
  const [funders, setFunders] = useState<Funder[]>([]);
  const [fundersLoading, setFundersLoading] = useState(false);
  const [fundersError, setFundersError] = useState('');

  useEffect(() => {
    setFundersLoading(true);
    setFundersError('');
    getFunders(1, 100)
      .then(res => {
        setFunders(res.data.docs);
      })
      .catch(err => {
        setFundersError('Failed to load funders');
      })
      .finally(() => setFundersLoading(false));
  }, []);

  return {
    funders,
    fundersLoading,
    fundersError,
    refetchFunders: () => {
      setFundersLoading(true);
      setFundersError('');
      getFunders(1, 100)
        .then(res => {
          setFunders(res.data.docs);
        })
        .catch(err => {
          setFundersError('Failed to load funders');
        })
        .finally(() => setFundersLoading(false));
    }
  };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    setUsersLoading(true);
    setUsersError('');
    getUsers(1, 100)
      .then(res => {
        setUsers(res.data.docs);
      })
      .catch(err => {
        setUsersError('Failed to load users');
      })
      .finally(() => setUsersLoading(false));
  }, []);

  return {
    users,
    usersLoading,
    usersError,
    refetchUsers: () => {
      setUsersLoading(true);
      setUsersError('');
      getUsers(1, 100)
        .then(res => {
          setUsers(res.data.docs);
        })
        .catch(err => {
          setUsersError('Failed to load users');
        })
        .finally(() => setUsersLoading(false));
    }
  };
};

export const useISOs = () => {
  const [isos, setIsos] = useState<ISO[]>([]);
  const [isosLoading, setIsosLoading] = useState(false);
  const [isosError, setIsosError] = useState('');

  useEffect(() => {
    setIsosLoading(true);
    setIsosError('');
    getISOs(1, 100)
      .then(res => {
        setIsos(res.data.docs);
      })
      .catch(err => {
        setIsosError('Failed to load ISOs');
      })
      .finally(() => setIsosLoading(false));
  }, []);

  return {
    isos,
    isosLoading,
    isosError,
    refetchISOs: () => {
      setIsosLoading(true);
      setIsosError('');
      getISOs(1, 100)
        .then(res => {
          setIsos(res.data.docs);
        })
        .catch(err => {
          setIsosError('Failed to load ISOs');
        })
        .finally(() => setIsosLoading(false));
    }
  };

};

export const useUserFunders = (userId?: string) => {
  const [userFunders, setUserFunders] = useState<any[]>([]);
  const [userFundersLoading, setUserFundersLoading] = useState(false);
  const [userFundersError, setUserFundersError] = useState('');

  useEffect(() => {
    if (userId) {
      setUserFundersLoading(true);
      setUserFundersError('');
      getUserFunders(userId)
        .then(data => {
          if (data?.data?.docs) {
            const funderList = data.data.docs.map((funder: any) => ({
              funder: { _id: funder._id, name: funder.name },
              role_list: [],
              inactive: false
            }));
            setUserFunders(funderList);
          }
        })
        .catch(err => {
          console.error('Failed to fetch user funders:', err);
          setUserFundersError('Failed to load user funders');
        })
        .finally(() => setUserFundersLoading(false));
    }
  }, [userId]);

  return {
    userFunders,
    userFundersLoading,
    userFundersError,
    setUserFunders,
    refetchUserFunders: () => {
      if (userId) {
        setUserFundersLoading(true);
        setUserFundersError('');
        getUserFunders(userId)
          .then(data => {
            if (data?.data?.docs) {
              const funderList = data.data.docs.map((funder: any) => ({
                funder: { _id: funder._id, name: funder.name },
                role_list: [],
                inactive: false
              }));
              setUserFunders(funderList);
            }
          })
          .catch(err => {
            console.error('Failed to fetch user funders:', err);
            setUserFundersError('Failed to load user funders');
          })
          .finally(() => setUserFundersLoading(false));
      }
    }
  };
}; 