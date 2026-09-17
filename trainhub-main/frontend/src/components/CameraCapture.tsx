import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './ui/Modal'
import Button from './ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onCapture: (dataUri: string) => void
}

export default function CameraCapture({ open, onClose, onCapture }: Props) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError(t('account.camera_error')))

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [open, t])

  function handleCapture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    onCapture(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <Modal open={open} onClose={onClose} title={t('account.take_live_photo')}>
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="w-full scale-x-[-1] rounded-xl bg-ink-900" />
        )}
        <Button onClick={handleCapture} disabled={!!error} className="w-full">
          {t('account.capture_photo')}
        </Button>
      </div>
    </Modal>
  )
}
