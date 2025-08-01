export type OrderStatus = 'en_attente' | 'confirmee' | 'en_cours' | 'prete' | 'livree' | 'annulee';
export type FrontendOrderStatus = 'nouveau' | 'en_cours' | 'pret' | 'livre';

export const mapToFrontendStatus = (status: OrderStatus): FrontendOrderStatus => {
  if (['en_attente', 'confirmee', 'annulee'].includes(status)) {
    return 'nouveau';
  }
  if (status === 'prete') return 'pret';
  if (status === 'livree') return 'livre';
  return status as FrontendOrderStatus; // handles 'en_cours' case
};

export const mapToBackendStatus = (status: FrontendOrderStatus): OrderStatus => {
  const map: Record<FrontendOrderStatus, OrderStatus> = {
    'nouveau': 'en_attente',
    'en_cours': 'en_cours',
    'pret': 'prete',
    'livre': 'livree'
  };
  return map[status];
};
