import { describe, it, expect, vi, beforeEach } from 'vitest';

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

import { NotificationService } from '@/services/notification.service';

const receipt = {
  toEmail: 'cliente@empresa.co',
  nombre: '<b>Ana</b>',
  planName: 'PYME',
  amountCents: 100_000,
  reference: 'tx-1',
  expiresAt: new Date('2027-01-01T12:00:00Z'),
};

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test';
    send.mockResolvedValue({ data: { id: '1' }, error: null });
  });

  it('no falla ni intenta enviar si falta la clave', async () => {
    delete process.env.RESEND_API_KEY;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(NotificationService.sendPlanReceipt(receipt)).resolves.toBeUndefined();

    expect(send).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('RESEND_API_KEY'));
  });

  it('registra el error que Resend devuelve sin lanzarlo', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'dominio no verificado' } });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await NotificationService.sendPlanReceipt(receipt);

    expect(log).toHaveBeenCalled();
  });

  it('escapa los datos del cliente en el HTML', async () => {
    await NotificationService.sendPlanReceipt(receipt);

    const { html } = send.mock.calls[0][0];
    expect(html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(html).not.toContain('<b>Ana</b>');
  });
});
