import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { getFreeRooms } from '../../../services/api';
import FreeRooms from '../FreeRooms';

jest.mock('../../../services/api');

describe('FreeRooms Component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and displays free rooms', async () => {
    const mockRooms = {
      day: 'Monday',
      timeSlot: '8 AM',
      totalFreeRooms: 3,
      rooms: {
        NC: [{ roomNumber: 'NC101' }],
        NR: [{ roomNumber: 'NR101' }],
        LAB: [{ roomNumber: 'LAB101' }]
      }
    };

    (getFreeRooms as jest.Mock).mockResolvedValueOnce(mockRooms);

    await act(async () => {
      render(<FreeRooms />);
    });

    // Wait for the loading state to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify rooms are displayed
    expect(screen.getByText('NC101')).toBeInTheDocument();
    expect(screen.getByText('NR101')).toBeInTheDocument();
    expect(screen.getByText('LAB101')).toBeInTheDocument();
  });

  it('handles errors appropriately', async () => {
    const errorMessage = 'Failed to fetch rooms';
    (getFreeRooms as jest.Mock).mockRejectedValueOnce({
      message: errorMessage
    });

    await act(async () => {
      render(<FreeRooms />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('free-rooms-error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch rooms/i)).toBeInTheDocument();
    });
  });
});
