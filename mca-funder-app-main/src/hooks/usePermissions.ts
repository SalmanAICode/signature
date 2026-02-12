import { User } from '@/types/user';
import { createPermission, RESOURCES, ACTIONS } from '@/constants/permission';
import { hasPermission } from '@/lib/utils/permissions';

type UsePermissionsProps = {
  currentUser: User | null;
  resource: keyof typeof RESOURCES;
};

/**
 * Generic permissions hook that can be used for any resource
 * 
 * @example
 * // For user management
 * const { canCreate, canUpdate, canDelete } = usePermissions({ currentUser, resource: 'USER_FUNDER' });
 * 
 * @example
 * // For funder management
 * const { canCreate: canCreateFunder, canUpdate: canUpdateFunder } = usePermissions({ currentUser, resource: 'FUNDER' });
 * 
 * @example
 * // For general user management
 * const permissions = usePermissions({ currentUser, resource: 'USER' });
 */
export const usePermissions = ({ currentUser, resource }: UsePermissionsProps) => {
  const canCreate = hasPermission(
    currentUser,
    createPermission(RESOURCES[resource], ACTIONS.CREATE)
  );
  
  const canUpdate = hasPermission(
    currentUser,
    createPermission(RESOURCES[resource], ACTIONS.UPDATE)
  );
  
  const canDelete = hasPermission(
    currentUser,
    createPermission(RESOURCES[resource], ACTIONS.DELETE)
  );

  const canRead = hasPermission(
    currentUser,
    createPermission(RESOURCES[resource], ACTIONS.READ)
  );

  return {
    canCreate,
    canUpdate,
    canDelete,
    canRead,
  };
}; 