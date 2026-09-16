import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusPage } from './BusPage'
import { resetStores } from '../../test/resetStores'
import { useAppStore } from '../../store/appStore'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

/** An instant `mins` minutes out, plus a few seconds so the floor in
 *  minutesUntil cannot land a tick early and make the test flaky. */
const inMinutes = (mins: number) => new Date(Date.now() + mins * 60_000 + 5_000).toISOString()

/**
 * One stop served in both directions — which is what the live API returns,
 * and the reason parseEtas filters at all.
 */
const etaBody = () => ({
  data: [
    {
      co: 'KMB',
      route: '1A',
      dir: 'O',
      service_type: 1,
      eta_seq: 2,
      eta: inMinutes(9),
      dest_en: 'Star Ferry',
      data_timestamp: new Date().toISOString(),
    },
    {
      co: 'KMB',
      route: '1A',
      dir: 'O',
      service_type: 1,
      eta_seq: 1,
      eta: inMinutes(3),
      dest_en: 'Star Ferry',
      data_timestamp: new Date().toISOString(),
    },
    {
      co: 'KMB',
      route: '1A',
      dir: 'I',
      service_type: 1,
      eta_seq: 1,
      eta: inMinutes(1),
      dest_en: 'Sau Mau Ping',
      data_timestamp: new Date().toISOString(),
    },
  ],
})

/** Arrivals come from the stub; the picker's route list is answered empty so
 *  its own mount does not need fixtures. */
const stubBusApi = () => {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    return {
      ok: true,
      json: async () => (url.includes('/eta/') ? etaBody() : { data: [] }),
    } as Response
  }) as unknown as typeof fetch
}

const addStop = () =>
  useAppStore.getState().addBusStop({
    operator: 'KMB',
    route: '1A',
    direction: 'outbound',
    serviceType: '1',
    stopId: 'A3ADF4CD2B0E7C6D',
    stopName: 'Nathan Road',
    destination: 'Star Ferry',
  })

describe('BusPage', () => {
  it('shows only the watched direction, then renames and removes the stop', async () => {
    resetStores()
    stubBusApi()
    addStop()
    const user = userEvent.setup()
    const view = render(<BusPage />)

    expect(await screen.findByText('3 min')).toBeInTheDocument()
    expect(screen.getByText('9 min')).toBeInTheDocument()
    // The inbound row shares the stop and the response, and must never show.
    expect(screen.queryByText('1 min')).toBeNull()

    await user.click(screen.getByTitle('Rename stop'))
    await user.type(screen.getByLabelText('Stop name'), 'Home stop{Enter}')
    expect(useAppStore.getState().busStops[0]?.label).toBe('Home stop')
    // The operator name stays visible underneath, so the override never hides
    // which stop it actually is.
    expect(screen.getByText('Home stop')).toBeInTheDocument()
    expect(screen.getByText(/Nathan Road/)).toBeInTheDocument()

    await user.click(screen.getByTitle('Remove stop'))
    expect(useAppStore.getState().busStops).toHaveLength(0)
    expect(screen.getByText(/No stops yet/)).toBeInTheDocument()
    view.unmount()
  })

  it('adding the same stop twice keeps one tile', () => {
    resetStores()
    const first = addStop()
    const second = addStop()
    expect(second.id).toBe(first.id)
    expect(useAppStore.getState().busStops).toHaveLength(1)
  })
})
