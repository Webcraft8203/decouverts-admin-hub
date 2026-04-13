// Activity logging has been removed. This stub prevents import errors.
export function useActivityLog() {
  return {
    logActivity: async (_action: string, _entity: string, _entityId?: string, _description?: string) => {},
  };
}
