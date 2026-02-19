/** Client → Server input command sent every frame */
export interface InputMessage {
  /** Sequence number for client-side prediction reconciliation */
  readonly seq: number
  /** Normalized movement direction vector (0,0 = stop) */
  readonly moveDir: { readonly x: number; readonly y: number }
  /** Attack target entity ID (null = no attack) */
  readonly attackTargetId: string | null
  /** Hero facing direction in radians */
  readonly facing: number
}
