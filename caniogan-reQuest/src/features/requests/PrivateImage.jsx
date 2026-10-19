import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/authContext';
import { getRequestImageBlob, mediaErrorMessage } from './mediaService';
import './private-image.css';

export default function PrivateImage({ requestId, imageId, alt, className = '' }) {
  const { t } = useTranslation();
  const { user, account, loading, error: sessionError } = useAuth();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!user || !account || loading || sessionError) return;
    const controller = new AbortController();
    let objectUrl;
    getRequestImageBlob(requestId, imageId, { signal: controller.signal }).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = URL.createObjectURL(blob);
      setResult({ user, account, requestId, imageId, attempt, url: objectUrl });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ user, account, requestId, imageId, attempt, error });
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user, account, loading, sessionError, requestId, imageId, attempt]);
  const current = !loading && !sessionError && user && account && result?.user === user && result?.account === account &&
    result?.requestId === requestId && result?.imageId === imageId && result?.attempt === attempt ? result : null;
  if (current?.url) return <img src={current.url} alt={alt} className={className} />;
  return <div className={`private-image-placeholder ${className}`} role="group" aria-label={alt}>
    {current?.error ? <>
      <p role="status">{t(mediaErrorMessage(current.error))}</p>
      <button type="button" onClick={() => setAttempt(value => value + 1)}>{t('Subukang muli ang larawan')}</button>
    </> : <p role="status">{t(user && !sessionError ? 'Kinukuha ang larawan…' : 'Mag-sign in muli para makita ang mga larawan.')}</p>}
  </div>;
}
