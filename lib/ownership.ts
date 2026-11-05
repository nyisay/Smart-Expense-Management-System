// Owner IDs come from requireUser(), never from request payloads.
export const owned = {
  transaction: (id: string, ownerId: string) => ({ id, ownerId }),
  receipt: (id: string, ownerId: string) => ({ id, ownerId }),
  group: (id: string, ownerId: string) => ({ id, ownerId }),
  groupRecord: (id: string, ownerId: string) => ({ id, group: { ownerId } }),
};
