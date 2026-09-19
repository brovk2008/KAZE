import { useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useRouteStore } from '../store/routeStore'
import { API } from '../api'
import type { WsMessage } from '../types'

export function useRouteWebSocket() {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { setRoute, setLiveConnected, appendEvent, updateNodeAqi } = useRouteStore()

  const connect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = null
    }

    try {
      ws.current = new WebSocket(API.ws)
    } catch {
      scheduleReconnect()
      return
    }

    ws.current.onopen = () => {
      setLiveConnected(true)
      appendEvent({ type: 'system', time: new Date().toISOString(), detail: 'Live WebSocket connected' })
    }

    ws.current.onmessage = (ev: MessageEvent) => {
      let msg: WsMessage
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }

      if (msg.event === 'pong') return

      if (msg.route) setRoute(msg.route)

      if (msg.event === 'aqi_update' && msg.spiked_node) {
        updateNodeAqi(msg.spiked_node, msg.new_aqi ?? 0, 'Severe', '#800000')
        appendEvent({
          type: 'spike',
          time: msg.timestamp ?? new Date().toISOString(),
          detail: `🚨 AQI spike at ${msg.spiked_node}: ${msg.previous_aqi} → ${msg.new_aqi}`,
        })
        toast.error(`⚠️ AQI Spike: ${msg.spiked_node} → ${msg.new_aqi}`, { duration: 5000 })
      }

      if (msg.event === 'aqi_sync') {
        appendEvent({
          type: 'sync',
          time: msg.timestamp ?? new Date().toISOString(),
          detail: `🔄 Hourly AQI sync — ${msg.updated_nodes ?? 0} nodes updated`,
        })
        toast.success('AQI data synced from CPCB', { duration: 3000 })
      }

      if (msg.event === 'aqi_reset' && msg.neighborhood) {
        appendEvent({
          type: 'reset',
          time: msg.timestamp ?? new Date().toISOString(),
          detail: `↩ ${msg.neighborhood} restored to AQI ${msg.restored_aqi}`,
        })
      }
    }

    ws.current.onerror = () => {
      setLiveConnected(false)
    }

    ws.current.onclose = () => {
      setLiveConnected(false)
      scheduleReconnect()
    }

    // Keep alive ping every 25s
    const ping = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send('ping')
      }
    }, 25_000)

    return () => clearInterval(ping)
  }, [setRoute, setLiveConnected, appendEvent, updateNodeAqi])

  function scheduleReconnect() {
    reconnectTimer.current = setTimeout(connect, 3000)
  }

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])
}
