import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api, apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Input, PasswordInput } from '../components/ui/Field'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import Avatar from '../components/ui/Avatar'
import CameraCapture from '../components/CameraCapture'
import type { User } from '../api/types'
import { resizeImageToDataUri } from '../utils/image'

export default function Account() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const idDocumentInputRef = useRef<HTMLInputElement>(null)

  const [idDocError, setIdDocError] = useState('')
  const [idDocSaving, setIdDocSaving] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [livePhotoError, setLivePhotoError] = useState('')
  const [livePhotoSaving, setLivePhotoSaving] = useState(false)

  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [birthday, setBirthday] = useState(user?.birthday || '')
  const [detailsError, setDetailsError] = useState('')
  const [detailsSuccess, setDetailsSuccess] = useState('')
  const [detailsSaving, setDetailsSaving] = useState(false)

  const [photoError, setPhotoError] = useState('')
  const [photoSaving, setPhotoSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault()
    setDetailsError('')
    setDetailsSuccess('')
    setDetailsSaving(true)
    try {
      const { data } = await api.put<User>('/users/me', {
        first_name: firstName,
        last_name: lastName,
        birthday,
      })
      setUser(data)
      setDetailsSuccess(t('account.details_saved'))
    } catch (err) {
      setDetailsError(apiErrorMessage(err, t('common.error')))
    } finally {
      setDetailsSaving(false)
    }
  }

  async function handlePhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    setPhotoSaving(true)
    try {
      const dataUri = await resizeImageToDataUri(file)
      const { data } = await api.put<User>('/users/me/photo', { photo_data: dataUri })
      setUser(data)
    } catch (err) {
      setPhotoError(apiErrorMessage(err, t('common.error')))
    } finally {
      setPhotoSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemovePhoto() {
    setPhotoSaving(true)
    try {
      const { data } = await api.delete<User>('/users/me/photo')
      setUser(data)
    } finally {
      setPhotoSaving(false)
    }
  }

  async function handleIdDocumentSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIdDocError('')
    setIdDocSaving(true)
    try {
      const dataUri = await resizeImageToDataUri(file, 1000)
      const { data } = await api.put<User>('/users/me/id-document', { photo_data: dataUri })
      setUser(data)
    } catch (err) {
      setIdDocError(apiErrorMessage(err, t('common.error')))
    } finally {
      setIdDocSaving(false)
      if (idDocumentInputRef.current) idDocumentInputRef.current.value = ''
    }
  }

  async function handleLivePhotoCaptured(dataUri: string) {
    setCameraOpen(false)
    setLivePhotoError('')
    setLivePhotoSaving(true)
    try {
      const { data } = await api.put<User>('/users/me/live-photo', { photo_data: dataUri })
      setUser(data)
    } catch (err) {
      setLivePhotoError(apiErrorMessage(err, t('common.error')))
    } finally {
      setLivePhotoSaving(false)
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSaving(true)
    try {
      await api.post('/users/me/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      })
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setPasswordSuccess(t('account.password_changed'))
    } catch (err) {
      setPasswordError(apiErrorMessage(err, t('common.error')))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title={t('account.title')} />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 font-semibold text-ink-800">{t('account.photo')}</h2>
          <div className="flex items-center gap-4">
            <Avatar
              photoUrl={user?.photo_url}
              firstName={user?.first_name}
              lastName={user?.last_name}
              verified={user?.is_verified}
              size="xl"
            />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={photoSaving}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('account.upload_photo')}
                </Button>
                {user?.photo_url && (
                  <Button type="button" variant="danger" size="sm" onClick={handleRemovePhoto} disabled={photoSaving}>
                    {t('common.delete')}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelected}
              />
              {photoError && <p className="text-sm text-red-600">{photoError}</p>}
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-semibold text-ink-800">{t('account.verification')}</h2>
            {user?.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                ✓ {t('account.verified')}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-ink-500">{t('account.verification_desc')}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-ink-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700">{t('account.id_document')}</span>
                {user?.has_id_document && <span className="text-brand-600">✓</span>}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={idDocSaving}
                onClick={() => idDocumentInputRef.current?.click()}
              >
                {user?.has_id_document ? t('account.replace_photo') : t('account.upload_photo')}
              </Button>
              <input
                ref={idDocumentInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleIdDocumentSelected}
              />
              {idDocError && <p className="mt-2 text-sm text-red-600">{idDocError}</p>}
            </div>

            <div className="rounded-xl border border-ink-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-700">{t('account.live_photo')}</span>
                {user?.has_live_photo && <span className="text-brand-600">✓</span>}
              </div>
              <Button type="button" variant="secondary" size="sm" loading={livePhotoSaving} onClick={() => setCameraOpen(true)}>
                {user?.has_live_photo ? t('account.retake_photo') : t('account.take_live_photo')}
              </Button>
              {livePhotoError && <p className="mt-2 text-sm text-red-600">{livePhotoError}</p>}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink-800">{t('account.personal_details')}</h2>
          <form onSubmit={handleDetailsSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t('auth.first_name')}
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                label={t('auth.last_name')}
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              label={t('auth.birthday')}
              type="date"
              required
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />

            {detailsSuccess && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{detailsSuccess}</p>
            )}
            {detailsError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{detailsError}</p>}

            <Button type="submit" loading={detailsSaving} className="self-start">
              {t('common.save')}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink-800">{t('account.change_password')}</h2>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <PasswordInput
              label={t('account.current_password')}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PasswordInput
                label={t('auth.new_password')}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordInput
                label={t('auth.new_password_confirm')}
                required
                minLength={6}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>

            {passwordSuccess && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{passwordSuccess}</p>
            )}
            {passwordError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{passwordError}</p>}

            <Button type="submit" loading={passwordSaving} className="self-start">
              {t('account.change_password')}
            </Button>
          </form>
        </Card>
      </div>

      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={handleLivePhotoCaptured} />
    </div>
  )
}
