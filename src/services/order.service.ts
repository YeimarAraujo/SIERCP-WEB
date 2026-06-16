import { db } from '@/shared/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Tipos de pedido reconocidos por el panel de pedidos (super-admin/pedidos).
 */
export type OrderType =
  | 'plan-corporativo'
  | 'licencia-sst'
  | 'pack-sst'
  | 'manikin';

export interface ManualInstitutionOrderInput {
  institutionId: string;
  institutionName: string;
  /** uid del admin principal creado para la institución (si lo hay). */
  userId?: string;
  planSlug: string;
  planName: string;
  /** Precio total del plan en COP. */
  total: number;
  contactEmail?: string;
  nit?: string;
  /** Quién registró el pedido manual (p. ej. "SuperAdmin"). */
  createdBy?: string;
}

/** Deriva el tipo de pedido a partir del slug del plan. */
function orderTypeFromPlan(planSlug: string): OrderType {
  return planSlug.toLowerCase().includes('sst') ? 'licencia-sst' : 'plan-corporativo';
}

export const OrderService = {
  /**
   * Crea un pedido marcado como **pagado manualmente** cuando el super admin da
   * de alta una institución desde el panel. Así la compra queda registrada en
   * `super-admin/pedidos` igual que las compras hechas por checkout.
   *
   * No lanza si falla: la creación de la institución no debe revertirse porque
   * el registro del pedido tenga un problema; se reporta por consola.
   */
  createManualInstitutionOrder: async (
    input: ManualInstitutionOrderInput,
  ): Promise<string | null> => {
    if (!db) return null;
    try {
      const orderId = crypto.randomUUID();
      const total = Number.isFinite(input.total) && input.total > 0 ? input.total : 0;

      await setDoc(doc(db, 'orders', orderId), {
        orderId,
        type: orderTypeFromPlan(input.planSlug),
        status: 'paid', // pagado manualmente por el super admin
        payMethod: 'manual',
        total,
        quantity: 1,
        institutionId: input.institutionId,
        userId: input.userId ?? null,
        planSlug: input.planSlug,
        planName: input.planName,
        buyerType: 'empresa',
        company: {
          institucionName: input.institutionName,
          email: input.contactEmail ?? '',
          nit: input.nit ?? '',
        },
        createdBy: input.createdBy ?? 'SuperAdmin',
        manual: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return orderId;
    } catch (e) {
      console.error('Error creando pedido manual de institución:', e);
      return null;
    }
  },
};
