export function canManageMemberEntity(ownerUid: string, actorUid: string, actorCanCoordinate: boolean) {
  return actorCanCoordinate || ownerUid === actorUid;
}