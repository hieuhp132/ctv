import { updateReferralFields } from '../../client/src/api';

// Mock fetch API
global.fetch = jest.fn();

describe('updateReferralFields API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should call the API with correct parameters', async () => {
    const referralId = '12345';
    const updates = { candidateEmail: 'newemail@example.com' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Referral fields updated successfully', referral: { id: referralId, ...updates } }),
    });

    const response = await updateReferralFields(referralId, updates);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/referrals/${referralId}/fields`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates),
      })
    );

    expect(response).toEqual({ message: 'Referral fields updated successfully', referral: { id: referralId, ...updates } });
  });

  it('should throw an error if the API call fails', async () => {
    const referralId = '12345';
    const updates = { candidateEmail: 'newemail@example.com' };

    fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Failed to update referral fields',
    });

    await expect(updateReferralFields(referralId, updates)).rejects.toThrow('Failed to update referral fields');

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/referrals/${referralId}/fields`,
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updates),
      })
    );
  });
});
